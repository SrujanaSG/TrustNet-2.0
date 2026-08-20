import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Users,
  Rocket,
  Check,
  X,
  ShieldCheck,
  BarChart3,
  Bell,
  Settings,
  FileText,
  Briefcase,
  DollarSign,
  Flag,
  Search,
  Eye,
  RefreshCw,
  Activity
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Tabs } from '../../components/ui/Tabs';
import { useApp } from '../../context/AppContext';
import * as adminApi from '../../lib/adminApi';

// Sections whose backend route genuinely does not exist yet (broadcast,
// reports/disputes, platform settings, system health, platform-wide
// analytics). Rather than fabricate numbers, those sections render this
// notice. Sections with a real endpoint (overview, users, startups,
// verification, audit logs) are wired to live data below and never show it.
const UnavailableNotice = ({ children }) => (
  <div className="flex items-center gap-2 p-3 bg-slate-50 text-slate-600 rounded-xl border border-slate-200 text-[11px] font-semibold">
    <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-500" strokeWidth={1.75} />
    <span>{children || 'No backend endpoint exists for this section yet, so it is intentionally left inactive.'}</span>
  </div>
);

const ROLE_OPTIONS = ['founder', 'entrepreneur', 'investor', 'client', 'mentor', 'builder', 'admin'];

