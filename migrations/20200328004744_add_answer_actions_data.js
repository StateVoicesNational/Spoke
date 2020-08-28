// Add answer_actions_data column to interaction_step
exports.up = function(knex) {
  return knex.schema.alterTable("interaction_step", table => {
    table.text("answer_actions_data").nullable();
  });
};

// Drop answer_actions_data column from interaction_step
exports.down = function(knex) {
  return knex.schema.alterTable("interaction_step", table => {
    table.dropColumn("answer_actions_data");
  });
};
