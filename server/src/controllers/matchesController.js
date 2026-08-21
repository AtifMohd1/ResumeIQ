
const pool = require('../db/pool');

async function createMatch(req, res) {
  const { resume_id, job_description_id } = req.body;

  if (!resume_id || !job_description_id) {
    return res.status(400).json({ error: 'resume_id and job_description_id are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO matches (resume_id, job_description_id, status)
       VALUES ($1, $2, 'pending')
       RETURNING *`,
      [resume_id, job_description_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create match' });
  }
}

async function getMatchById(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM matches WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch match' });
  }
}

async function getMatches(req, res) {
  try {
    const result = await pool.query('SELECT * FROM matches ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
}

module.exports = { createMatch, getMatchById, getMatches };