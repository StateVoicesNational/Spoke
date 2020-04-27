exports.up = function(knex, Promise) {
  // NOTE: this could be an expensive migration which locks tables for some time, if you have millions of message rows
  // In that case, we recommend performing this migration manually during planned downtime
  const isPostgres = knex.client.config.client === "pg";
  const isSqlite = /sqlite/.test(knex.client.config.client);
  let query = null;

  if (isPostgres) {
    query = knex.schema.raw(
      `UPDATE message SET campaign_contact_id=cc.id FROM campaign_contact cc WHERE cc.cell=message.contact_number AND cc.assignment_id = message.assignment_id`
    );
  } else {
    const subQuery = knex
      .select("cc.id")
      .from("campaign_contact AS cc")
      .where({
        "cc.assignment_id": knex.raw("m.assignment_id"),
        "cc.cell": knex.raw("m.contact_number")
      });
    query = knex.update("campaign_contact_id", subQuery).table("message AS m");
  }

  if (process.env.TWILIO_MESSAGE_SERVICE_SID) {
    query = query.then(() => {
      // If you run this manually you can limit it to active campaigns
      return knex
        .table("message")
        .update("messageservice_sid", process.env.TWILIO_MESSAGE_SERVICE_SID);
    });
  }
  if (isSqlite) {
    // since altering tables isn't possible in sqlite from the previous migration, we want to delete and re-add the column
    // AFTER we have copied the campaign_contact_ids based on the assignment_id column
    query = query
      .then(() => {
        return knex.schema.alterTable("message", table => {
          table.dropColumn("assignment_id");
        });
      })
      .then(() => {
        return knex.schema.alterTable("message", table => {
          table.integer("assignment_id").nullable();
        });
      });
  }
  return query;
};

exports.down = function(knex, Promise) {
  // it's unnecessary to do a reverse of this action
  // since the previous migration going up/down will drop the columns entirely
};
