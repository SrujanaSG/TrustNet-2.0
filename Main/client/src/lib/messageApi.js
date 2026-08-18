// Calls the real backend Message module (src/routes/message.routes.js).
// Envelope is { success, data }; apiClient unwraps `data` and throws on failure.
// NOTE: the backend does not populate participant/sender User refs (they come
// back as bare ObjectId strings), and GET /users/:id is not implemented, so
// this module intentionally exposes only what the /messages surface supports.
import { apiClient } from './apiClient';

// GET /messages/conversations -- ?search=, ?limit=&skip=&sort=
export async function listConversations(filter = {}) {
  return apiClient.get('/messages/conversations', filter);
}

// GET /messages/conversations/:id/messages -- ?search=, ?limit=&skip=&sort=
export async function listMessages(conversationId, filter = {}) {
  return apiClient.get(`/messages/conversations/${conversationId}/messages`, filter);
}

// POST /messages/conversations/:id/messages -- { content, attachments?, replyTo? }
export async function sendMessage(conversationId, content) {
  return apiClient.post(`/messages/conversations/${conversationId}/messages`, { content });
}

// POST /messages/conversations -- { participants: [id], type?, title? }
export async function createConversation(payload) {
  return apiClient.post('/messages/conversations', payload);
}

// GET /messages/unread-count
export async function getUnreadCount() {
  return apiClient.get('/messages/unread-count');
}
