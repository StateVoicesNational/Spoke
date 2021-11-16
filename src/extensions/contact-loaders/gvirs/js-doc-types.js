/**
 * @typedef GvirsApiConnectionData
 * @property {string} domain
 * @property {string} appId
 * @property {string} apiKey
 */

/**
 * @typedef GvirsApiQuery
 * @property {object} [searchTree]
 * @property {number} [id]
 */

/**
 * @typedef GvirsApiParams
 * @property {number} [limit=100]
 * @property {array} [selectFields] If not set, all fields are selected
 * @property {number} [offset=0]
 * @property {boolean} [noLimit=false]
 * @property {object} [fromAliasSearchTrees]
 */

/**
 * @typedef GvirsApiSuccessfulResult
 * @property {'success'} status
 * @property {object} [entity]
 * @property {object[]} [entities]
 * @property {number} [count]
 * @property {number} [limit]
 * @property {string} entity_class
 * @property {string} entity_load_type
 * @property {object} server_time
 * @property {object} [debug]
 */
