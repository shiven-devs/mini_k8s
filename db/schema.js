import {pgTable,uuid,text,timestamp,pgEnum} from 'drizzle-orm/pg-core';
export const jobStatusEnum = pgEnum('job_status_enum', [
  'SUBMITTED',
  'RUNNABLE',
  'RUNNING',
]);
export const jobStateTable = pgTable('jobs',{id:uuid().primaryKey().defaultRandom(),
    image:text().notNull(),
    cmd:text().default(null),
    state:jobstatusEnum().default('SUBMITTED').notNull(),
    createdAt:timestamp('created_at').defaultNow().notNull,
    updatedAt:timestamp('updated_at').$onUpdate(()=>new Date),


})