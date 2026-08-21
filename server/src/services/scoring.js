const pool = require('../db/pool');

async function scoreMatch(matchId) {
  const matchResult = await pool.query('SELECT * FROM matches WHERE id = $1', [matchId]);
  const match = matchResult.rows[0];

  if (!match) {
    console.error(`Match ${matchId} not found`);
    return;
  }

  try {
    const similarityResult = await pool.query(
      `SELECT 1 - (r.embedding <=> j.embedding) AS similarity
       FROM resumes r, job_descriptions j
       WHERE r.id = $1 AND j.id = $2`,
      [match.resume_id, match.job_description_id]
    );

    const similarity = similarityResult.rows[0].similarity;
    const score = Math.round(similarity * 100 * 100) / 100;

    await pool.query(
      `UPDATE matches
       SET status = 'done', score = $1, completed_at = NOW()
       WHERE id = $2`,
      [score, matchId]
    );

    console.log(`Match ${matchId} scored: ${score}`);
  } catch (err) {
    console.error(`Failed to score match ${matchId}:`, err);
    await pool.query(
      `UPDATE matches SET status = 'failed' WHERE id = $1`,
      [matchId]
    );
  }
}

module.exports = { scoreMatch };