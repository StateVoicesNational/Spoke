import { dispatchProcesses } from "../workers/job-processes";

const event = {};
dispatchProcesses(event).catch(err => {
  console.log(err);
});
