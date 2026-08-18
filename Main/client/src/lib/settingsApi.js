// Calls the real backend Settings module (src/routes/settings.routes.js).
// Envelope { success, data }; apiClient unwraps `data` and throws on failure.
import { apiClient } from './apiClient';

// GET /settings -> { profile, preferences }
export async function getSettings() {
  return apiClient.get('/settings');
}

// PUT /settings/preferences -> { notifications, emailNotifications, marketingEmails, theme, language, timezone }
export async function updatePreferences(body) {
  return apiClient.put('/settings/preferences', body);
}

// PUT /settings/privacy -> { privacy, profileVisibility, allowMessages, allowCollaborationRequests }
export async function updatePrivacy(body) {
  return apiClient.put('/settings/privacy', body);
}

// PUT /settings/appearance -> { theme, language, timezone }
export async function updateAppearance(body) {
  return apiClient.put('/settings/appearance', body);
}

// GET /settings/sessions -> active sessions
export async function getSessions() {
  return apiClient.get('/settings/sessions');
}

// DELETE /settings/sessions/:id -> revoke a session
export async function deleteSession(id) {
  return apiClient.delete(`/settings/sessions/${id}`);
}
