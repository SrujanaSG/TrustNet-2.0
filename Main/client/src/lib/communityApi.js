// Calls the real backend Community module (src/routes/community.routes.js).
// Response envelope is { success, data }; apiClient unwraps `data` and throws
// on the failure envelope, so these return the payload directly.
import { apiClient } from './apiClient';

// GET /communities -- supports ?search=, ?category=, ?limit=&skip= (optional auth).
export async function listCommunities(filter = {}) {
  return apiClient.get('/communities', filter);
}

// GET /communities/:id -- single community.
export async function getCommunity(id) {
  return apiClient.get(`/communities/${id}`);
}

// POST /communities/:id/join -- returns the updated community.
export async function joinCommunity(id) {
  return apiClient.post(`/communities/${id}/join`);
}

// POST /communities/:id/leave -- returns the updated community.
export async function leaveCommunity(id) {
  return apiClient.post(`/communities/${id}/leave`);
}

// POST /communities -- create (name, slug, description required by the backend validator).
export async function createCommunity(payload) {
  return apiClient.post('/communities', payload);
}
