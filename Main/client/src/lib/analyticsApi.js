// Calls the real backend Analytics module (src/routes/analytics.routes.js).
// Every endpoint is startup-scoped (?startupId=) and any-role gated. Envelope
// { success, data }; apiClient unwraps `data` and throws on failure.
import { apiClient } from './apiClient';

export const getAnalyticsOverview = (startupId) => apiClient.get('/analytics/overview', { startupId });
export const getAnalyticsProjects = (startupId) => apiClient.get('/analytics/projects', { startupId });
export const getAnalyticsTasks = (startupId) => apiClient.get('/analytics/tasks', { startupId });
export const getAnalyticsHiring = (startupId) => apiClient.get('/analytics/hiring', { startupId });
export const getAnalyticsFunding = (startupId) => apiClient.get('/analytics/funding', { startupId });
export const getAnalyticsMarketplace = (startupId) => apiClient.get('/analytics/marketplace', { startupId });
