import express from 'express';
import { eq } from 'drizzle-orm';
import { jobsTable } from './db/schema.js';
import { db } from './db/index.js';

const app = express();
const PORT = 8000;

app.use(express.json());

app.get('/', (req, res) => {
  return res.json({ message: 'Server is up and Running' });
});

// Submit a new job
app.post('/job', async (req, res) => {
  const { image, cmd = null } = req.body ?? {};
  if (!image || typeof image !== 'string') {
    return res.status(400).json({ error: '"image" is required' });
  }

  const [insertResult] = await db
    .insert(jobsTable)
    .values({ image, cmd })
    .returning({ id: jobsTable.id });

  return res.json({ jobId: insertResult.id });
});

// Check the status of a job
app.get('/job/:id', async (req, res) => {
  const [job] = await db
    .select()
    .from(jobsTable)
    .where(eq(jobsTable.id, req.params.id));

  if (!job) return res.status(404).json({ error: 'Job not found' });
  return res.json(job);
});

app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
