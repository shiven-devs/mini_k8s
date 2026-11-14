import { pgTable, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const jobStatusEnum = pgEnum('job_status_enum', [
  'SUBMITTED',
  'RUNNABLE',
  'RUNNING',
  'SUCCEEDED',
  'FAILED',
]);

export const jobStatusEnumValues = jobStatusEnum.enumValues;

export const jobsTable = pgTable('jobs', {
  id: uuid().primaryKey().defaultRandom(),
  image: text().notNull(),
  cmd: text().default(null),
  state: jobStatusEnum('state').default('SUBMITTED').notNull(),
  containerId: text('container_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
});
