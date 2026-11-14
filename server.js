import express from 'express';
import {jobsTable} from './db/schema.js';
import {db} from "./db/index.js";
const app = express();
const PORT = 8000;

app.get('/', (req, res) => {
    return res.json({ message: 'Server is up and Running' })
})

app.post('/job', async (req, res) => {
    const { image, cmd = null } = req.body;
    const [insertResult] = await db
        .insert(jobsTable)
        .values({ image, cmd })
        .returning({
            id: jobsTable.id,
        });
    return res.json({ jobId: insertResult.id });
});

app.listen(PORT, () => {
    console.log(`Server is running on PORT `)
})