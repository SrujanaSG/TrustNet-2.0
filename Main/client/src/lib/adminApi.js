// Calls the real backend Admin module (src/routes/admin.routes.js). Every
// route here is authenticate + authorize("admin") on the server, so
// authorization is enforced server-side and cannot be spoofed from the
// client. apiClient unwraps the { success, data } envelope, so each helper
// resolves to `data` (an array or object) or throws on the failure envelope.
//
// Backend coverage (as of this module): verification review, dashboard
// overview totals, user directory + moderation (suspend/reactivate/role/
// soft-delete), startup listing + suspend/restore, content moderation, and
// the activity/audit log. Sections of the admin UI with NO backing route
// (broadcast, reports queue, platform settings, system health) are left
// clearly labelled as unavailable in the UI rather than wired here.
import { apiClient } from './apiClient';

export async function getAdminMe() {
  return apiClient.get('/admin/me');
}

// --- Dashboard overview -------------------------------------------------
// Resolves to { totals: { users, verifiedUsers, pendingVerifications,
// startups, communities, posts, jobs, fundingRounds, marketplaceListings },
// recentActivity: [...] }.
export async function getOverview() {
  return apiClient.get('/admin/dashboard/overview');
}

// --- Verification review ------------------------------------------------
export async function listVerifications(options = {}) {
  return apiClient.get('/admin/verifications', options);
}

export async function getVerification(userId) {
  return apiClient.get(`/admin/verifications/${userId}`);
}

export async function approveVerification(userId) {
  return apiClient.post(`/admin/verifications/${userId}/approve`);
}

export async function rejectVerification(userId, reason) {
  return apiClient.post(`/admin/verifications/${userId}/reject`, reason ? { reason } : undefined);
}

export async function requestResubmission(userId, reason) {
  return apiClient.post(
    `/admin/verifications/${userId}/request-resubmission`,
    reason ? { reason } : undefined
  );
}

// --- User directory + moderation ---------------------------------------
// listUsers resolves to the users array (meta.total is dropped by the
// envelope unwrap). Never returns password/hash/token fields -- User.password
// and the token fields are `select: false` in the Mongoose schema, so they
// are excluded from every query the admin endpoints run.
export async function listUsers(query = {}) {
  return apiClient.get('/admin/users', query);
}

export async function getUser(userId) {
  return apiClient.get(`/admin/users/${userId}`);
}

export async function suspendUser(userId, reason) {
  return apiClient.post(`/admin/users/${userId}/suspend`, reason ? { reason } : undefined);
}

export async function reactivateUser(userId) {
  return apiClient.post(`/admin/users/${userId}/reactivate`);
}

// Server enforces the allowed role set and blocks self-role-change.
export async function changeUserRole(userId, role) {
  return apiClient.patch(`/admin/users/${userId}/role`, { role });
}

export async function deleteUser(userId) {
  return apiClient.delete(`/admin/users/${userId}`);
}

// --- Startup moderation -------------------------------------------------
// The list endpoint returns active, non-suspended, public startups by
// default (it is the shared startup listing). Suspended startups are not in
// that result; restoreStartup targets an id the admin already knows.
export async function listStartups(query = {}) {
  return apiClient.get('/admin/startups', query);
}

export async function suspendStartup(startupId, reason) {
  return apiClient.post(`/admin/startups/${startupId}/suspend`, reason ? { reason } : undefined);
}

export async function restoreStartup(startupId) {
  return apiClient.post(`/admin/startups/${startupId}/restore`);
}

// --- Content moderation -------------------------------------------------
// type is the content type segment (e.g. post); action is hide|restore|delete.
export async function moderateContent(type, id, action, reason) {
  return apiClient.post(`/admin/content/${type}/${id}/moderate`, { action, reason });
}

// --- Activity / audit log ----------------------------------------------
// Resolves to the logs array; each log has actor populated as
// { fullName, email, role } plus action, targetType, targetId, details,
// ip, createdAt.
export async function listActivityLogs(query = {}) {
  return apiClient.get('/admin/activity-logs', query);
}
