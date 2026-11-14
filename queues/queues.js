import { Queue } from 'bullmq';

// Schedulers
export const jobDispatchScheduler = new Queue('job-dispatcher');