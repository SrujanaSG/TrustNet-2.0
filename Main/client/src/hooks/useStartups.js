import { useEffect, useState } from 'react';
import { listStartups } from '../lib/startupApi';
import { normalizeStartup } from '../lib/adapters/startupAdapter';

// Shared startup-list loader used by StartupsPage and StartupDiscoveryPage so
// the two do not duplicate fetch/normalize/error logic. Fetches the real
// public /startups list and maps every record through the existing
// normalizeStartup adapter (which never fabricates missing fields).
export function useStartups(filter = {}) {
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listStartups(filter);
      const list = Array.isArray(data) ? data : [];
      setStartups(list.map(normalizeStartup).filter(Boolean));
    } catch (err) {
      setError(err.message || 'Failed to load startups from TrustNet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { startups, loading, error, refetch: load };
}