export const AdminDashboardPage = () => {
  const { showToast } = useApp();

  const [activeSection, setActiveSection] = useState('overview');
  const [managementSubTab, setManagementSubTab] = useState('users');
  const [contentSubTab, setContentSubTab] = useState('posts');
  const [settingsSubTab, setSettingsSubTab] = useState('audit-logs');

  const [searchQuery, setSearchQuery] = useState('');

  // --- Overview (GET /admin/dashboard/overview) -------------------------
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState('');

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError('');
    try {
      setOverview(await adminApi.getOverview());
    } catch (err) {
      setOverviewError(err.message || 'Failed to load dashboard overview.');
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  // --- Verification queue (GET/POST /admin/verifications) ---------------
  const [verificationsQueue, setVerificationsQueue] = useState([]);
  const [verificationsLoading, setVerificationsLoading] = useState(true);
  const [verificationsError, setVerificationsError] = useState('');
  const [actioningId, setActioningId] = useState(null);

  // Per-user document detail. The queue LIST only returns document summaries
  // (type/status/uploadedAt, no URL). Viewable files are short-lived signed
  // URLs returned only by GET /admin/verifications/:id, fetched on demand.
  const [docDetail, setDocDetail] = useState({});

  const loadDocuments = useCallback(async (userId) => {
    setDocDetail((prev) => ({ ...prev, [userId]: { status: 'loading', docs: [], error: '' } }));
    try {
      const detail = await adminApi.getVerification(userId);
      setDocDetail((prev) => ({ ...prev, [userId]: { status: 'ready', docs: detail?.verificationDocuments || [], error: '' } }));
    } catch (err) {
      setDocDetail((prev) => ({ ...prev, [userId]: { status: 'error', docs: [], error: err.message || 'Could not load documents.' } }));
    }
  }, []);

  const loadVerifications = useCallback(async () => {
    setVerificationsLoading(true);
    setVerificationsError('');
    try {
      const users = await adminApi.listVerifications();
      setVerificationsQueue(Array.isArray(users) ? users : []);
    } catch (err) {
      setVerificationsError(err.message || 'Failed to load verification queue.');
    } finally {
      setVerificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVerifications();
  }, [loadVerifications]);

  // --- User directory (GET /admin/users, role-filtered per sub-tab) -----
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [userActioningId, setUserActioningId] = useState(null);

  // investors/mentors sub-tabs reuse the same endpoint with a role filter;
  // "users" shows everyone. "professionals" has no matching role.
  const roleForSubTab = { users: undefined, investors: 'investor', mentors: 'mentor' };

  const loadUsers = useCallback(async (role) => {
    setUsersLoading(true);
    setUsersError('');
    try {
      const result = await adminApi.listUsers(role ? { role } : {});
      setUsersList(Array.isArray(result) ? result : []);
    } catch (err) {
      setUsersError(err.message || 'Failed to load users.');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeSection !== 'management') return;
    if (!Object.prototype.hasOwnProperty.call(roleForSubTab, managementSubTab)) return;
    loadUsers(roleForSubTab[managementSubTab]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, managementSubTab, loadUsers]);

  // --- Startup moderation (GET /admin/startups) -------------------------
  const [startupsList, setStartupsList] = useState([]);
  const [startupsLoading, setStartupsLoading] = useState(false);
  const [startupsError, setStartupsError] = useState('');
  const [startupActioningId, setStartupActioningId] = useState(null);

  const loadStartups = useCallback(async () => {
    setStartupsLoading(true);
    setStartupsError('');
    try {
      const result = await adminApi.listStartups();
      setStartupsList(Array.isArray(result) ? result : []);
    } catch (err) {
      setStartupsError(err.message || 'Failed to load startups.');
    } finally {
      setStartupsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeSection === 'management' && managementSubTab === 'startups') {
      loadStartups();
    }
  }, [activeSection, managementSubTab, loadStartups]);

  // --- Audit log (GET /admin/activity-logs) -----------------------------
  const [logsList, setLogsList] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState('');

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    setLogsError('');
    try {
      const result = await adminApi.listActivityLogs({ limit: 50 });
      setLogsList(Array.isArray(result) ? result : []);
    } catch (err) {
      setLogsError(err.message || 'Failed to load audit logs.');
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeSection === 'settings' && settingsSubTab === 'audit-logs') {
      loadLogs();
    }
  }, [activeSection, settingsSubTab, loadLogs]);

  // --- Verification actions ---------------------------------------------
  const handleApproveVerification = async (userId, name) => {
    setActioningId(userId);
    try {
      await adminApi.approveVerification(userId);
      setVerificationsQueue((prev) => prev.filter((v) => v._id !== userId));
      showToast('Identity Verified', `Approved badge for ${name}.`, 'success');
      loadOverview();
    } catch (err) {
      showToast('Approval Failed', err.message || 'Could not approve this verification.', 'error');
    } finally {
      setActioningId(null);
    }
  };

  const handleRejectVerification = async (userId, name) => {
    const reason = window.prompt(`Reason for rejecting ${name}'s verification (optional):`) || undefined;
    setActioningId(userId);
    try {
      await adminApi.rejectVerification(userId, reason);
      setVerificationsQueue((prev) => prev.filter((v) => v._id !== userId));
      showToast('Verification Rejected', `Rejected submission for ${name}.`, 'info');
      loadOverview();
    } catch (err) {
      showToast('Rejection Failed', err.message || 'Could not reject this verification.', 'error');
    } finally {
      setActioningId(null);
    }
  };

  // --- User actions ------------------------------------------------------
  const handleToggleUserStatus = async (user) => {
    const id = user._id;
    const suspending = user.isActive;
    setUserActioningId(id);
    try {
      const updated = suspending
        ? await adminApi.suspendUser(id)
        : await adminApi.reactivateUser(id);
      setUsersList((prev) => prev.map((u) => (u._id === id ? { ...u, isActive: updated?.isActive ?? !suspending } : u)));
      showToast('User Updated', `${user.fullName} is now ${suspending ? 'suspended' : 'active'}.`, 'info');
    } catch (err) {
      showToast('Update Failed', err.message || 'Could not update this user.', 'error');
    } finally {
      setUserActioningId(null);
    }
  };

  const handleChangeRole = async (user) => {
    const role = window.prompt(
      `New role for ${user.fullName} (one of: ${ROLE_OPTIONS.join(', ')}):`,
      user.role
    );
    if (!role || role === user.role) return;
    setUserActioningId(user._id);
    try {
      const updated = await adminApi.changeUserRole(user._id, role.trim());
      setUsersList((prev) => prev.map((u) => (u._id === user._id ? { ...u, role: updated?.role ?? role.trim() } : u)));
      showToast('Role Updated', `${user.fullName} is now ${updated?.role ?? role.trim()}.`, 'success');
    } catch (err) {
      showToast('Role Change Failed', err.message || 'Could not change this role.', 'error');
    } finally {
      setUserActioningId(null);
    }
  };

  // --- Startup actions ---------------------------------------------------
  const handleSuspendStartup = async (startup) => {
    const reason = window.prompt(`Reason for suspending "${startup.name}" (optional):`) || undefined;
    setStartupActioningId(startup._id);
    try {
      await adminApi.suspendStartup(startup._id, reason);
      // The list only holds active startups, so a suspended one drops out.
      setStartupsList((prev) => prev.filter((s) => s._id !== startup._id));
      showToast('Startup Suspended', `${startup.name} has been suspended.`, 'info');
      loadOverview();
    } catch (err) {
      showToast('Suspend Failed', err.message || 'Could not suspend this startup.', 'error');
    } finally {
      setStartupActioningId(null);
    }
  };

  const sectionTabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'management', label: 'Management', icon: Users },
    { id: 'verification', label: 'Verification', icon: ShieldCheck, badge: verificationsQueue.length },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'moderation', label: 'Moderation', icon: Flag },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const totals = overview?.totals;
  const filteredUsers = usersList.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (u.fullName || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-8 max-w-[1440px] mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-200/80">
              <ShieldAlert className="w-7 h-7 text-emerald-500" strokeWidth={1.75} />
            </div>
            <span>Enterprise Admin Console</span>
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1.5">
            Full platform administration, user directory management, identity verifications, content moderation & system settings.
          </p>
        </div>

        <Badge variant="emerald" size="lg">
          <ShieldCheck className="w-4 h-4 mr-1.5" strokeWidth={1.75} />
          Super Admin Mode
        </Badge>
      </div>

      {/* Main Navigation Tabs */}
      <Card className="p-2 border-slate-200/80 bg-white overflow-x-auto shadow-soft-sm">
        <Tabs tabs={sectionTabs} activeTab={activeSection} onChange={setActiveSection} />
      </Card>

      {/* 1. OVERVIEW SECTION -- live totals from GET /admin/dashboard/overview */}
      {activeSection === 'overview' && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Platform Overview</h3>
            <Button variant="outline" size="sm" onClick={loadOverview} disabled={overviewLoading}>
              <RefreshCw className={`w-3.5 h-3.5 ${overviewLoading ? 'animate-spin' : ''}`} strokeWidth={1.75} />
            </Button>
          </div>

          {overviewLoading && (
            <div className="p-6 text-center text-xs text-slate-500">Loading platform totals…</div>
          )}

          {!overviewLoading && overviewError && (
            <div className="p-4 bg-rose-50 text-rose-600 rounded-xl border border-rose-200 text-xs font-medium flex items-center justify-between gap-3">
              <span>{overviewError}</span>
              <button type="button" onClick={loadOverview} className="font-semibold hover:underline shrink-0">Retry</button>
            </div>
          )}

          {!overviewLoading && !overviewError && totals && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6 border-slate-200/80 hoverEffect">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Users</span>
                  <h3 className="text-3xl font-black text-slate-900 mt-2">{totals.users.toLocaleString()}</h3>
                  <span className="text-xs text-emerald-600 font-semibold mt-2 block">{totals.verifiedUsers.toLocaleString()} verified</span>
                </Card>

                <Card className="p-6 border-slate-200/80 hoverEffect">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Startups</span>
                  <h3 className="text-3xl font-black text-emerald-600 mt-2">{totals.startups.toLocaleString()}</h3>
                  <span className="text-xs text-slate-500 mt-2 block">{totals.fundingRounds.toLocaleString()} funding rounds</span>
                </Card>

                <Card className="p-6 border-slate-200/80 hoverEffect">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Pending Verification</span>
                  <h3 className="text-3xl font-black text-amber-600 mt-2">{totals.pendingVerifications.toLocaleString()}</h3>
                  <span className="text-xs text-amber-600 font-semibold mt-2 block">Requires manual audit</span>
                </Card>

                <Card className="p-6 border-slate-200/80 hoverEffect">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Communities</span>
                  <h3 className="text-3xl font-black text-slate-900 mt-2">{totals.communities.toLocaleString()}</h3>
                  <span className="text-xs text-slate-500 mt-2 block">{totals.posts.toLocaleString()} posts</span>
                </Card>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
                <Card className="p-4 border-slate-200/80">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Jobs</span>
                  <h4 className="text-xl font-black text-slate-900 mt-1">{totals.jobs.toLocaleString()}</h4>
                </Card>
                <Card className="p-4 border-slate-200/80">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Marketplace Listings</span>
                  <h4 className="text-xl font-black text-slate-900 mt-1">{totals.marketplaceListings.toLocaleString()}</h4>
                </Card>
                <Card className="p-4 border-slate-200/80">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Funding Rounds</span>
                  <h4 className="text-xl font-black text-slate-900 mt-1">{totals.fundingRounds.toLocaleString()}</h4>
                </Card>
              </div>

              <Card className="p-6 border-slate-200/80 space-y-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" strokeWidth={1.75} />
                  Recent Activity
                </h3>
                {(overview.recentActivity || []).length === 0 ? (
                  <p className="text-xs text-slate-500">No recorded admin activity yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {(overview.recentActivity || []).map((log) => (
                      <div key={log._id} className="py-3 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold text-slate-900">{log.action}</p>
                          <p className="text-[11px] text-slate-500">
                            {log.actor?.fullName || 'System'} • {log.targetType || 'n/a'}
                          </p>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      )}

      {/* 2. MANAGEMENT SECTION -- users/investors/mentors via GET /admin/users
          (role-filtered), startups via GET /admin/startups. Professionals has
          no matching backend role, so it is left inactive. */}
      {activeSection === 'management' && (
        <div className="space-y-6">
          {/* Sub-tabs bar */}
          <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3 overflow-x-auto">
            {[
              { id: 'users', label: 'Users Directory', icon: Users },
              { id: 'startups', label: 'Startups', icon: Rocket },
              { id: 'investors', label: 'Investors', icon: DollarSign },
              { id: 'mentors', label: 'Mentors', icon: Users },
              { id: 'professionals', label: 'Professionals', icon: Briefcase }
            ].map((sub) => {
              const Icon = sub.icon;
              return (
                <button
                  key={sub.id}
                  onClick={() => setManagementSubTab(sub.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] ${
                    managementSubTab === sub.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={1.75} />
                  <span>{sub.label}</span>
                </button>
              );
            })}
          </div>

          {/* USERS / INVESTORS / MENTORS SUB-TABS (real, role-filtered) */}
          {['users', 'investors', 'mentors'].includes(managementSubTab) && (
            <Card className="p-6 border-slate-200/80 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 capitalize">
                    {managementSubTab === 'users' ? 'User Management Directory' : `${managementSubTab} Directory`}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Search, change roles, or suspend / reactivate accounts.</p>
                </div>

                <div className="flex items-center gap-3">
                  <Input
                    icon={Search}
                    placeholder="Search by name or email…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadUsers(roleForSubTab[managementSubTab])}
                    disabled={usersLoading}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${usersLoading ? 'animate-spin' : ''}`} strokeWidth={1.75} />
                  </Button>
                </div>
              </div>

              {usersLoading && <div className="p-6 text-center text-xs text-slate-500">Loading users…</div>}

              {!usersLoading && usersError && (
                <div className="p-4 bg-rose-50 text-rose-600 rounded-xl border border-rose-200 text-xs font-medium flex items-center justify-between gap-3">
                  <span>{usersError}</span>
                  <button type="button" onClick={() => loadUsers(roleForSubTab[managementSubTab])} className="font-semibold hover:underline shrink-0">Retry</button>
                </div>
              )}

              {!usersLoading && !usersError && filteredUsers.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-500">No users match this view.</div>
              )}

              {!usersLoading && !usersError && filteredUsers.length > 0 && (
                <div className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => (
                    <div key={user._id} className="py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs">
                          {(user.fullName || '?').charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900">{user.fullName}</h4>
                            {user.isVerified && <Badge variant="emerald" size="sm">Verified</Badge>}
                          </div>
                          <p className="text-[11px] text-slate-500">{user.email} • Role: {user.role}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge variant={user.isActive ? 'emerald' : 'rose'}>{user.isActive ? 'Active' : 'Suspended'}</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          isLoading={userActioningId === user._id}
                          onClick={() => handleChangeRole(user)}
                        >
                          Role
                        </Button>
                        <Button
                          variant={user.isActive ? 'outline' : 'primary'}
                          size="sm"
                          isLoading={userActioningId === user._id}
                          onClick={() => handleToggleUserStatus(user)}
                        >
                          {user.isActive ? 'Suspend' : 'Activate'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* STARTUPS SUB-TAB (real) */}
          {managementSubTab === 'startups' && (
            <Card className="p-6 border-slate-200/80 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Startup Moderation</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Active, published startups. Suspending one removes it from the public listing.</p>
                </div>
                <Button variant="outline" size="sm" onClick={loadStartups} disabled={startupsLoading}>
                  <RefreshCw className={`w-3.5 h-3.5 ${startupsLoading ? 'animate-spin' : ''}`} strokeWidth={1.75} />
                </Button>
              </div>

              {startupsLoading && <div className="p-6 text-center text-xs text-slate-500">Loading startups…</div>}

              {!startupsLoading && startupsError && (
                <div className="p-4 bg-rose-50 text-rose-600 rounded-xl border border-rose-200 text-xs font-medium flex items-center justify-between gap-3">
                  <span>{startupsError}</span>
                  <button type="button" onClick={loadStartups} className="font-semibold hover:underline shrink-0">Retry</button>
                </div>
              )}

              {!startupsLoading && !startupsError && startupsList.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-500">No active startups indexed.</div>
              )}

              {!startupsLoading && !startupsError && startupsList.length > 0 && (
                <div className="divide-y divide-slate-100">
                  {startupsList.map((startup) => (
                    <div key={startup._id} className="py-4 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900">{startup.name}</h4>
                          {startup.stage && <Badge variant="slate" size="sm">{startup.stage}</Badge>}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{startup.tagline || 'No tagline'}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        isLoading={startupActioningId === startup._id}
                        onClick={() => handleSuspendStartup(startup)}
                      >
                        Suspend
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* PROFESSIONALS SUB-TAB (no matching backend role) */}
          {managementSubTab === 'professionals' && (
            <Card className="p-6 border-slate-200/80 space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Professionals</h3>
              <UnavailableNotice>
                There is no distinct &quot;professional&quot; role in the backend user model, so this tab has no data source. Use the Users Directory and filter by role instead.
              </UnavailableNotice>
            </Card>
          )}
        </div>
      )}

      {/* 3. VERIFICATION SECTION -- wired to the real backend
          (GET/POST /api/v1/admin/verifications, see adminApi.js) */}
      {activeSection === 'verification' && (
        <Card className="p-6 border-slate-200/80 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Verification Center Queue</h3>
              <p className="text-xs text-slate-500 mt-0.5">Review identity documents and KYC submissions awaiting approval.</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="emerald">{verificationsQueue.length} Pending</Badge>
              <Button variant="outline" size="sm" onClick={loadVerifications} disabled={verificationsLoading}>
                <RefreshCw className={`w-3.5 h-3.5 ${verificationsLoading ? 'animate-spin' : ''}`} strokeWidth={1.75} />
              </Button>
            </div>
          </div>

          {verificationsLoading && (
            <div className="p-6 text-center text-xs text-slate-500">Loading verification queue…</div>
          )}

          {!verificationsLoading && verificationsError && (
            <div className="p-4 bg-rose-50 text-rose-600 rounded-xl border border-rose-200 text-xs font-medium">
              {verificationsError}
            </div>
          )}

          {!verificationsLoading && !verificationsError && verificationsQueue.length === 0 && (
            <div className="p-6 text-center text-xs text-slate-500">No pending verifications. All caught up.</div>
          )}

          <div className="space-y-3">
            {verificationsQueue.map((item) => (
              <div key={item._id} className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900">{item.fullName}</h4>
                    <Badge variant="emerald">{item.designation || item.role}</Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {item.email} • Submitted: {item.verificationSubmittedAt ? new Date(item.verificationSubmittedAt).toLocaleDateString() : 'Unknown'}
                  </p>
                  <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">
                    {(item.verificationDocuments || []).length} document(s) submitted
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {(() => {
                    const d = docDetail[item._id];
                    if (!d) {
                      return (
                        <Button variant="outline" size="sm" onClick={() => loadDocuments(item._id)}>
                          <Eye className="w-3.5 h-3.5" strokeWidth={1.75} />
                          <span>Review documents</span>
                        </Button>
                      );
                    }
                    if (d.status === 'loading') {
                      return <Button variant="outline" size="sm" isLoading disabled><span>Loading…</span></Button>;
                    }
                    if (d.status === 'error') {
                      return (
                        <button type="button" onClick={() => loadDocuments(item._id)} className="text-[11px] font-semibold text-trust-alert hover:underline">
                          {d.error} — retry
                        </button>
                      );
                    }
                    if (!d.docs.length) {
                      return <span className="text-[11px] text-slate-500">No documents</span>;
                    }
                    return d.docs.map((doc) => (
                      <a
                        key={doc._id || doc.type}
                        href={doc.url || undefined}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex"
                        aria-disabled={!doc.url}
                      >
                        <Button variant="outline" size="sm" disabled={!doc.url}>
                          <Eye className="w-3.5 h-3.5" strokeWidth={1.75} />
                          <span>{doc.type}</span>
                        </Button>
                      </a>
                    ));
                  })()}
                  <Button
                    variant="outline"
                    size="sm"
                    isLoading={actioningId === item._id}
                    onClick={() => handleRejectVerification(item._id, item.fullName)}
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span>Reject</span>
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={actioningId === item._id}
                    onClick={() => handleApproveVerification(item._id, item.fullName)}
                  >
                    <Check className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span>Approve Badge</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 4. CONTENT SECTION -- there is a per-item moderation route
          (POST /admin/content/:type/:id/moderate) but no admin endpoint that
          LISTS content, so there is nothing to enumerate here. */}
      {activeSection === 'content' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3 overflow-x-auto">
            {[
              { id: 'posts', label: 'Posts & Feed' },
              { id: 'events', label: 'Events' },
              { id: 'partnerships', label: 'Partnerships' },
              { id: 'featured-content', label: 'Featured Content' }
            ].map((sub) => (
              <button
                key={sub.id}
                onClick={() => setContentSubTab(sub.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] ${
                  contentSubTab === sub.id
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>

          <Card className="p-6 border-slate-200/80 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 capitalize">{contentSubTab.replace('-', ' ')} Management</h3>
            <UnavailableNotice>
              The backend can moderate a known item (hide / restore / delete) but exposes no endpoint to LIST content for review, so there is nothing to enumerate here yet.
            </UnavailableNotice>
          </Card>
        </div>
      )}

      {/* 5. MODERATION SECTION -- no report/dispute model or route exists. */}
      {activeSection === 'moderation' && (
        <Card className="p-6 border-slate-200/80 space-y-4">
          <h3 className="text-lg font-bold text-slate-900">User Dispute & Report Queue</h3>
          <UnavailableNotice>
            No reports / disputes model exists on the backend, so there is no queue to load.
          </UnavailableNotice>
        </Card>
      )}

      {/* 6. ANALYTICS SECTION -- the real analytics module is per-startup
          (AnalyticsPage.jsx / GET /api/v1/analytics). There is no
          admin-wide time-series analytics endpoint; platform totals live in
          the Overview tab. */}
      {activeSection === 'analytics' && (
        <Card className="p-6 border-slate-200/80 space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Ecosystem Platform Analytics</h3>
          <UnavailableNotice>
            There is no admin-wide analytics endpoint. Live platform totals are in the Overview tab; per-startup analytics live on each startup&apos;s Analytics page.
          </UnavailableNotice>
        </Card>
      )}

      {/* 7. NOTIFICATIONS BROADCAST SECTION -- no broadcast endpoint exists
          (Notification model is per-user, created by specific actions). */}
      {activeSection === 'notifications' && (
        <Card className="p-6 border-slate-200/80 space-y-4">
          <h3 className="text-lg font-bold text-slate-900">System Announcement Broadcast</h3>
          <UnavailableNotice>
            The Notification model is per-user and created by specific actions; there is no admin broadcast endpoint to send a platform-wide announcement.
          </UnavailableNotice>
        </Card>
      )}

      {/* 8. SETTINGS SECTION -- only the Audit Logs sub-tab has a backend
          (GET /admin/activity-logs). Roles editor / platform settings /
          system health have no route. */}
      {activeSection === 'settings' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3 overflow-x-auto">
            {[
              { id: 'audit-logs', label: 'Audit Logs' },
              { id: 'roles-permissions', label: 'Roles & Permissions' },
              { id: 'platform-settings', label: 'Platform Settings' },
              { id: 'system-health', label: 'System Health' }
            ].map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSettingsSubTab(sub.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] ${
                  settingsSubTab === sub.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {settingsSubTab === 'audit-logs' && (
            <Card className="p-6 border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Audit Logs</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Every admin mutation is recorded server-side. Most recent first.</p>
                </div>
                <Button variant="outline" size="sm" onClick={loadLogs} disabled={logsLoading}>
                  <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin' : ''}`} strokeWidth={1.75} />
                </Button>
              </div>

              {logsLoading && <div className="p-6 text-center text-xs text-slate-500">Loading audit logs…</div>}

              {!logsLoading && logsError && (
                <div className="p-4 bg-rose-50 text-rose-600 rounded-xl border border-rose-200 text-xs font-medium flex items-center justify-between gap-3">
                  <span>{logsError}</span>
                  <button type="button" onClick={loadLogs} className="font-semibold hover:underline shrink-0">Retry</button>
                </div>
              )}

              {!logsLoading && !logsError && logsList.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-500">No audit entries recorded yet.</div>
              )}

              {!logsLoading && !logsError && logsList.length > 0 && (
                <div className="divide-y divide-slate-100">
                  {logsList.map((log) => (
                    <div key={log._id} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold text-slate-900">{log.action}</p>
                        <p className="text-[11px] text-slate-500">
                          {log.actor?.fullName || 'System'} ({log.actor?.role || 'n/a'}) • {log.targetType || 'n/a'}
                          {log.targetId ? ` #${String(log.targetId).slice(-6)}` : ''}
                        </p>
                      </div>
                      <span className="text-[11px] text-slate-400 shrink-0">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {settingsSubTab !== 'audit-logs' && (
            <Card className="p-6 border-slate-200/80 space-y-4">
              <h3 className="text-lg font-bold text-slate-900 capitalize">{settingsSubTab.replace('-', ' ')}</h3>
              <UnavailableNotice>
                No backend endpoint exists for this configuration area yet.
              </UnavailableNotice>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
