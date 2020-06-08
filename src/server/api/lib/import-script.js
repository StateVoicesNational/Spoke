import { google } from "googleapis";

import _ from "lodash";
import { compose, map, reduce, getOr, find, filter, has } from "lodash/fp";

import { r, cacheableData } from "../../models";
import { getConfig } from "./config";

const textRegex = RegExp(".*[A-Za-z0-9]+.*");

const getDocument = async documentId => {
  const auth = google.auth.fromJSON(JSON.parse(getConfig("GOOGLE_SECRET")));
  auth.scopes = ["https://www.googleapis.com/auth/documents"];

  const docs = google.docs({
    version: "v1",
    auth
  });

  let result = null;
  try {
    result = await docs.documents.get({
      documentId
    });
  } catch (err) {
    console.log(err);
    throw new Error(err.message);
  }
  return result;
};

const getParagraphStyle = getOr("", "paragraph.paragraphStyle.namedStyleType");
const getTextRun = getOr("", "textRun.content");
const sanitizeTextRun = textRun => textRun.replace("\n", "");
const getSanitizedTextRun = compose(sanitizeTextRun, getTextRun);
const concat = (left, right) => left.concat(right);
const reduceStrings = reduce(concat, String());
const getParagraphText = compose(
  reduceStrings,
  map(getSanitizedTextRun),
  getOr([], "paragraph.elements")
);
const getParagraphIndent = getOr(
  0,
  "paragraph.paragraphStyle.indentFirstLine.magnitude"
);
const getParagraphBold = compose(
  getOr(false, "textRun.textStyle.bold"),
  find(getTextRun),
  getOr([], "paragraph.elements")
);
const getParagraph = element => ({
  style: getParagraphStyle(element),
  indent: getParagraphIndent(element),
  isParagraphBold: getParagraphBold(element),
  text: getParagraphText(element)
});
const hasParagraph = has("paragraph");
const hasText = paragraph =>
  !!paragraph.text && textRegex.test(paragraph.text.trim());
const pushAndReturnSection = sections => {
  const newSection = {
    paragraphs: []
  };
  sections.push(newSection);
  return newSection;
};

const getLastSection = sections =>
  _.last(sections) || pushAndReturnSection(sections);

const addParagraph = (accumulatorInput, value) => {
  const accumulator = accumulatorInput || [];
  getLastSection(accumulator).paragraphs.push(value);
  return accumulator;
};

const sanitizeHeaderText = header => header.replace(/[^A-Za-z0-9 ]/g, "");

const addHeader = (accumulatorInput, value) => {
  const accumulator = accumulatorInput || [];
  accumulator.push(
    _.assign(_.clone(value), {
      text: sanitizeHeaderText(value.text),
      paragraphs: []
    })
  );
  return accumulator;
};

const addSection = (accumulator, value) =>
  value.style === "HEADING_2"
    ? addHeader(accumulator, value)
    : addParagraph(accumulator, value);

const getSections = compose(
  reduce(addSection, null),
  filter(hasText),
  map(getParagraph),
  filter(hasParagraph)
);

const getSectionParagraphs = (sections, heading) =>
  (
    sections.find(
      section =>
        section.text &&
        section.text.toLowerCase().match(new RegExp(heading.toLowerCase()))
    ) || {}
  ).paragraphs;

const getInteractions = sections =>
  getSectionParagraphs(sections, "Interactions");
const getCannedResponses = sections =>
  getSectionParagraphs(sections, "Canned Responses");

const isNextChunkAQuestion = (interactionParagraphs, currentIndent) =>
  interactionParagraphs.length > 1 &&
  interactionParagraphs[0].indent === currentIndent &&
  interactionParagraphs[1].indent > currentIndent &&
  interactionParagraphs[1].isParagraphBold;

const isNextChunkAnAnswer = (interactionParagraphs, currentIndent) =>
  interactionParagraphs.length > 1 &&
  interactionParagraphs[0].indent === currentIndent &&
  interactionParagraphs[1].indent === currentIndent &&
  !interactionParagraphs[1].isParagraphBold;

