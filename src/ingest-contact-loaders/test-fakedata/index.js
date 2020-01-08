import { completeContactLoad } from "../../workers/jobs";
import { r } from "../../server/models";
import { getConfig, hasConfig } from "../../server/api/lib/config";

export function displayName() {
  return "Fake Data for Testing";
}

export function serverAdministratorInstructions() {
  return {
    "environmentVariables": [],
    "description": "",
    "setupInstructions": "Nothing is necessary to setup since this is default functionality"
  }
}

export async function available(organization) {
  /// return an object with two keys: result: true/false, 
  /// if the ingest-contact-loader is usable and has
  /// Sometimes credentials need to be setup, etc.
  /// A second key expiresSeconds: should be how often this needs to be checked
  /// If this is instantaneous, you can have it be 0 (i.e. always), but if it takes time
  /// to e.g. verify credentials or test server availability,
  /// then it's better to allow the result to be cached
  const orgFeatures = JSON.parse(organization.features || "{}");
  const result = (orgFeatures.service || getConfig("DEFAULT_SERVICE")) === "fakeservice"
  return {
    result,
    expiresSeconds: 100000000
  }
}

export function addServerEndpoints(expressApp) {
  /// If you need to create API endpoints for server-to-server communication
  /// this is where you would run e.g. app.post(....)
  /// Be mindful of security and make sure there's
  /// This is NOT where or how the client send or receive contact data
  return;
}

export async function clientChoiceData(organization, campaign, user, loaders) {
  /// data to be sent to the admin client to present options to the component or similar
  /// The react-component will be sent this data as a property
  /// return a json object which will be cached for expiresSeconds long
  /// `data` should be a single string -- it can be JSON which you can parse in the client component
  /// `dependsOn` should be an array that is the list of arguments the result depends on
  ///   it can include "organization", "campaign", "user" (the strings)
  return {
    data: "",
    dependsOn: ["organization"],
    expiresSeconds: 0
  };
}

export async function processContactLoad(job, context) {
  /// trigger processing -- this will likely be the most important part
  /// you should load contacts into the contact table with the job.campaign_id
  /// Since this might just *begin* the processing and other work might
  /// need to be completed asynchronously after this is completed (e.g. to distribute loads)
  /// AFTER true contact-load completion, this (or another function) MUST call
  /// src/workers/jobs.js::completeContactLoad(job)
  ///   The async function completeContactLoad(job) will delete opt-outs, clear/update caching, etc.
  /// The @context argument is 'similar' to the AWS Lambda context, and will have a getRemainingMilliseconds() function
  /// along with a context.succeed() call which can indicate completion
  await completeContactLoad(job, context);
}

export async function loadOptOuts(organization) {
  // This function can be called periodically to sync optouts from an external source
  return
}
