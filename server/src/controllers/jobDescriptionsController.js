
const pool = require('../db/pool');
const { generateEmbedding } = require('../services/embeddings');

async function createJobDescription(req, res) {
  const { user_id, title, raw_text } = req.body;

  if (!raw_text) {
    return res.status(400).json({ error: 'raw_text is required' });
  }

  try {
    const embedding = await generateEmbedding(raw_text);

    const result = await pool.query(
      `INSERT INTO job_descriptions (user_id, title, raw_text, embedding)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, title, raw_text, created_at`,
      [user_id || null, title || null, raw_text, JSON.stringify(embedding)]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create job description' });
  }
}

async function getJobDescriptions(req, res) {
  try {
    const result = await pool.query(
      'SELECT id, user_id, title, raw_text, created_at FROM job_descriptions ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch job descriptions' });
  }
}

module.exports = { createJobDescription, getJobDescriptions };