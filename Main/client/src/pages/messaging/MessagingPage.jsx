import React, { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Send, Search, Loader2, AlertCircle, CheckCheck } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { listConversations, listMessages, sendMessage } from '../../lib/messageApi';

// The backend returns participants/senders as bare ObjectId strings (no
// populate) and GET /users/:id is not implemented, so conversations are
// labelled by title/type rather than a resolved display name.
const conversationLabel = (conv) => {
  if (conv?.title) return conv.title;
  return conv?.type === 'group' ? 'Group conversation' : 'Direct conversation';
};

const formatTime = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const MessagingPage = () => {
  const { currentUser } = useAuth();
  const myId = String(currentUser?._id || currentUser?.id || '');

  const [conversations, setConversations] = useState([]);
  const [convLoading, setConvLoading] = useState(true);
  const [convError, setConvError] = useState('');

  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgError, setMsgError] = useState('');

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');

  const fetchConversations = async () => {
    setConvLoading(true);
    setConvError('');
    try {
      const data = await listConversations();
      const list = Array.isArray(data) ? data : [];
      setConversations(list);
      if (list.length && !activeId) setActiveId(list[0]._id);
    } catch (err) {
      setConvError(err.message || 'Failed to load conversations.');
    } finally {
      setConvLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMessages = async (id) => {
    if (!id) return;
    setMsgLoading(true);
    setMsgError('');
    try {
      const data = await listMessages(id);
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      setMsgError(err.message || 'Failed to load messages.');
    } finally {
      setMsgLoading(false);
    }
  };

  useEffect(() => {
    if (activeId) fetchMessages(activeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !activeId) return;
    setSending(true);
    try {
      const message = await sendMessage(activeId, text);
      if (message) setMessages((prev) => [...prev, message]);
      setDraft('');
    } catch (err) {
      setMsgError(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) => conversationLabel(c).toLowerCase().includes(q) ||
        (c.lastMessage?.content || '').toLowerCase().includes(q)
    );
  }, [conversations, search]);

  const activeConv = conversations.find((c) => c._id === activeId) || null;

  return (
    <Card className="h-[calc(100vh-140px)] border-slate-200 overflow-hidden flex flex-col md:flex-row shadow-soft-sm">
      {/* Conversation sidebar */}
      <div className="w-full md:w-80 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900 mb-3">Messages</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {convLoading && (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          )}
          {!convLoading && convError && (
            <div className="p-4 text-xs text-red-600 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{convError}</span>
            </div>
          )}
          {!convLoading && !convError && filteredConversations.length === 0 && (
            <div className="p-6 text-center text-xs text-slate-400">No conversations yet.</div>
          )}
          {!convLoading && !convError && filteredConversations.map((conv) => (
            <button
              key={conv._id}
              onClick={() => setActiveId(conv._id)}
              className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                conv._id === activeId ? 'bg-emerald-50/60' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-slate-800 truncate">{conversationLabel(conv)}</span>
                <span className="text-[10px] text-slate-400 flex-shrink-0">{formatTime(conv.lastActivityAt)}</span>
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {conv.lastMessage?.content || 'No messages yet'}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Thread pane */}
      <div className="flex-1 flex flex-col bg-slate-50/40">
        {!activeConv ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={MessageSquare}
              title="Select a conversation"
              description="Choose a conversation on the left to view and send messages."
            />
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-slate-200 bg-white">
              <h3 className="text-sm font-bold text-slate-900">{conversationLabel(activeConv)}</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {msgLoading && (
                <div className="flex items-center justify-center py-10 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              )}
              {!msgLoading && msgError && (
                <div className="text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> {msgError}
                </div>
              )}
              {!msgLoading && !msgError && messages.length === 0 && (
                <div className="text-center text-xs text-slate-400 py-10">No messages yet. Say hello.</div>
              )}
              {!msgLoading && !msgError && messages.map((m) => {
                const mine = String(m.sender?._id || m.sender) === myId;
                return (
                  <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                        mine ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-800'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                      <div className={`flex items-center gap-1 mt-1 text-[10px] ${mine ? 'text-emerald-100' : 'text-slate-400'}`}>
                        <span>{formatTime(m.createdAt)}</span>
                        {mine && m.status === 'read' && <CheckCheck className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSend} className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message..."
                disabled={sending}
                className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
              <Button type="submit" size="sm" disabled={sending || !draft.trim()}>
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>
          </>
        )}
      </div>
    </Card>
  );
};
