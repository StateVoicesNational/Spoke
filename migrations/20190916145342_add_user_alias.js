
exports.up = function (knex) {
  return knex.schema.table("user", function (table) {
    table.string("alias").defaultTo("");
  });
};

exports.down = function (knex, Promise) {

};
