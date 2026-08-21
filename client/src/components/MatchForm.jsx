import { useState } from 'react';
import { uploadResume, createJobDescription, createMatch, getMatch } from '../api/client';

function MatchForm() {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobTitle, setJobTitle] = useState('');
  const [jobText, setJobText] = useState('');
  const [status, setStatus] = useState('idle');
  const [match, setMatch] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMatch(null);

    if (!resumeFile || !jobText.trim()) {
      setError('Please upload a resume and enter a job description.');
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
      setError('Something went wrong. Please try again.');
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

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>ResumeIQ</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label>Resume (PDF)</label><br />
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setResumeFile(e.target.files[0])}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>Job Title</label><br />
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            style={{ width: '100%', padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>Job Description</label><br />
          <textarea
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
            rows={6}
            style={{ width: '100%', padding: 8 }}
          />
        </div>

        <button type="submit" disabled={status !== 'idle'}>
          {status === 'idle' ? 'Get Match Score' : 'Processing...'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {match && (
        <div style={{ marginTop: 24, padding: 16, border: '1px solid #ccc' }}>
          <p>Status: <strong>{match.status}</strong></p>
          {match.status === 'done' && (
            <p style={{ fontSize: 24 }}>Match Score: <strong>{match.score}%</strong></p>
          )}
          {match.status === 'failed' && (
            <p style={{ color: 'red' }}>Scoring failed. Please try again.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default MatchForm;