import { jobDispatchScheduler } from './queues/queues.js';

async function init() {
  Promise.all([
    jobDispatchScheduler.upsertJobScheduler('job-dispatch-scheduler', {
      every: 2 * 1000,
    }),
  ]);
}

init();