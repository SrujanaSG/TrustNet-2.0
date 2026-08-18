// Calls the real backend Hiring/Jobs module (src/routes/job.routes.js).
// Envelope { success, data }; apiClient unwraps `data` and throws on failure.
// NOTE: the backend does not populate the `startup` ref (bare ObjectId) and
// there is no bookmark endpoint, so this surface exposes only job data.
import { apiClient } from './apiClient';

// GET /jobs -- ?search=, ?status=, ?startupId=, ?limit=&skip= (optional auth).
export async function listJobs(filter = {}) {
  return apiClient.get('/jobs', filter);
}

// GET /jobs/:id -- single job posting.
export async function getJob(id) {
  return apiClient.get(`/jobs/${id}`);
}
