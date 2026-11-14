import {
  jobDispatchScheduler,
  jobCriScheduler,
  jobWatcherScheduler,
} from './queues/queues.js';
import './queues/workers.js';

async function init() {
  await Promise.all([
    jobDispatchScheduler.upsertJobScheduler('job-dispatch-scheduler', {
      every: 2 * 1000,
    }),
    jobCriScheduler.upsertJobScheduler('job-cri-scheduler', {
      every: 10 * 1000,
    }),
    jobWatcherScheduler.upsertJobScheduler('job-watch-scheduler', {
      every: 5 * 1000,
    }),
  ]);
  console.log('[Scheduler]: All schedulers registered');
}

init().catch((err) => {
  console.error('[Scheduler]: Failed to start', err);
  process.exit(1);
});