const isError = (interactionParagraphs, currentIndent) =>
  interactionParagraphs.length > 1 &&
  interactionParagraphs[0].indent === currentIndent &&
  ((interactionParagraphs[1].indent === currentIndent &&
    interactionParagraphs[1].isParagraphBold) ||
    (interactionParagraphs[1].indent > currentIndent &&
      !interactionParagraphs[1].isParagraphBold));

const isThisALeaf = (interactionParagraphs, currentIndent) =>
  interactionParagraphs.length < 2 ||
  interactionParagraphs[1].indent < currentIndent;

const saveCurrentNodeToParent = (parentHierarchyNode, currentHierarchyNode) =>
  parentHierarchyNode &&
  parentHierarchyNode.children.push(currentHierarchyNode);

const throwInteractionsHierarchyError = (
  message,
  interactionsHierarchyNode,
  interactionParagraphs
) => {
  const lookFor = [
    ...(interactionsHierarchyNode.answer
      ? [interactionsHierarchyNode.answer]
      : []),
    ...(interactionsHierarchyNode.script
      ? interactionsHierarchyNode.script
      : []),
    ...(interactionParagraphs[0] ? [interactionParagraphs[0].text] : []),
    ...(interactionParagraphs[1] ? [interactionParagraphs[1].text] : [])
  ].join(" | ");
  throw new Error(`${message} Look for ${lookFor}`);
};

const makeInteractionHierarchy = (
  interactionParagraphs,
  parentHierarchyNode
) => {
  if (
    !interactionParagraphs.length ||
    interactionParagraphs[0].indent <
      (parentHierarchyNode ? parentHierarchyNode.indent : 0)
  ) {
    return parentHierarchyNode;
  }

  const currentIndent = interactionParagraphs[0].indent;

  let interactionsHierarchyNode = undefined;

  while (
    interactionParagraphs[0] &&
    interactionParagraphs[0].indent === currentIndent
  ) {
    interactionsHierarchyNode = {
      children: []
    };

    interactionsHierarchyNode.answer = interactionParagraphs.shift().text;
    interactionsHierarchyNode.script = [];

    while (
      interactionParagraphs.length &&
      !interactionParagraphs[0].isParagraphBold
    ) {
      const interactionParagraph = interactionParagraphs.shift();
      interactionsHierarchyNode.script.push(interactionParagraph.text);
    }

    if (!interactionsHierarchyNode.script[0]) {
      throwInteractionsHierarchyError(
        "Interactions format error -- no script.",
        interactionsHierarchyNode,
        interactionParagraphs
      );
    }

    if (isNextChunkAQuestion(interactionParagraphs, currentIndent)) {
      interactionsHierarchyNode.question = interactionParagraphs.shift().text;
      saveCurrentNodeToParent(parentHierarchyNode, interactionsHierarchyNode);
      makeInteractionHierarchy(
        interactionParagraphs,
        interactionsHierarchyNode
      );
    } else if (isNextChunkAnAnswer(interactionParagraphs, currentIndent)) {
      saveCurrentNodeToParent(parentHierarchyNode, interactionsHierarchyNode);
      makeInteractionHierarchy(interactionParagraphs, parentHierarchyNode);
    } else if (isThisALeaf(interactionParagraphs, currentIndent)) {
      saveCurrentNodeToParent(parentHierarchyNode, interactionsHierarchyNode);
    } else if (isError(interactionParagraphs, currentIndent)) {
      throwInteractionsHierarchyError(
        "Interactions format error.",
        interactionsHierarchyNode,
        interactionParagraphs
      );
    } else {
      throwInteractionsHierarchyError(
        "Interactions unexpected format.",
        interactionsHierarchyNode,
        interactionParagraphs
      );
    }
  }
  return interactionsHierarchyNode;
};

