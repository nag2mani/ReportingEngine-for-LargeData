import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { apiService } from '../services/api';
import { SummaryReport, PlatformStats } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  CreditCard,
  ArrowUpRight,
  School,
  Users,
  FileText,
  Receipt,
} from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { TransactionsTable } from '../components/TransactionsTable';
import toast from 'react-hot-toast';

export function Dashboard() {
  const [summary, setSummary] = useState<SummaryReport | null>(null);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const isPlatformAdmin = user?.role === 'platform_admin' || user?.school_id === null;

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getSummaryReport({ period_months: 1 });
      setSummary(data);
    } catch (error: any) {
      console.error('Error loading summary:', error);
      // Only show error if it's not a 401 (handled by interceptor) or network error
      if (error.response?.status !== 401 && error.code !== 'ERR_NETWORK') {
        const errorMessage = error.response?.data?.message || 'Failed to load dashboard data';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadPlatformStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getPlatformStats();
      setPlatformStats(data);
    } catch (error: any) {
      console.error('Error loading platform stats:', error);
      // Only show error if it's not a 401 (handled by interceptor) or network error
      if (error.response?.status !== 401 && error.code !== 'ERR_NETWORK') {
        const errorMessage = error.response?.data?.message || 'Failed to load platform statistics';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !user) {
      // Wait for user to load
      return;
    }
    
    if (isPlatformAdmin) {
      loadPlatformStats();
    } else {
      loadSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isPlatformAdmin, authLoading]);

  const regularMetrics = [
    {
      title: 'Total Due',
      value: summary?.total_due || 0,
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: null as number | null,
      suffix: undefined as string | undefined,
      format: undefined as string | undefined,
    },
    {
      title: 'Total Collected',
      value: summary?.total_collected || 0,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: summary?.collection_rate || 0,
      suffix: undefined as string | undefined,
      format: undefined as string | undefined,
    },
    {
      title: 'Outstanding',
      value: summary?.outstanding || 0,
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      change: null as number | null,
      suffix: undefined as string | undefined,
      format: undefined as string | undefined,
    },
    {
      title: 'Collection Rate',
      value: summary?.collection_rate || 0,
      icon: CreditCard,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      suffix: '%',
      change: null as number | null,
      format: undefined as string | undefined,
    },
  ];

  const platformMetrics = [
    {
      title: 'Total Schools',
      value: platformStats?.total_schools || 0,
      icon: School,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: null as number | null,
      suffix: undefined as string | undefined,
      format: undefined as string | undefined,
    },
    {
      title: 'Total Students',
      value: platformStats?.total_students || 0,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: null as number | null,
      suffix: undefined as string | undefined,
      format: undefined as string | undefined,
    },
    {
      title: 'Active Students',
      value: platformStats?.active_students || 0,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: null as number | null,
      suffix: undefined as string | undefined,
      format: undefined as string | undefined,
    },
    {
      title: 'Total Revenue',
      value: platformStats?.total_revenue || 0,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: null as number | null,
      suffix: undefined as string | undefined,
      format: 'currency' as string | undefined,
    },
    {
      title: 'Total Fee Bills',
      value: platformStats?.total_fee_bills || 0,
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      change: null as number | null,
      suffix: undefined as string | undefined,
      format: undefined as string | undefined,
    },
    {
      title: 'Total Payments',
      value: platformStats?.total_payments || 0,
      icon: Receipt,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      change: null as number | null,
      suffix: undefined as string | undefined,
      format: undefined as string | undefined,
    },
  ];

  const metrics = isPlatformAdmin ? platformMetrics : regularMetrics;

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            {isPlatformAdmin
              ? 'Platform-wide overview of all schools and students'
              : 'Overview of fees collection and payment analytics'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Metrics Grid */}
        {loading ? (
          <div className={`grid grid-cols-1 md:grid-cols-2 ${isPlatformAdmin ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-6`}>
            {Array.from({ length: isPlatformAdmin ? 6 : 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-sm p-6 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-32"></div>
              </div>
            ))}
          </div>
        ) : metrics.length > 0 ? (
          <div className={`grid grid-cols-1 md:grid-cols-2 ${isPlatformAdmin ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-6`}>
            {metrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                      <Icon className={`w-6 h-6 ${metric.color}`} />
                    </div>
                    {metric.change !== null && metric.change !== undefined && (
                      <div className="flex items-center text-sm text-green-600">
                        <ArrowUpRight className="w-4 h-4 mr-1" />
                        <span>{metric.change.toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">
                    {metric.title}
                  </h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {metric.suffix
                      ? `${metric.value.toFixed(1)}${metric.suffix}`
                      : metric.format === 'currency'
                      ? formatCurrency(metric.value)
                      : typeof metric.value === 'number'
                      ? metric.value.toLocaleString()
                      : '0'}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-gray-500">No data available</p>
          </div>
        )}

        {/* Payment Methods Breakdown - Only for non-platform admins */}
        {!isPlatformAdmin && summary && summary.method_breakdown.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Payment Methods Breakdown
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {summary.method_breakdown.map((method, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {method.method}
                    </span>
                    <span className="text-xs text-gray-500">{method.count} transactions</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(method.amount)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Transactions - Only for non-platform admins */}
        {!isPlatformAdmin && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
                <button
                  onClick={() => navigate('/transactions')}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View All
                </button>
              </div>
            </div>
            <div className="p-6">
              <TransactionsTable limit={10} showPagination={false} />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
