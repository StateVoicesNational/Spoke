# Manual graphql testing (with rethinkdb)

* Every query and mutation in src/server/schema.js can be tested in the graphiql interface.
* Open (graphiql)[localhost:3000/graphql] in one browser tab and (Rethink data explorer)[localhost:8080/#dataexplorer] in another
  * If you're not using RethinkDB, open a query interface for the current database.
* Enter a valid graphQL query or mutation. Inspect src/server/schema or the tree in the graphiql docs to see available queries and mutations. 
* Example mutation - creates a valid invitation object and requests id of the newly created invitation in response:

    mutation {
      createInvite(invite: {is_valid: true}) {
        id
      }
    }

* Example mutation result (with id )
    {
      "data": {
        "createInvite": {
          "id": "a string of numbers and letters"
        }
      }
    }

* Example query - requests a specific campaign instance and specific details of subfields (use a campaign id from your own database)

    {
      campaign(id: "8c429f5b-2627-47b4-9395-5814a27e403f") {
        organization {
          id
        }
        interactionSteps {
          script
          question {
            text
          }
        }
        contacts {
          id
        }
        contactsCount
      }
    }

* Example query result:

    {
      "data": {
        "campaign": {
          "organization": {
            "id": "65383528-54b2-4070-984e-792343097378"
          },
          "interactionSteps": [
            {
              "script": "I'm sorry to hear that",
              "question": {
                "text": ""
              }
            },
            {
              "script": "That's too bad.",
              "question": {
                "text": ""
              }
            },
            {
              "script": "",
              "question": {
                "text": "How are you doing today?"
              }
            },
            {
              "script": "Good!",
              "question": {
                "text": "Would you feed the cat?"
              }
            },
            {
              "script": "Thank you!",
              "question": {
                "text": ""
              }
            }
          ],
          "contacts": [
            {
              "id": "917987c3-929c-4c01-9fcd-61fbf1885edd"
            },
            {
              "id": "bddf44a0-f6a0-4993-b38b-34ab70fc9b96"
            }
          ],
          "contactsCount": 2
        }
      }
    }

## Getting stack traces

* To add more informative graphql logging to the console, edit src/server/index.js to add the following option

    formatError: (err) => { console.log(err.stack); return err },

Like so:

    app.use('/graphql', apolloServer((req) => ({
      graphiql: true,
      pretty: true,
      schema,
      mocks,
      resolvers,
      context: {
        loaders: createLoaders(),
        user: req.user
      },
      tracer,
      printErrors: true,
      allowUndefinedInResolve: false,
      formatError: (err) => { console.log(err.stack); return err }, 
    })))









