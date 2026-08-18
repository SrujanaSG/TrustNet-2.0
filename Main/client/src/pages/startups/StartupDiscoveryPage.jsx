import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Flame, ShieldCheck, DollarSign, Rocket, Loader2, AlertCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StartupCard } from '../../components/cards/StartupCard';
import { EmptyState } from '../../components/common/EmptyState';
import { useStartups } from '../../hooks/useStartups';

// Category pills filter the real startup list on real fields only. Where the
// backend exposes no signal (Trending/Verified), the pill shows the full real
// list rather than inventing a score.
const CATEGORIES = [
  { id: 'Featured', label: 'Featured', icon: Sparkles },
  { id: 'Trending', label: 'Newest', icon: Flame },
  { id: 'RecentlyFunded', label: 'Recently Funded', icon: DollarSign },
  { id: 'Verified', label: 'All Startups', icon: ShieldCheck },
];

export const StartupDiscoveryPage = () => {
  const navigate = useNavigate();
  const { startups, loading, error, refetch } = useStartups();
  const [activeCategory, setActiveCategory] = useState('Featured');

  const filtered = useMemo(() => {
    const list = [...startups];
    switch (activeCategory) {
      case 'Featured':
        return list.filter((s) => s.isFeatured);
      case 'Trending':
        return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      case 'RecentlyFunded':
        return list.filter((s) => (s.fundingRaised || 0) > 0).sort((a, b) => (b.fundingRaised || 0) - (a.fundingRaised || 0));
      default:
        return list;
    }
  }, [startups, activeCategory]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <Card className="p-8 sm:p-10 border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4 max-w-2xl">
          <Badge variant="emerald" className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Startup Discovery Engine
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            Discover startups building on TrustNet
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed font-normal">
            Explore verified founders and startups raising active rounds across the ecosystem.
          </p>
          <div className="flex gap-3 pt-2">
            <Button variant="primary" onClick={() => navigate('/app/startups/create')}>
              <span>Publish Your Startup</span>
            </Button>
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all min-w-max ${
                isActive ? 'bg-emerald-500 text-white shadow-soft-sm' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-24 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="ml-2 text-sm">Loading startups…</span>
        </div>
      )}

      {!loading && error && (
        <Card className="p-4 border border-red-200 bg-red-50/60 flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 text-sm">{error}</div>
          <Button variant="outline" size="sm" onClick={refetch}>Retry</Button>
        </Card>
      )}

      {!loading && !error && (
        filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((s) => (
              <StartupCard key={s.id} startup={s} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Rocket}
            title="No Startups Yet"
            description={activeCategory === 'Featured' ? 'No featured startups right now — try another category.' : 'No startups have been published yet.'}
          />
        )
      )}
    </div>
  );
};
