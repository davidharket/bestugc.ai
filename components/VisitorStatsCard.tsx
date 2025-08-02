import { useState, useEffect } from 'react';

interface VisitorStats {
  timeframe: string;
  summary: {
    totalVisits: number;
    uniqueVisitors: number;
    averageVisitsPerVisitor: number;
  };
  topPages: { page: string; visits: number }[];
  visitsByCountry: { country: string; visits: number }[];
  topReferrers: { referrer: string; visits: number }[];
  dailyVisits: { date: string; visits: number; unique_visitors: number }[];
}

export function VisitorStatsCard() {
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('7d');

  useEffect(() => {
    fetchStats();
  }, [timeframe]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/visitor-stats?timeframe=${timeframe}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-700 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <p className="text-gray-400">Unable to load visitor statistics</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Visitor Statistics</h3>
        <select 
          value={timeframe} 
          onChange={(e) => setTimeframe(e.target.value)}
          className="bg-gray-800 text-white rounded px-3 py-1 text-sm border border-gray-700"
        >
          <option value="1d">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-400">{stats.summary.totalVisits}</div>
          <div className="text-sm text-gray-400">Total Visits</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-400">{stats.summary.uniqueVisitors}</div>
          <div className="text-sm text-gray-400">Unique Visitors</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-400">
            {stats.summary.averageVisitsPerVisitor.toFixed(1)}
          </div>
          <div className="text-sm text-gray-400">Avg Visits/Visitor</div>
        </div>
      </div>

      {/* Top Pages */}
      {stats.topPages.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-medium text-white mb-3">Top Pages</h4>
          <div className="space-y-2">
            {stats.topPages.slice(0, 5).map((page, index) => (
              <div key={index} className="flex justify-between items-center bg-gray-800 rounded px-3 py-2">
                <span className="text-gray-300 text-sm">{page.page}</span>
                <span className="text-orange-400 font-medium">{page.visits}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Countries */}
      {stats.visitsByCountry.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-medium text-white mb-3">Top Countries</h4>
          <div className="space-y-2">
            {stats.visitsByCountry.slice(0, 5).map((country, index) => (
              <div key={index} className="flex justify-between items-center bg-gray-800 rounded px-3 py-2">
                <span className="text-gray-300 text-sm">{country.country || 'Unknown'}</span>
                <span className="text-blue-400 font-medium">{country.visits}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Referrers */}
      {stats.topReferrers.length > 0 && (
        <div>
          <h4 className="text-lg font-medium text-white mb-3">Top Referrers</h4>
          <div className="space-y-2">
            {stats.topReferrers.slice(0, 3).map((referrer, index) => (
              <div key={index} className="flex justify-between items-center bg-gray-800 rounded px-3 py-2">
                <span className="text-gray-300 text-sm truncate mr-2">
                  {new URL(referrer.referrer).hostname}
                </span>
                <span className="text-green-400 font-medium">{referrer.visits}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}