import React, { useEffect, useState } from 'react';
import { BarChart3, BriefcaseBusiness, CheckSquare, Users, Flag, Briefcase, PiggyBank, Store } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { getMyStartups } from '../../lib/startupApi';
import {
  getAnalyticsOverview,
  getAnalyticsProjects,
  getAnalyticsTasks,
  getAnalyticsHiring,
  getAnalyticsFunding,
  getAnalyticsMarketplace,
} from '../../lib/analyticsApi';

const Stat = ({ label, value, Icon }) => (
  <Card className="p-5">
    <Icon className="h-5 w-5 text-trust-verified" />
    <p className="mt-4 font-mono text-2xl text-trust-ink">{value ?? 0}</p>
    <p className="mt-1 text-sm text-trust-slate">{label}</p>
  </Card>
);

const Section = ({ title, children }) => (
  <section className="space-y-3">
    <h2 className="font-display text-lg text-trust-ink">{title}</h2>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
  </section>
);

export const AnalyticsPage = () => {
  const [startups, setStartups] = useState([]);
  const [startupId, setStartupId] = useState('');
  const [d, setD] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const entries = await getMyStartups();
        const list = Array.isArray(entries) ? entries : [];
        setStartups(list);
        setStartupId(list[0]?._id || list[0]?.id || '');
      } catch (err) {
        setError(err.message || 'Unable to load your startups.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!startupId) return;
    (async () => {
      setLoading(true);
      setError('');
      // allSettled so a single failing domain doesn't blank the whole page.
      const [overview, projects, tasks, hiring, funding, marketplace] = await Promise.allSettled([
        getAnalyticsOverview(startupId),
        getAnalyticsProjects(startupId),
        getAnalyticsTasks(startupId),
        getAnalyticsHiring(startupId),
        getAnalyticsFunding(startupId),
        getAnalyticsMarketplace(startupId),
      ]);
      const val = (r) => (r.status === 'fulfilled' ? r.value : null);
      setD({
        overview: val(overview),
        projects: val(projects),
        tasks: val(tasks),
        hiring: val(hiring),
        funding: val(funding),
        marketplace: val(marketplace),
      });
      if (overview.status === 'rejected') {
        setError(overview.reason?.message || 'Unable to load analytics.');
      }
      setLoading(false);
    })();
  }, [startupId]);

  if (loading && !startups.length) return <p className="text-sm text-trust-slate">Loading analytics…</p>;
  if (error && !startups.length) return <EmptyState icon={BarChart3} title="Analytics unavailable" description={error} />;
  if (!startups.length) return <EmptyState icon={BarChart3} title="No startup analytics yet" description="Create or join a startup to view its real analytics." />;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl text-trust-ink">Analytics</h1>
        <p className="mt-1 text-sm text-trust-slate">Live operational data for your selected startup.</p>
      </header>

      <label className="block max-w-md text-sm font-semibold text-trust-ink">
        Startup
        <select
          className="mt-2 h-11 w-full rounded border border-trust-slate/30 bg-white px-3 text-sm focus-ring"
          value={startupId}
          onChange={(event) => setStartupId(event.target.value)}
        >
          {startups.map((startup) => (
            <option key={startup._id || startup.id} value={startup._id || startup.id}>{startup.name}</option>
          ))}
        </select>
      </label>

      {loading ? (
        <p className="text-sm text-trust-slate">Loading analytics…</p>
      ) : error ? (
        <EmptyState icon={BarChart3} title="Analytics unavailable" description={error} />
      ) : (
        <div className="space-y-8">
          <Section title="Overview">
            <Stat label="Team members" value={d.overview?.startup?.teamSize} Icon={Users} />
            <Stat label="Projects" value={d.projects?.totalProjects ?? d.overview?.projects?.totalProjects} Icon={BriefcaseBusiness} />
            <Stat label="Tasks" value={d.tasks?.totalTasks ?? d.overview?.tasks?.totalTasks} Icon={CheckSquare} />
            <Stat label="Task completion" value={`${d.tasks?.completionRate ?? d.overview?.tasks?.completionRate ?? 0}%`} Icon={BarChart3} />
          </Section>

          <Section title="Projects & Milestones">
            <Stat label="Total projects" value={d.projects?.totalProjects} Icon={BriefcaseBusiness} />
            <Stat label="Total milestones" value={d.projects?.totalMilestones} Icon={Flag} />
          </Section>

          <Section title="Hiring">
            <Stat label="Jobs posted" value={d.hiring?.totalJobs} Icon={Briefcase} />
          </Section>

          <Section title="Funding">
            <Stat label="Funding rounds" value={d.funding?.totalRounds} Icon={PiggyBank} />
            <Stat label="Contributions" value={d.funding?.totalContributions} Icon={PiggyBank} />
          </Section>

          <Section title="Marketplace">
            <Stat label="Engagement requests" value={d.marketplace?.totalRequests} Icon={Store} />
          </Section>
        </div>
      )}
    </div>
  );
};
