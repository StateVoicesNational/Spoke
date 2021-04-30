import escapeRegExp from "lodash/escapeRegExp";
import humps from "humps";

export function mapFieldsOrNull(fields) {
  const resolvers = {};

  fields.forEach(field => {
    resolvers[field] = o => o[field] || null;
  });
  return resolvers;
}

export function mapFieldsToModel(fields, model) {
  const resolvers = {};

  fields.forEach(field => {
    const snakeKey = humps.decamelize(field, { separator: "_" });
    // eslint-disable-next-line no-underscore-dangle
    if (model._schema._schema.hasOwnProperty(snakeKey)) {
      if (/At$/.test(field)) {
        // force a Date-type: esp. important for sqlite
        resolvers[field] = instance =>
          instance[snakeKey] ? new Date(instance[snakeKey]) : null;
      } else {
        resolvers[field] = instance => instance[snakeKey];
      }
    } else {
      // eslint-disable-next-line no-underscore-dangle
      throw new Error(
        `Could not find key ${snakeKey} in model ${model._schema._model._name}`
      );
    }
  });
  return resolvers;
}

export const capitalizeWord = word => {
  if (word) {
    return word[0].toUpperCase() + word.slice(1);
  }
  return "";
};

export const groupCannedResponses = cannedResponses => {
  const grouped = [];
  let current = null;
  cannedResponses.forEach(result => {
    const res = { ...result };
    if (!current || res.id !== current.id) {
      res.tagIds = [];
      grouped.push(res);
      current = res;
    }
    if (res.tag_id) {
      current.tagIds.push(res.tag_id);
    }
  });
  return grouped;
};

export const replaceAll = (str, find, replace) =>
  str.replace(new RegExp(escapeRegExp(find), "g"), replace);
