import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export async function uploadResume(file) {
  const formData = new FormData();
  formData.append('resume', file);

  const response = await axios.post(`${API_URL}/resumes/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
}

export async function createJobDescription(title, rawText) {
  const response = await axios.post(`${API_URL}/job-descriptions`, {
    title,
    raw_text: rawText,
  });

  return response.data;
}

export async function createMatch(resumeId, jobDescriptionId) {
  const response = await axios.post(`${API_URL}/matches`, {
    resume_id: resumeId,
    job_description_id: jobDescriptionId,
  });

  return response.data;
}

export async function getMatch(matchId) {
  const response = await axios.get(`${API_URL}/matches/${matchId}`);
  return response.data;
}