import { dispatchProcesses } from "./job-processes";

const event = {};
dispatchProcesses(event).catch(err => {
  console.log(err);
});
