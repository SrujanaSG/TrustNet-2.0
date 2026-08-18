import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Search, MapPin, Loader2, AlertCircle, Building2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/common/EmptyState';
import { listJobs } from '../../lib/jobApi';

const EMPLOYMENT_TYPES = ['All', 'full-time', 'part-time', 'contract', 'internship'];

const formatSalary = (job) => {
  const { salaryMin, salaryMax, currency } = job;
  if (!salaryMin && !salaryMax) return null;
  const cur = currency || 'USD';
  const fmt = (n) => (typeof n === 'number' ? n.toLocaleString() : n);
  if (salaryMin && salaryMax) return `${cur} ${fmt(salaryMin)} – ${fmt(salaryMax)}`;
  return `${cur} ${fmt(salaryMin || salaryMax)}+`;
};

export const OpportunitiesPage = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('All');

  const fetchJobs = async () => {
    setLoading(true);
    setError('');
    try {
      // Public opportunity board: only published roles.
      const data = await listJobs({ status: 'published' });
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load opportunities from TrustNet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter((j) => {
      const matchesType = type === 'All' || j.employmentType === type;
      const matchesSearch =
        !q ||
        (j.title || '').toLowerCase().includes(q) ||
        (j.department || '').toLowerCase().includes(q) ||
        (j.description || '').toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });
  }, [jobs, search, type]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Opportunity Marketplace</h1>
          <p className="text-xs text-slate-500 mt-1">Discover open roles posted by startups across the TrustNet ecosystem</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-soft-sm">
        <div className="flex-1 w-full">
          <Input icon={Search} placeholder="Search roles, departments, skills..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {EMPLOYMENT_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all capitalize ${
                type === t ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-24 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="ml-2 text-sm">Loading opportunities…</span>
        </div>
      )}

      {!loading && error && (
        <Card className="p-4 border border-red-200 bg-red-50/60 flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 text-sm">{error}</div>
          <Button variant="outline" size="sm" onClick={fetchJobs}>Retry</Button>
        </Card>
      )}

      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          icon={Briefcase}
          title="No Open Roles"
          description="There are no published opportunities matching your filters right now."
        />
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((job) => {
            const salary = formatSalary(job);
            return (
              <Card key={job._id} hoverEffect className="p-5 border-slate-200 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-bold text-slate-900">{job.title}</h3>
                    {job.employmentType && <Badge variant="emerald">{job.employmentType}</Badge>}
                  </div>
                  {job.department && <p className="text-xs text-slate-500 mt-0.5">{job.department}</p>}

                  <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-500">
                    {(job.location || job.remotePolicy) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {[job.location, job.remotePolicy].filter(Boolean).join(' • ')}
                      </span>
                    )}
                    {salary && <span className="font-semibold text-slate-700">{salary}</span>}
                  </div>

                  {job.description && (
                    <p className="text-xs text-slate-500 line-clamp-3 mt-3 leading-relaxed">{job.description}</p>
                  )}

                  {Array.isArray(job.requirements) && job.requirements.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {job.requirements.slice(0, 4).map((r, i) => (
                        <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{r}</span>
                      ))}
                    </div>
                  )}
                </div>

                {job.startup && (
                  <div className="pt-4 mt-3 border-t border-slate-100 flex justify-end">
                    <Button size="sm" variant="outline" onClick={() => navigate(`/app/startups/${job.startup}`)}>
                      <Building2 className="w-3.5 h-3.5 mr-1" /> View Startup
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
