import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Rocket, Loader2, AlertCircle } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StartupCard } from '../../components/cards/StartupCard';
import { EmptyState } from '../../components/common/EmptyState';
import { useStartups } from '../../hooks/useStartups';
import { STAGE_OPTIONS } from '../../lib/adapters/startupAdapter';

export const StartupsPage = () => {
  const navigate = useNavigate();
  const { startups, loading, error, refetch } = useStartups();

  const [search, setSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState('All');

  const filteredStartups = useMemo(() => {
    const q = search.trim().toLowerCase();
    return startups.filter((s) => {
      const matchesSearch =
        !q ||
        (s.name || '').toLowerCase().includes(q) ||
        (s.industry || '').toLowerCase().includes(q) ||
        (s.tagline || '').toLowerCase().includes(q);
      const matchesStage = selectedStage === 'All' || s.stage === selectedStage;
      return matchesSearch && matchesStage;
    });
  }, [startups, search, selectedStage]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Explore Startups</h1>
          <p className="text-xs text-slate-500 mt-1">Discover startups across the TrustNet ecosystem</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => navigate('/app/startups/create')}>
          <Plus className="w-4 h-4" />
          <span>Publish Startup</span>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-soft-sm">
        <div className="flex-1 w-full">
          <Input
            icon={Search}
            placeholder="Search by startup name, industry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['All', ...STAGE_OPTIONS.map((s) => s.value)].map((stg) => (
            <button
              key={stg}
              onClick={() => setSelectedStage(stg)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all capitalize ${
                selectedStage === stg
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {stg === 'All' ? 'All' : STAGE_OPTIONS.find((o) => o.value === stg)?.label || stg}
            </button>
          ))}
        </div>
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
        filteredStartups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStartups.map((s) => (
              <StartupCard key={s.id} startup={s} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Rocket}
            title="No Startups Found"
            description={startups.length === 0 ? 'No startups have been published yet.' : `No startups matched your filters.`}
            actionLabel="Clear Filters"
            onAction={() => { setSearch(''); setSelectedStage('All'); }}
          />
        )
      )}
    </div>
  );
};
