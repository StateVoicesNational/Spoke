exports.up = knex => {
  console.log("------ HELLO SET UP", 1);
  return knex.schema.table("organization", table => {
    console.log("------ HELLO SET UP", 2);
    table.json("theme").defaultTo(null);
  });
};

exports.down = knex => {
  return knex.schema.table("organization", table => {
    table.dropColumn("theme");
  });
};
