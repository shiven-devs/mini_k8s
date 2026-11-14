import { Worker } from 'bullmq';
import Docker from 'dockerode';
import { asc, eq, inArray } from 'drizzle-orm';
import { db } from '../db/index.js';
import { jobsTable } from '../db/schema.js';
import { connection } from './queues.js';

// No options = auto-detect (named pipe on Windows, socket on Linux/Mac)
const docker = new Docker();

// "nginx" -> "nginx:latest", "nginx:1.25" stays as it is
function withTag(image) {
  const lastPart = image.split('/').pop();
  return lastPart.includes(':') ? image : `${image}:latest`;
}

function pullImage(image) {
  return new Promise((resolve, reject) => {
    docker.pull(image, (err, stream) => {
      if (err) return reject(err);
      docker.modem.followProgress(stream, (err) =>
        err ? reject(err) : resolve(),
      );
    });
  });
}

// Locks up to `limit` jobs in `state` so other workers skip them
// (SELECT ... FOR UPDATE SKIP LOCKED)
function lockJobs(tx, state, limit) {
  return tx
    .select()
    .from(jobsTable)
    .where(eq(jobsTable.state, state))
    .orderBy(asc(jobsTable.createdAt))
    .limit(limit)
    .for('update', { skipLocked: true });
}

// SUBMITTED -> RUNNABLE
export const jobDispatchWorker = new Worker(
  'job-dispatcher',
  async () => {
    await db.transaction(async (tx) => {
      const jobs = await lockJobs(tx, 'SUBMITTED', 5);
      if (jobs.length === 0) return;

      // TODO: Check if compute is available
      const jobIds = jobs.map((j) => j.id);
      console.log(`[JobDispatcher]: Moving ${jobIds.length} jobs to RUNNABLE`, jobIds);
      await tx
        .update(jobsTable)
        .set({ state: 'RUNNABLE' })
        .where(inArray(jobsTable.id, jobIds));
    });
  },
  { connection },
);

// RUNNABLE -> RUNNING (pull image + start container)
export const jobCriWorker = new Worker(
  'job-cri',
  async () => {
    await db.transaction(async (tx) => {
      const jobs = await lockJobs(tx, 'RUNNABLE', 1);

      for (const job of jobs) {
        const image = withTag(job.image);
        try {
          const existing = await docker.listImages({
            filters: { reference: [image] },
          });
          if (existing.length === 0) {
            console.log(`[JobCri]: Pulling image ${image}`);
            await pullImage(image);
          }

          const container = await docker.createContainer({
            Image: image,
            Tty: false,
            HostConfig: { AutoRemove: false },
            Cmd: job.cmd ? job.cmd.split(' ') : undefined,
          });
          await container.start();

          console.log(`[JobCri]: Job ${job.id} running in container ${container.id}`);
          await tx
            .update(jobsTable)
            .set({ state: 'RUNNING', containerId: container.id })
            .where(eq(jobsTable.id, job.id));
        } catch (err) {
          // e.g. image does not exist: mark FAILED so it is not retried forever
          console.error(`[JobCri]: Job ${job.id} failed to start:`, err.message);
          await tx
            .update(jobsTable)
            .set({ state: 'FAILED' })
            .where(eq(jobsTable.id, job.id));
        }
      }
    });
  },
  { connection },
);

// RUNNING -> SUCCEEDED / FAILED (when the container exits)
export const jobWatchWorker = new Worker(
  'job-watch',
  async () => {
    await db.transaction(async (tx) => {
      const jobs = await lockJobs(tx, 'RUNNING', 10);

      for (const job of jobs) {
        let finalState = null;
        try {
          const info = await docker.getContainer(job.containerId).inspect();
          if (info.State.Status === 'exited' || info.State.Status === 'dead') {
            finalState = info.State.ExitCode === 0 ? 'SUCCEEDED' : 'FAILED';
          }
        } catch (err) {
          // Container vanished (removed manually etc.)
          console.error(`[JobWatch]: Container for job ${job.id} not found`);
          finalState = 'FAILED';
        }

        if (finalState) {
          console.log(`[JobWatch]: Job ${job.id} -> ${finalState}`);
          await tx
            .update(jobsTable)
            .set({ state: finalState, containerId: null })
            .where(eq(jobsTable.id, job.id));
        }
      }
    });
  },
  { connection },
);

// BullMQ hides processor errors by default, so log them
for (const worker of [jobDispatchWorker, jobCriWorker, jobWatchWorker]) {
  worker.on('failed', (_job, err) =>
    console.error(`[${worker.name}]: failed:`, err.message),
  );
}
