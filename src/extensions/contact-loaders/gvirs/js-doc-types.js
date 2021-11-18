/**
 * @typedef GvirsApiConnectionData
 * @property {string} domain
 * @property {string} appId
 * @property {string} apiKey
 */

/**
 * @typedef GvirsApiQuery
 * @property {object} [search_tree]
 * @property {number} [id]
 */

/**
 * @typedef GvirsApiParams
 * @property {number} [limit=100]
 * @property {array} [select_fields] If not set, all fields are selected
 * @property {number} [offset=0]
 * @property {boolean} [no_limit=false]
 * @property {object} [from_alias_search_trees]
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
