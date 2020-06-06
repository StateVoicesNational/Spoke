const initialize = async (knex, Promise) => {
  // This object's keys are table names and each key's value is a function that defines that table's schema.
  const isSqlite = /sqlite/.test(knex.client.config.client);
  const buildTableSchema = [
    {
      tableName: "user",
      create: t => {
        t.increments("id").primary();
        t.text("auth0_id").notNullable();
        t.text("first_name").notNullable();
        t.text("last_name").notNullable();
        t.text("cell").notNullable();
        t.text("email").notNullable();
        t.timestamp("created_at")
          .notNullable()
          .defaultTo(knex.fn.now());
        t.text("assigned_cell");
        t.boolean("is_superadmin");
        t.boolean("terms").defaultTo(false);
      }
    },
    {
      tableName: "pending_message_part",
      create: t => {
        t.increments("id").primary();
        t.text("service").notNullable();
        t.text("service_id").notNullable();
        t.text("parent_id").defaultTo("");
        t.text("service_message").notNullable();
        t.text("user_number")
          .notNullable()
          .defaultTo("");
        t.text("contact_number").notNullable();
        t.timestamp("created_at")
          .defaultTo(knex.fn.now())
          .notNullable();

        t.index("parent_id");
        t.index("service");
      }
    },
    {
      tableName: "organization",
      create: t => {
        t.increments("id");
        t.text("uuid");
        t.text("name").notNullable();
        t.timestamp("created_at")
          .defaultTo(knex.fn.now())
          .notNullable();
        t.text("features").defaultTo("");
        t.boolean("texting_hours_enforced").defaultTo(false);
        t.integer("texting_hours_start").defaultTo(9);
        t.integer("texting_hours_end").defaultTo(21);
      }
    },
    {
      tableName: "campaign",
      create: t => {
        t.increments("id");
        t.integer("organization_id").notNullable();
        t.text("title")
          .notNullable()
          .defaultTo("");
        t.text("description")
          .notNullable()
          .defaultTo("");
        t.boolean("is_started");
        t.timestamp("due_by").defaultTo(null);
        t.timestamp("created_at")
          .notNullable()
          .defaultTo(knex.fn.now());
        t.boolean("is_archived");
        t.boolean("use_dynamic_assignment");
        t.text("logo_image_url");
        t.text("intro_html");
        t.text("primary_color");
        t.boolean("override_organization_texting_hours").defaultTo(false);
        t.boolean("texting_hours_enforced").defaultTo(true);
        t.integer("texting_hours_start").defaultTo(9);
        t.integer("texting_hours_end").defaultTo(21);
        t.text("timezone").defaultTo("US/Eastern");

        t.index("organization_id");
        t.foreign("organization_id").references("organization.id");
        t.integer("creator_id")
          .unsigned()
          .nullable()
          .default(null)
          .index()
          .references("user.id");
      }
    },
    {
      tableName: "assignment",
      create: t => {
        t.increments("id");
        t.integer("user_id").notNullable();
        t.integer("campaign_id").notNullable();
        t.timestamp("created_at")
          .defaultTo(knex.fn.now())
          .notNullable();
        t.integer("max_contacts");

        t.index("user_id");
        t.foreign("user_id").references("user.id");
        t.index("campaign_id");
        t.foreign("campaign_id").references("campaign.id");
      }
    },
    {
      tableName: "campaign_contact",
      create: t => {
        t.increments("id");
        t.integer("campaign_id").notNullable();
        t.integer("assignment_id");
        t.text("external_id")
          .notNullable()
          .defaultTo("");
        t.text("first_name")
          .notNullable()
          .defaultTo("");
        t.text("last_name")
          .notNullable()
          .defaultTo("");
        t.text("cell").notNullable();
        t.text("zip")
          .defaultTo("")
          .notNullable();
        t.text("custom_fields")
          .notNullable()
          .defaultTo("{}");
        t.timestamp("created_at")
          .defaultTo(knex.fn.now())
          .notNullable();
        t.timestamp("updated_at")
          .defaultTo(knex.fn.now())
          .notNullable();
        t.enu("message_status", [
          "needsMessage",
          "needsResponse",
          "convo",
          "messaged",
          "closed",
          "UPDATING"
        ])
          .defaultTo("needsMessage")
          .notNullable();
        t.boolean("is_opted_out").defaultTo(false);
        t.text("timezone_offset").defaultTo("");
        if (!isSqlite) {
          t.index("assignment_id");
          t.foreign("assignment_id").references("assignment.id");
          t.index("campaign_id");
          t.foreign("campaign_id").references("campaign.id");
        }
        t.index("cell");
        t.index(
          ["campaign_id", "assignment_id"],
          "campaign_contact_campaign_id_assignment_id_index"
        );
        t.index(
          ["assignment_id", "timezone_offset"],
          "campaign_contact_assignment_id_timezone_offset_index"
        ); // See footnote ¹ for clarification on naming.
      }
    },
    {
      tableName: "interaction_step",
      create: t => {
        t.increments("id");
        t.integer("campaign_id").notNullable();
        t.text("question")
          .notNullable()
          .defaultTo("");
        t.text("script")
          .notNullable()
          .defaultTo("");
        t.timestamp("created_at")
          .notNullable()
          .defaultTo(knex.fn.now());

        // FIELDS FOR SUB-INTERACTIONS (only):
        t.integer("parent_interaction_id");
        t.text("answer_option")
          .notNullable()
          .defaultTo("");
        t.text("answer_actions")
          .notNullable()
          .defaultTo("");
        t.boolean("is_deleted")
          .defaultTo(false)
          .notNullable();

        t.index("parent_interaction_id");
        t.foreign("parent_interaction_id").references("interaction_step.id");
        t.index("campaign_id");
        t.foreign("campaign_id").references("campaign.id");
      }
    },
    {
      tableName: "question_response",
      create: t => {
        t.increments("id");
        t.integer("campaign_contact_id").notNullable();
        t.integer("interaction_step_id").notNullable();
        t.text("value").notNullable();
        t.timestamp("created_at")
          .notNullable()
          .defaultTo(knex.fn.now());

        t.index("campaign_contact_id");
        t.foreign("campaign_contact_id").references("campaign_contact.id");
        t.index("interaction_step_id");
        t.foreign("interaction_step_id").references("interaction_step.id");
      }
    },
    {
      tableName: "opt_out",
      create: t => {
        t.increments("id");
        t.text("cell").notNullable();
        t.integer("assignment_id").notNullable();
        t.integer("organization_id").notNullable();
        t.text("reason_code")
          .notNullable()
          .defaultTo("");
        t.timestamp("created_at")
          .notNullable()
          .defaultTo(knex.fn.now());

        t.index("cell");
        t.index("assignment_id");
        t.foreign("assignment_id").references("assignment.id");
        t.index("organization_id");
        t.foreign("organization_id").references("organization.id");
      }
    },
    // The migrations table appears at this position in the list, but Knex manages that table itself, so it's ommitted from the schema builder
    {
      tableName: "job_request",
      create: t => {
        t.increments("id");
        t.integer("campaign_id").notNullable();
        t.text("payload").notNullable();
        t.text("queue_name").notNullable();
        t.text("job_type").notNullable();
        t.text("result_message").defaultTo("");
        t.boolean("locks_queue").defaultTo(false);
        t.boolean("assigned").defaultTo(false);
        t.integer("status").defaultTo(0);
        t.timestamp("updated_at")
          .notNullable()
          .defaultTo(knex.fn.now());
        t.timestamp("created_at")
          .notNullable()
          .defaultTo(knex.fn.now());

        t.index("queue_name");
        t.foreign("campaign_id").references("campaign.id");
      }
    },
    {
      tableName: "invite",
      create: t => {
        t.increments("id");
        t.boolean("is_valid").notNullable();
        t.text("hash");
        t.timestamp("created_at")
          .notNullable()
          .defaultTo(knex.fn.now());

        t.index("is_valid");
      }
    },
    {
      tableName: "canned_response",
      create: t => {
        t.increments("id");
        t.integer("campaign_id").notNullable();
        t.text("text").notNullable();
        t.text("title").notNullable();
        t.integer("user_id");
        t.timestamp("created_at")
          .notNullable()
          .defaultTo(knex.fn.now());

        t.index("campaign_id");
        t.foreign("campaign_id").references("campaign.id");
        t.index("user_id");
        t.foreign("user_id").references("user.id");
      }
    },
    {
      tableName: "user_organization",
      create: t => {
        t.increments("id");
        t.integer("user_id").notNullable();
        t.integer("organization_id").notNullable();

        const roles = ["OWNER", "ADMIN", "SUPERVOLUNTEER", "TEXTER"];
        // In `20200512143258_add_user_roles` we use raw SQL to add some roles for Postgres DBs. For Sqlite DBs we init with all the values because that same raw SQL won't work.
        if (isSqlite) {
          roles.push("VETTED_TEXTER", "ORG_SUPERADMIN", "SUSPENDED");
        }
        t.enu("role", roles).notNullable();
        t.index("user_id");
        t.foreign("user_id").references("user.id");
        t.index("organization_id");
        t.foreign("organization_id").references("organization.id");
        t.index(
          ["organization_id", "user_id"],
          "user_organization_organization_id_user_id_index"
        );
        // rethink-knex-adapter doesn't properly preserve index names when making multicolumn indexes, so the name here ('user_organization_organization_id_user_id_index') is different from the corresponding Thinky model ('organization_user'). However, the underlying PG index that is created has the same name, so the tests pass.¹
      }
    },
    {
      tableName: "user_cell",
      create: t => {
        t.increments("id").primary();
        t.text("cell").notNullable();
        t.integer("user_id").notNullable();
        t.enu("service", ["nexmo", "twilio"]);
        t.boolean("is_primary");

        t.foreign("user_id").references("user.id");
      }
    },
    {
      tableName: "message",
      create: t => {
        t.increments("id").primary();
        t.text("user_number")
          .notNullable()
          .defaultTo("");
        t.integer("user_id");
        t.text("contact_number").notNullable();
        t.boolean("is_from_contact").notNullable();
        t.text("text")
          .notNullable()
          .defaultTo("");
        t.text("service_response")
          .notNullable()
          .defaultTo("");
        t.integer("assignment_id");
        t.text("service")
          .notNullable()
          .defaultTo("");
        t.text("service_id")
          .notNullable()
          .defaultTo("");
        t.enu("send_status", [
          "QUEUED",
          "SENDING",
          "SENT",
          "DELIVERED",
          "ERROR",
          "PAUSED",
          "NOT_ATTEMPTED"
        ]).notNullable();
        t.timestamp("created_at")
          .defaultTo(knex.fn.now())
          .notNullable();
        t.timestamp("queued_at")
          .defaultTo(knex.fn.now())
          .notNullable();
        t.timestamp("sent_at")
          .defaultTo(knex.fn.now())
          .notNullable();
        t.timestamp("service_response_at")
          .defaultTo(knex.fn.now())
          .notNullable();
        t.timestamp("send_before");

        t.index("assignment_id");
        if (!isSqlite) {
          // sqlite seems to bork on foreign declarations
          t.foreign("assignment_id").references("assignment.id");
          t.foreign("user_id").references("user.id");
        }
        t.index("send_status");
        t.index("user_number");
        t.index("contact_number");
        t.index("service_id");
      }
    },
    {
      tableName: "zip_code",
      create: t => {
        t.text("zip")
          .notNullable()
          .primary();
        t.text("city").notNullable();
        t.text("state").notNullable();
        t.float("latitude").notNullable();
        t.float("longitude").notNullable();
        t.float("timezone_offset").notNullable();
        t.boolean("has_dst").notNullable();
      }
    },
    {
      tableName: "log",
      create: t => {
        t.increments("id").primary();
        t.text("message_sid").notNullable();
        t.text("body");
        t.timestamp("created_at")
          .notNullable()
          .defaultTo(knex.fn.now());
      }
    }
  ];

  // For each table in the schema array, check if it exists and create it if necessary. Do these in order, to avoid race conditions surrounding foreign keys.
  const tablePromises = [];
  for (let i = 0; i < buildTableSchema.length; i++) {
    const { tableName, create } = buildTableSchema[i];
    if (!(await knex.schema.hasTable(tableName))) {
      // create is the function that defines the table's schema. knex.schema.createTable calls it with one argument, the table instance (t).
      const result = await knex.schema.createTable(tableName, create);
      tablePromises.push(result);
    }
  }
  return Promise.all(tablePromises);
};

module.exports = {
  up: initialize,
  down: (knex, Promise) => {
    // consider a rollback here that would simply drop all the tables
    Promise.resolve();
  }
};
/*
This table ordering is taken from __test__/test_helpers.js. Go from the bottom up.
  - log
  - zip_code
  - message
  - user_cell
  - user_organization
  - canned_response
  - invite
  - job_request
  - migrations
  - opt_out
  - question_response
  - interaction_step
  - campaign_contact
  - assignment
  - campaign
  - organization
  - pending_message_part
  - user
*/

/*
Footnotes:
¹ At https://github.com/MoveOnOrg/rethink-knex-adapter/blob/master/models.js#L91, the Knex schema building index function is called like this: table.index(fields). According to Knex documentation (https://knexjs.org/#Schema-index), the index method accepts parameters like this: table.index(columns, [indexName], [indexType]). And: "A default index name using the columns is used unless indexName is specified." In the case of single-column indexes, the index name is the name of the column, so our tests here pass without further arguments. However, in multicolumn arguments, it's not the same. When I originally wrote the multicolumn index commands in this migration, I used the index names that were passed to rethink-knex-adapter's dbModel.ensureIndex, but since rethink-knex-adapter was effectively ignoring those names, the tests failed.
*/
