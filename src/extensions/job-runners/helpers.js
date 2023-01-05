import { r } from "../../server/models";

export const saveJob = async (jobData, trx) => {
  const builder = trx || r.knex;

  let unsavedJob;
  if (typeof jobData.payload === "string") {
    unsavedJob = jobData;
  } else {
    unsavedJob = { ...jobData, payload: JSON.stringify(jobData.payload || {}) };
  }

  const [res] = await builder("job_request").insert(unsavedJob, "id");

  return builder("job_request")
    .select("*")
    .where("id", res.id)
    .first();
};
