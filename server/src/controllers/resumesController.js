const pool = require('../db/pool');
const { extractTextFromPDF } = require('../services/parseResume');
const { generateEmbedding } = require('../services/embeddings');

async function createResume(req, res) {
  const { user_id, s3_key, parsed_text } = req.body;

  if (!s3_key) {
    return res.status(400).json({ error: 's3_key is required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO resumes (user_id, s3_key, parsed_text)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, s3_key, parsed_text, created_at`,
      [user_id || null, s3_key, parsed_text || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create resume' });
  }
}

async function getResumes(req, res) {
  try {
    const result = await pool.query(
      'SELECT id, user_id, s3_key, parsed_text, created_at FROM resumes ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch resumes' });
  }
}

async function uploadResume(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const parsedText = await extractTextFromPDF(req.file.path);
    const embedding = await generateEmbedding(parsedText);

    const result = await pool.query(
      `INSERT INTO resumes (user_id, s3_key, parsed_text, embedding)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, s3_key, parsed_text, created_at`,
      [req.body.user_id || null, req.file.filename, parsedText, JSON.stringify(embedding)]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process resume upload' });
  }
}

module.exports = { createResume, getResumes, uploadResume };