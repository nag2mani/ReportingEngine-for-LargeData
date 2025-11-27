import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { apiService } from '../services/api';
import { SummaryReport } from '../types';
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { TransactionsTable } from '../components/TransactionsTable';
import toast from 'react-hot-toast';

export function Dashboard() {
  const [summary, setSummary] = useState<SummaryReport | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const data = await apiService.getSummaryReport({ period_months: 1 });
      setSummary(data);
    } catch (error: any) {
      // Only show error if it's not a 401 (handled by interceptor) or network error
      if (error.response?.status !== 401 && error.code !== 'ERR_NETWORK') {
        toast.error('Failed to load dashboard data');
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const metrics = [
    {
      title: 'Total Due',
      value: summary?.total_due || 0,
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: null,
    },
    {
      title: 'Total Collected',
      value: summary?.total_collected || 0,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: summary?.collection_rate || 0,
    },
    {
      title: 'Outstanding',
      value: summary?.outstanding || 0,
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      change: null,
    },
    {
      title: 'Collection Rate',
      value: summary?.collection_rate || 0,
      icon: CreditCard,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      suffix: '%',
      change: null,
    },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Overview of fees collection and payment analytics
          </p>
        </div>

        {/* Metrics Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-sm p-6 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-32"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    {metric.change !== null && (
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
                      : formatCurrency(metric.value)}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Payment Methods Breakdown */}
        {summary && summary.method_breakdown.length > 0 && (
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

        {/* Recent Transactions */}
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
      </div>
    </Layout>
  );
}
