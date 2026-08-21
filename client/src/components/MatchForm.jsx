import { useState, useEffect, useRef } from 'react';
import { uploadResume, createJobDescription, createMatch, getMatch } from '../api/client';

const SCAN_MESSAGES = [
  'PARSING TEXT',
  'GENERATING EMBEDDINGS',
  'COMPARING VECTORS',
];

const GAUGE_RADIUS = 80;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;

function scoreDescriptor(score) {
  if (score >= 75) return { text: 'STRONG ALIGNMENT', className: 'strong' };
  if (score >= 45) return { text: 'PARTIAL OVERLAP', className: 'partial' };
  return { text: 'LOW OVERLAP', className: 'weak' };
}

function Gauge({ score, scanning }) {
  const hasScore = score !== null && score !== undefined;
  const clamped = hasScore ? Math.max(0, Math.min(100, score)) : 0;
  const offset = GAUGE_CIRCUMFERENCE * (1 - clamped / 100);

  const ticks = Array.from({ length: 24 }, (_, i) => i * (360 / 24));

  return (
    <div className="gauge-wrap">
      <svg width="180" height="180" viewBox="0 0 180 180">
        {ticks.map((angle, i) => (
          <line
            key={i}
            x1="90" y1="10" x2="90" y2="16"
            stroke={i % 6 === 0 ? '#565d6b' : '#232733'}
            strokeWidth="1.5"
            transform={`rotate(${angle} 90 90)`}
          />
        ))}
        <circle
          cx="90" cy="90" r={GAUGE_RADIUS}
          fill="none"
          stroke="#232733"
          strokeWidth="6"
        />
        <circle
          cx="90" cy="90" r={GAUGE_RADIUS}
          fill="none"
          stroke={hasScore ? (clamped >= 75 ? '#3ed9b8' : clamped >= 45 ? '#ffb454' : '#ff6b5e') : '#6c8cff'}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={GAUGE_CIRCUMFERENCE}
          strokeDashoffset={hasScore ? offset : GAUGE_CIRCUMFERENCE}
          transform="rotate(-90 90 90)"
          style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.4s ease' }}
        />
        {scanning && (
          <circle
            className="gauge-sweep"
            cx="90" cy="90" r={GAUGE_RADIUS}
            fill="none"
            stroke="#ffb454"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${GAUGE_CIRCUMFERENCE * 0.06} ${GAUGE_CIRCUMFERENCE}`}
          />
        )}
      </svg>
      <div className="gauge-score">
        {hasScore ? (
          <>
            <span className="value">{clamped.toFixed(1)}</span>
            <span className="unit">% MATCH</span>
          </>
        ) : (
          <span className="placeholder">—</span>
        )}
      </div>
    </div>
  );
}

function MatchForm() {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobTitle, setJobTitle] = useState('');
  const [jobText, setJobText] = useState('');
  const [status, setStatus] = useState('idle');
  const [match, setMatch] = useState(null);
  const [error, setError] = useState(null);
  const [scanIndex, setScanIndex] = useState(0);

  const scanning = status !== 'idle';

  useEffect(() => {
    if (!scanning) return;
    const interval = setInterval(() => {
      setScanIndex((i) => (i + 1) % SCAN_MESSAGES.length);
    }, 1400);
    return () => clearInterval(interval);
  }, [scanning]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMatch(null);

    if (!resumeFile) {
      setError('Choose a resume PDF first.');
      return;
    }
    if (!jobText.trim()) {
      setError('Add a job description first.');
      return;
    }

    try {
      setStatus('uploading');
      const resume = await uploadResume(resumeFile);

      setStatus('creating-job');
      const jobDescription = await createJobDescription(jobTitle, jobText);

      setStatus('matching');
      const createdMatch = await createMatch(resume.id, jobDescription.id);
      setMatch(createdMatch);

      pollMatch(createdMatch.id);
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Try again.');
      setStatus('idle');
    }
  }

  function pollMatch(matchId) {
    const interval = setInterval(async () => {
      try {
        const result = await getMatch(matchId);
        setMatch(result);

        if (result.status === 'done' || result.status === 'failed') {
          clearInterval(interval);
          setStatus('idle');
        }
      } catch (err) {
        console.error(err);
        clearInterval(interval);
        setStatus('idle');
      }
    }, 2000);
  }

  const numericScore = match && match.score !== null ? Number(match.score) : null;
  const descriptor = numericScore !== null ? scoreDescriptor(numericScore) : null;

  let readoutText = 'AWAITING INPUT';
  let readoutClass = '';
  if (scanning && !match) readoutText = SCAN_MESSAGES[scanIndex];
  if (scanning && match && match.status === 'pending') readoutText = SCAN_MESSAGES[scanIndex];
  if (match && match.status === 'done' && descriptor) {
    readoutText = descriptor.text;
    readoutClass = descriptor.className;
  }
  if (match && match.status === 'failed') {
    readoutText = 'SCORING FAILED';
    readoutClass = 'weak';
  }
  if (scanning) readoutClass = readoutClass || 'scanning';

  return (
    <div className="app">
      <div className="shell">
        <div className="header">
          <p className="logo">Resume<span>IQ</span></p>
          <span className={`status-pill ${scanning ? 'active' : ''} ${match?.status === 'done' ? 'done' : ''}`}>
            {match?.status === 'done' ? 'complete' : scanning ? 'scanning' : 'idle'}
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid">
            <div className="panel">
              <div className="section-label">
                <span className="section-number">01</span>
                <span className="section-title">Resume</span>
              </div>
              <div className="field">
                <label htmlFor="resume">PDF file</label>
                <div className="file-input-wrap">
                  <label className="file-button" htmlFor="resume">Choose file</label>
                  <span className="file-name">{resumeFile ? resumeFile.name : 'No file selected'}</span>
                </div>
                <input
                  id="resume"
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setResumeFile(e.target.files[0])}
                  style={{ display: 'none' }}
                />
              </div>

              <div className="section-label" style={{ marginTop: '1.75rem' }}>
                <span className="section-number">02</span>
                <span className="section-title">Role</span>
              </div>
              <div className="field">
                <label htmlFor="title">Job title</label>
                <input
                  id="title"
                  type="text"
                  placeholder="Software engineer intern"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="description">Job description</label>
                <textarea
                  id="description"
                  placeholder="Paste the job posting here"
                  value={jobText}
                  onChange={(e) => setJobText(e.target.value)}
                  rows={6}
                />
              </div>

              <div className="submit-row">
                <button type="submit" className="submit-button" disabled={scanning}>
                  {scanning ? 'Running match…' : 'Run match'}
                </button>
              </div>

              {error && <p className="error-text">{error}</p>}
            </div>

            <div className="panel gauge-panel">
              <div className="section-label" style={{ alignSelf: 'flex-start' }}>
                <span className="section-number">03</span>
                <span className="section-title">Readout</span>
              </div>

              <Gauge score={numericScore} scanning={scanning && (!match || match.status !== 'done')} />

              <p className={`readout ${readoutClass}`}>{readoutText}</p>

              <p className="hint">
                Score reflects cosine similarity between resume and job description embeddings — not keyword overlap.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MatchForm;