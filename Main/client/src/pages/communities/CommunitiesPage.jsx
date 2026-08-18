import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Loader2, AlertCircle, Rss } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { listCommunities, joinCommunity, leaveCommunity } from '../../lib/communityApi';

export const CommunitiesPage = () => {
  const { showToast } = useApp();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const myId = String(currentUser?._id || currentUser?.id || '');
  const isMember = (comm) =>
    Array.isArray(comm.members) && comm.members.some((m) => String(m?._id || m) === myId);

  const fetchCommunities = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listCommunities();
      setCommunities(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load communities from TrustNet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, []);

  const handleToggleJoin = async (comm) => {
    const joined = isMember(comm);
    setBusyId(comm._id);
    try {
      const updated = joined ? await leaveCommunity(comm._id) : await joinCommunity(comm._id);
      // Replace the affected community with the server's updated record.
      setCommunities((prev) => prev.map((c) => (c._id === comm._id ? (updated || c) : c)));
      showToast(
        joined ? 'Left Community' : 'Joined Community',
        `Updated membership for ${comm.name}.`,
        'info'
      );
    } catch (err) {
      showToast('Action Failed', err.message || 'Could not update membership.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Communities Hub</h1>
          <p className="text-xs text-slate-500 mt-1">Connect with specialized peer groups across the TrustNet ecosystem</p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-24 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="ml-2 text-sm">Loading communities…</span>
        </div>
      )}

      {!loading && error && (
        <Card className="p-4 border border-red-200 bg-red-50/60 flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 text-sm">{error}</div>
          <Button variant="outline" size="sm" onClick={fetchCommunities}>Retry</Button>
        </Card>
      )}

      {!loading && !error && communities.length === 0 && (
        <EmptyState
          icon={Rss}
          title="No Communities Yet"
          description="There are no communities on TrustNet at the moment. Check back soon."
        />
      )}

      {!loading && !error && communities.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {communities.map((comm) => {
            const joined = isMember(comm);
            return (
              <Card key={comm._id} hoverEffect className="overflow-hidden border-slate-200 flex flex-col justify-between h-full">
                <div>
                  <div className="h-28 w-full bg-gradient-to-br from-emerald-500/20 to-slate-200 relative">
                    {comm.coverImageUrl && (
                      <img src={comm.coverImageUrl} alt={comm.name} className="w-full h-full object-cover" />
                    )}
                    {comm.category && (
                      <div className="absolute top-3 right-3">
                        <Badge variant="emerald">{comm.category}</Badge>
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <h3
                      onClick={() => navigate(`/app/communities/${comm._id}`)}
                      className="text-base font-bold text-slate-900 hover:text-emerald-600 transition-colors cursor-pointer"
                    >
                      {comm.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {comm.description}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-0 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {comm.memberCount ?? (comm.members?.length || 0)} Members
                  </span>

                  <Button
                    size="sm"
                    variant={joined ? 'secondary' : 'primary'}
                    disabled={busyId === comm._id}
                    onClick={() => handleToggleJoin(comm)}
                  >
                    {busyId === comm._id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>{joined ? 'Joined' : 'Join Community'}</span>
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
