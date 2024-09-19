exports.up = function(knex) {
  return knex.schema.alterTable("interaction_step", (table) => {
    table.dropForeign("parent_interaction_id");
    table.foreign("parent_interaction_id").references("interaction_step.id").onDelete("CASCADE");
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable("interaction_step", (table) => {
    table.dropForeign("parent_interaction_id");
    table.foreign("parent_interaction_id").references("interaction_step.id").onDelete("NO ACTION");
  });  
};