const saveInteractionsHierarchyNode = async (
  trx,
  campaignId,
  interactionsHierarchyNode,
  parentHierarchyNodeId
) => {
  const nodeId = await r.knex
    .insert({
      parent_interaction_id: parentHierarchyNodeId,
      question: interactionsHierarchyNode.question || "",
      script: interactionsHierarchyNode.script.join("\n") || "",
      answer_option: interactionsHierarchyNode.answer || "",
      answer_actions: "",
      answer_actions_data: "",
      campaign_id: campaignId,
      is_deleted: false
    })
    .into("interaction_step")
    .transacting(trx)
    .returning("id");

  for (const child of interactionsHierarchyNode.children) {
    await saveInteractionsHierarchyNode(trx, campaignId, child, nodeId[0]);
  }
};

const replaceInteractionsInDatabase = async (
  campaignId,
  interactionsHierarchy
) => {
  await r.knex.transaction(async trx => {
    try {
      await r
        .knex("interaction_step")
        .transacting(trx)
        .where({
          campaign_id: campaignId
        })
        .delete();

      await saveInteractionsHierarchyNode(
        trx,
        campaignId,
        interactionsHierarchy,
        null
      );
    } catch (exception) {
      console.log(exception);
      throw exception;
    }
  });
};

const makeCannedResponsesList = cannedResponsesParagraphs => {
  const cannedResponses = [];
  while (cannedResponsesParagraphs[0]) {
    const cannedResponse = {
      text: []
    };

    const paragraph = cannedResponsesParagraphs.shift();
    if (!paragraph.isParagraphBold) {
      throw new Error(
        `Canned responses format error -- can't find a bold paragraph. Look for [${paragraph.text}]`
      );
    }
    cannedResponse.title = paragraph.text;

    while (
      cannedResponsesParagraphs[0] &&
      !cannedResponsesParagraphs[0].isParagraphBold
    ) {
      const textParagraph = cannedResponsesParagraphs.shift();
      cannedResponse.text.push(textParagraph.text);
    }

    if (!cannedResponse.text[0]) {
      throw new Error(
        `Canned responses format error -- canned response has no text. Look for [${cannedResponse.title}]`
      );
    }

    cannedResponses.push(cannedResponse);
  }

  return cannedResponses;
};

const replaceCannedResponsesInDatabase = async (
  campaignId,
  cannedResponses
) => {
  await r.knex.transaction(async trx => {
    try {
      await r
        .knex("canned_response")
        .transacting(trx)
        .where({
          campaign_id: campaignId
        })
        .whereNull("user_id")
        .delete();

      for (const cannedResponse of cannedResponses) {
        await r.knex
          .insert({
            campaign_id: campaignId,
            user_id: null,
            title: cannedResponse.title,
            text: cannedResponse.text.join("\n")
          })
          .into("canned_response")
          .transacting(trx);
      }
    } catch (exception) {
      console.log(exception);
      throw exception;
    }
  });
};

const importScriptFromDocument = async (campaignId, scriptUrl) => {
  const match = scriptUrl.match(/document\/d\/(.*)\//);
  if (!match || !match[1]) {
    throw new Error(`Invalid URL. This doesn't seem like a Google Docs URL.`);
  }
  const documentId = match[1];
  let result;
  try {
    result = await getDocument(documentId);
  } catch (err) {
    console.error("ImportScript Failed", err);
    throw new Error(
      `Retrieving Google doc failed due to access, secret config, or invalid google url`
    );
  }
  const document = result.data.body.content;
  const sections = getSections(document);

  const interactionParagraphs = getInteractions(sections);
  const interactionsHierarchy = makeInteractionHierarchy(
    _.clone(interactionParagraphs),
    null,
    0
  );
  await replaceInteractionsInDatabase(campaignId, interactionsHierarchy);

  const cannedResponsesParagraphs = getCannedResponses(sections);
  const cannedResponsesList = makeCannedResponsesList(
    _.clone(cannedResponsesParagraphs)
  );
  await replaceCannedResponsesInDatabase(campaignId, cannedResponsesList);
  await cacheableData.campaign.reload(campaignId);
  await cacheableData.cannedResponse.clearQuery({ campaignId });
};

export default importScriptFromDocument;
