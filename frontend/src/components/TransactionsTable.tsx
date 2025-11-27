import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { Payment, PaymentListResponse, FilterOptions } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getStatusColor,
  getMethodColor,
} from '../utils/format';
import { canAccessField, maskField } from '../utils/permissions';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface TransactionsTableProps {
  limit?: number;
  showPagination?: boolean;
  filters?: FilterOptions;
}

type SortField = 'amount_paid' | 'completed_at' | 'method' | 'status';
type SortDirection = 'asc' | 'desc';

export function TransactionsTable({
  limit = 20,
  showPagination = true,
  filters: initialFilters = {},
}: TransactionsTableProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortField, setSortField] = useState<SortField>('completed_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<string>('');

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortField, sortDirection, statusFilter, methodFilter]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const filters: FilterOptions = {
        ...initialFilters,
        page,
        limit,
        status: statusFilter || undefined,
        method: methodFilter || undefined,
      };

      const response: PaymentListResponse = await apiService.getPayments(filters);
      setPayments(response.data);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (error: any) {
      // Only show error if it's not a 401 (handled by interceptor) or network error
      if (error.response?.status !== 401 && error.code !== 'ERR_NETWORK') {
        toast.error('Failed to load transactions');
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleRowClick = (payment: Payment) => {
    navigate(`/transactions/${payment.id}`);
  };

  const filteredPayments = payments.filter((payment) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      payment.student?.first_name?.toLowerCase().includes(search) ||
      payment.student?.last_name?.toLowerCase().includes(search) ||
      payment.student?.student_number?.toLowerCase().includes(search) ||
      payment.provider_txn_id?.toLowerCase().includes(search)
    );
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ChevronUp className="w-4 h-4 text-gray-400 opacity-0" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-primary-600" />
    ) : (
      <ChevronDown className="w-4 h-4 text-primary-600" />
    );
  };

  const renderCell = (payment: Payment, field: string) => {
    if (!canAccessField(user, field)) {
      return <span className="text-gray-400">***</span>;
    }

    switch (field) {
      case 'student':
        const firstName = maskField(payment.student?.first_name, 'student.first_name', user);
        const lastName = maskField(payment.student?.last_name, 'student.last_name', user);
        return (
          <div>
            <div className="font-medium text-gray-900">
              {firstName} {lastName}
            </div>
            {canAccessField(user, 'student.student_number') && (
              <div className="text-sm text-gray-500">{payment.student?.student_number}</div>
            )}
          </div>
        );
      case 'amount_paid':
        return <span className="font-semibold">{formatCurrency(payment.amount_paid)}</span>;
      case 'method':
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMethodColor(
              payment.method
            )}`}
          >
            {payment.method.toUpperCase()}
          </span>
        );
      case 'status':
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
              payment.status
            )}`}
          >
            {payment.status}
          </span>
        );
      case 'completed_at':
        return <span className="text-gray-600">{formatDateTime(payment.completed_at)}</span>;
      case 'provider_txn_id':
        return canAccessField(user, 'provider_txn_id') ? (
          <span className="text-sm text-gray-600 font-mono">{payment.provider_txn_id || 'N/A'}</span>
        ) : (
          <span className="text-gray-400">***</span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by student name or transaction ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
        >
          <option value="">All Status</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="initiated">Initiated</option>
          <option value="reversed">Reversed</option>
        </select>
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
        >
          <option value="">All Methods</option>
          <option value="upi">UPI</option>
          <option value="card">Card</option>
          <option value="cash">Cash</option>
          <option value="netbanking">Net Banking</option>
          <option value="cheque">Cheque</option>
          <option value="wallet">Wallet</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('completed_at')}
              >
                <div className="flex items-center gap-1">
                  Date
                  <SortIcon field="completed_at" />
                </div>
              </th>
              {canAccessField(user, 'student.first_name') && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
              )}
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('amount_paid')}
              >
                <div className="flex items-center gap-1">
                  Amount
                  <SortIcon field="amount_paid" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('method')}
              >
                <div className="flex items-center gap-1">
                  Method
                  <SortIcon field="method" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">
                  Status
                  <SortIcon field="status" />
                </div>
              </th>
              {canAccessField(user, 'provider_txn_id') && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction ID
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                </td>
              </tr>
            ) : filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No transactions found
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment) => (
                <tr
                  key={payment.id}
                  onClick={() => handleRowClick(payment)}
                  className="hover:bg-gray-50 cursor-pointer transition"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderCell(payment, 'completed_at')}
                  </td>
                  {canAccessField(user, 'student.first_name') && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderCell(payment, 'student')}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderCell(payment, 'amount_paid')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderCell(payment, 'method')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderCell(payment, 'status')}
                  </td>
                  {canAccessField(user, 'provider_txn_id') && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderCell(payment, 'provider_txn_id')}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
            <span className="font-medium">{Math.min(page * limit, total)}</span> of{' '}
            <span className="font-medium">{total}</span> results
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
