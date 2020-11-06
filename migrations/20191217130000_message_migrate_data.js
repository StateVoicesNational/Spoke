exports.up = function(knex) {
  // NOTE: this could be an expensive migration which locks tables for some time, if you have millions of message rows
  // In that case, we recommend performing this migration manually during planned downtime
  const isPostgres = /pg/.test(knex.client.config.client);
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
  return query;
};

exports.down = function(knex) {
  // it's unnecessary to do a reverse of this action
  // since the previous migration going up/down will drop the columns entirely
};
