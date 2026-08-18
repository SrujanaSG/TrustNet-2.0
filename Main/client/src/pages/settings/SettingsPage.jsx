import React, { useEffect, useState } from 'react';
import { Bell, Shield, Palette, Monitor, Loader2, AlertCircle, LogOut } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../context/AppContext';
import {
  getSettings,
  updatePreferences,
  updatePrivacy,
  updateAppearance,
  getSessions,
  deleteSession,
} from '../../lib/settingsApi';

// Small controlled toggle row. Purely presentational.
const Toggle = ({ label, description, checked, onChange, disabled }) => (
  <div className="flex items-center justify-between py-3">
    <div className="pr-4">
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-emerald-500' : 'bg-slate-300'
      } ${disabled ? 'opacity-50' : ''}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  </div>
);

const SectionCard = ({ icon: Icon, title, children, onSave, saving }) => (
  <Card className="p-5 border-slate-200 space-y-1">
    <div className="flex items-center gap-2 mb-2">
      <Icon className="w-4 h-4 text-emerald-600" />
      <h2 className="text-sm font-bold text-slate-900">{title}</h2>
    </div>
    <div className="divide-y divide-slate-100">{children}</div>
    {onSave && (
      <div className="pt-4 flex justify-end">
        <Button size="sm" onClick={onSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
        </Button>
      </div>
    )}
  </Card>
);

export const SettingsPage = () => {
  const { showToast } = useApp();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [prefs, setPrefs] = useState({ notifications: true, emailNotifications: true, marketingEmails: false });
  const [privacy, setPrivacy] = useState({ profileVisibility: 'public', allowMessages: true, allowCollaborationRequests: true });
  const [appearance, setAppearance] = useState({ theme: 'system' });
  const [saving, setSaving] = useState('');

  const [sessions, setSessions] = useState([]);
  const [revoking, setRevoking] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getSettings();
      const p = data?.preferences || {};
      setPrefs({
        notifications: p.notifications ?? true,
        emailNotifications: p.emailNotifications ?? true,
        marketingEmails: p.marketingEmails ?? false,
      });
      setPrivacy({
        profileVisibility: p.profileVisibility || p.privacy || 'public',
        allowMessages: p.allowMessages ?? true,
        allowCollaborationRequests: p.allowCollaborationRequests ?? true,
      });
      setAppearance({ theme: p.theme || 'system' });
    } catch (err) {
      setError(err.message || 'Failed to load settings.');
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async () => {
    try {
      const data = await getSessions();
      setSessions(Array.isArray(data) ? data : (data?.sessions || []));
    } catch {
      // Sessions are a bonus panel; a failure here should not block the page.
      setSessions([]);
    }
  };

  useEffect(() => {
    load();
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runSave = async (key, fn) => {
    setSaving(key);
    try {
      await fn();
      showToast('Settings Saved', 'Your changes have been saved.', 'success');
    } catch (err) {
      showToast('Save Failed', err.message || 'Could not save settings.', 'error');
    } finally {
      setSaving('');
    }
  };

  const handleRevoke = async (id) => {
    setRevoking(id);
    try {
      await deleteSession(id);
      setSessions((prev) => prev.filter((s) => (s._id || s.id) !== id));
      showToast('Session Revoked', 'That session has been signed out.', 'info');
    } catch (err) {
      showToast('Revoke Failed', err.message || 'Could not revoke session.', 'error');
    } finally {
      setRevoking(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="ml-2 text-sm">Loading settings…</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Settings</h1>
        <p className="text-xs text-slate-500 mt-1">Manage your notifications, privacy, appearance, and active sessions.</p>
      </div>

      {error && (
        <Card className="p-4 border border-red-200 bg-red-50/60 flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 text-sm">{error}</div>
          <Button variant="outline" size="sm" onClick={load}>Retry</Button>
        </Card>
      )}

      <SectionCard icon={Bell} title="Notifications" saving={saving === 'prefs'} onSave={() => runSave('prefs', () => updatePreferences(prefs))}>
        <Toggle label="In-app notifications" description="Show alerts inside TrustNet." checked={prefs.notifications} onChange={(v) => setPrefs((s) => ({ ...s, notifications: v }))} />
        <Toggle label="Email notifications" description="Send important updates to your email." checked={prefs.emailNotifications} onChange={(v) => setPrefs((s) => ({ ...s, emailNotifications: v }))} />
        <Toggle label="Marketing emails" description="Occasional product news and tips." checked={prefs.marketingEmails} onChange={(v) => setPrefs((s) => ({ ...s, marketingEmails: v }))} />
      </SectionCard>

      <SectionCard icon={Shield} title="Privacy" saving={saving === 'privacy'} onSave={() => runSave('privacy', () => updatePrivacy(privacy))}>
        <div className="flex items-center justify-between py-3">
          <div className="pr-4">
            <p className="text-sm font-semibold text-slate-800">Profile visibility</p>
            <p className="text-xs text-slate-500 mt-0.5">Who can see your profile.</p>
          </div>
          <select
            value={privacy.profileVisibility}
            onChange={(e) => setPrivacy((s) => ({ ...s, profileVisibility: e.target.value }))}
            className="text-sm bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            <option value="public">Public</option>
            <option value="connections">Connections</option>
            <option value="private">Private</option>
          </select>
        </div>
        <Toggle label="Allow direct messages" checked={privacy.allowMessages} onChange={(v) => setPrivacy((s) => ({ ...s, allowMessages: v }))} />
        <Toggle label="Allow collaboration requests" checked={privacy.allowCollaborationRequests} onChange={(v) => setPrivacy((s) => ({ ...s, allowCollaborationRequests: v }))} />
      </SectionCard>

      <SectionCard icon={Palette} title="Appearance" saving={saving === 'appearance'} onSave={() => runSave('appearance', () => updateAppearance(appearance))}>
        <div className="flex items-center justify-between py-3">
          <div className="pr-4">
            <p className="text-sm font-semibold text-slate-800">Theme</p>
            <p className="text-xs text-slate-500 mt-0.5">Choose how TrustNet looks.</p>
          </div>
          <select
            value={appearance.theme}
            onChange={(e) => setAppearance({ theme: e.target.value })}
            className="text-sm bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </SectionCard>

      <SectionCard icon={Monitor} title="Active Sessions">
        {sessions.length === 0 ? (
          <p className="text-xs text-slate-400 py-3">No other active sessions.</p>
        ) : (
          sessions.map((s) => {
            const id = s._id || s.id;
            return (
              <div key={id} className="flex items-center justify-between py-3">
                <div className="pr-4 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{s.device || s.userAgent || 'Unknown device'}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{s.ip || s.location || ''}{s.current ? ' • This device' : ''}</p>
                </div>
                {!s.current && (
                  <Button variant="outline" size="sm" disabled={revoking === id} onClick={() => handleRevoke(id)}>
                    {revoking === id ? <Loader2 className="w-4 h-4 animate-spin" /> : (<><LogOut className="w-3.5 h-3.5 mr-1" />Revoke</>)}
                  </Button>
                )}
              </div>
            );
          })
        )}
      </SectionCard>
    </div>
  );
};
