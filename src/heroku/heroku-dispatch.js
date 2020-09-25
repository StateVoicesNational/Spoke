import { dispatchProcesses } from "../workers/job-processes";

const runDispatch = async () => {
  const event = {
    maxCount: 2 // maxCount is 2 so erroredMessageSender runs once
  };
  dispatchProcesses(event)
    .catch(err => {
      console.log(err);
    })
    .then(results => {
      console.log('dispatch results', results);
      process.exit(0)
    })
};
runDispatch();
