import { jobDispatchScheduler } from './queues/queues.js';
import {jobDispatchWorker} from './queues/workers.js';
async function init() {
  Promise.all([
    jobDispatchScheduler.upsertJobScheduler('job-dispatch-scheduler', {
      every: 2 * 1000,
    }),
  ]);
}

init();