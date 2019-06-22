
exports.up = function(knex, Promise) {
  const alterMessage = knex.schema.alterTable('message', (table) => {
    // ALTER TABLE message
    // ADD COLUMN campaign_contact_id integer default null,
    // ADD COLUMN messageservice_sid varchar(255) default null
    table.integer('campaign_contact_id')
      .unsigned()
      .nullable()
      .default(null)
      .index()
      .references('campaign_contact.id')
    table.string('messageservice_sid')
      .nullable()
      .default(null)
      .index()
  }).then(() => {
    const query = 'UPDATE message ' +
          'SET campaign_contact_id = cc.id ' +
          'FROM campaign_contact cc ' + 
          'WHERE message.contact_number = cc.cell and message.assignment_id = cc.assignment_id'
    return knex.raw(query)
  })

  const alterOrganization = knex.schema.alterTable('organization', (table) => {
    table.string('messageservice_sid')
      .nullable()
      .default(null)
      .index()
  })
  /*
  const dropMessageIndexes = knex.schema.alterTable('message', (table) => {
    table.dropIndex('user_id')
    table.dropIndex('assignment_id')
    table.dropIndex('user_number')
    table.dropIndex('contact_number')
  })
  */
  return Promise.all([alterMessage, alterOrganization//, dropMessageIndexes
                     ]);
};

exports.down = function(knex, Promise) {
  const alterMessage = knex.schema.alterTable("message", table => {
    table.dropForeign("campaign_contact_id");
    table.dropColumn("campaign_contact_id");

    table.index('user_id')
    table.index('assignment_id')
    table.index('user_number')
    table.index('contact_number')
  });

  const alterOrganization = knex.schema.alterTable("organization", table => {
    table.dropColumn("messageservice_sid");
  });

  return Promise.all([alterMessage, AlterOrganization])
};
