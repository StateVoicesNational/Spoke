import {
  createStartedCampaign,
  createScript,
  setupTest,
  cleanupTest,
  sleep
} from "../../test_helpers";
import { r, cacheableData } from "../../../src/server/models";

describe("questionResponse cacheableData methods", async () => {
  let initData;
  beforeEach(async () => {
    await setupTest();
    initData = await createStartedCampaign();
  }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

  afterEach(async () => {
    await cleanupTest();
    if (r.redis) r.redis.flushdb();
  }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

  it("save and load", async () => {
    const cid = initData.testContacts[0].id;
    await createScript(initData.testAdminUser, initData.testCampaign, {
      steps: 3,
      choices: 2
    });
    const interactionSteps = await r.knex("interaction_step").select();

    let saveResult = await cacheableData.questionResponse.save(cid, [
      { interactionStepId: "1", value: "hmm1" }
    ]);
    expect(saveResult).toEqual({
      new: {
        "1": {
          interactionStepId: "1",
          value: "hmm1"
        }
      },
      updated: {},
      unchanged: {}
    });

    let questionResponses = await r.knex("question_response").select();
    expect(questionResponses.length).toBe(1);
    expect(questionResponses[0].value).toBe("hmm1");
    expect(questionResponses[0].interaction_step_id).toBe(1);
    let firstCreatedAt = questionResponses[0].created_at;
    // cached
    questionResponses = await cacheableData.questionResponse.query(cid, true);
    expect(questionResponses.length).toBe(1);
    expect(questionResponses[0].value).toBe("hmm1");
    expect(questionResponses[0].interaction_step_id).toBe(1);
    await sleep(20);

    // change value adding one
    saveResult = await cacheableData.questionResponse.save(cid, [
      { interactionStepId: "1", value: "hmm1" },
      { interactionStepId: "2", value: "1hmm2" }
    ]);
    expect(saveResult).toEqual({
      new: {
        "2": {
          interactionStepId: "2",
          value: "1hmm2"
        }
      },
      updated: {},
      unchanged: {
        "1": {
          interactionStepId: "1",
          value: "hmm1"
        }
      }
    });

    questionResponses = await r.knex("question_response").select();
    expect(questionResponses.length).toBe(2);
    expect(questionResponses[0].value).toBe("hmm1");
    expect(questionResponses[0].interaction_step_id).toBe(1);
    expect(Number(questionResponses[0].created_at)).toBe(
      Number(firstCreatedAt)
    );
  });
});
