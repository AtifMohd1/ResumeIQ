const express = require('express');
const cors = require('cors');
const pool = require('./db/pool');
const resumesRouter = require('./routes/resumes');
const jobDescriptionsRouter = require('./routes/jobDescriptions');
const matchesRouter = require('./routes/matches');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/db-check', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

app.use('/resumes', resumesRouter);
app.use('/job-descriptions', jobDescriptionsRouter);
app.use('/matches', matchesRouter);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));