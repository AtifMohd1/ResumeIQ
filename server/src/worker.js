const pool = require('./db/pool');
const { scoreMatch } = require('./services/scoring');

const POLL_INTERVAL_MS = 3000;

async function processNextPendingMatch() {
  const result = await pool.query(
    `SELECT id FROM matches WHERE status = 'pending' ORDER BY created_at ASC LIMIT 1`
  );

  if (result.rows.length === 0) {
    return;
  }

  const matchId = result.rows[0].id;
  console.log(`Processing match ${matchId}...`);
  await scoreMatch(matchId);
}

async function pollLoop() {
  try {
    await processNextPendingMatch();
  } catch (err) {
    console.error('Worker loop error:', err);
  }

  setTimeout(pollLoop, POLL_INTERVAL_MS);
}

console.log('Worker started, polling for pending matches...');
pollLoop();