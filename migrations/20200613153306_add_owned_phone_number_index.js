exports.up = async knex => {
  await knex.schema.alterTable("owned_phone_number", table => {
    table.index(
      ["allocated_to", "allocated_to_id"],
      "allocation_type_and_id_idx"
    );
  });
};

exports.down = async knex => {
  await knex.schema.alterTable("owned_phone_number", table => {
    table.dropIndex(
      ["allocated_to", "allocated_to_id"],
      "allocation_type_and_id_idx"
    );
  });
};
