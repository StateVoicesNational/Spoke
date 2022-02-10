// Add actions columns to canned_response
exports.up = function(knex) {
  return knex.schema.alterTable("canned_response", table => {
    table.text("answer_actions").nullable();
    table.text("answer_actions_data").nullable();
  });
};

// Drop actions columns from canned_response
exports.down = function(knex) {
  return knex.schema.alterTable("canned_response", table => {
    table.dropColumn("answer_actions");
    table.dropColumn("answer_actions_data");
  });
};
