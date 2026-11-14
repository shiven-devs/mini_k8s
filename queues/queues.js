import { Queue } from 'bullmq';

// Shared Redis/Valkey connection (from docker-compose)
export const connection = {
  host: '127.0.0.1',
  port: 6379,
};

// Schedulers
export const jobDispatchScheduler = new Queue('job-dispatcher', { connection });
export const jobCriScheduler = new Queue('job-cri', { connection });
export const jobWatcherScheduler = new Queue('job-watch', { connection });
