import 'dotenv/config'
import {drizzle} from 'drizzle-orm/mode.postgres';
export const db = drizzle(process.env.DATABASE_URL);
export default db;