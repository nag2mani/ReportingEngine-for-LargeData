// Transaction Detail Page - shows comprehensive payment details with permission-based field masking and transaction status history
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { apiService } from '../services/api';
import { Payment } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getStatusColor,
  getMethodColor,
} from '../utils/format';
import { canAccessField, maskField } from '../utils/permissions';
import { ArrowLeft, Loader2, CreditCard, User, Calendar, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export function TransactionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadPayment();
    }
  }, [id]);

  const loadPayment = async () => {
    try {
      setLoading(true);
      const data = await apiService.getPaymentById(id!);
      setPayment(data);
    } catch (error: any) {
      toast.error('Failed to load transaction details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </Layout>
    );
  }

  if (!payment) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Transaction not found</p>
          <button
            onClick={() => navigate('/transactions')}
            className="mt-4 text-primary-600 hover:text-primary-700"
          >
            Back to Transactions
          </button>
        </div>
      </Layout>
    );
  }

  const DetailRow = ({
    label,
    value,
    field,
    mask = false,
  }: {
    label: string;
    value: any;
    field: string;
    mask?: boolean;
  }) => {
    if (!canAccessField(user, field)) {
      return null;
    }

    const displayValue = mask ? maskField(value, field, user) : value;

    return (
      <div className="py-4 border-b border-gray-200 last:border-0">
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900">
          {typeof displayValue === 'object' && displayValue !== null
            ? displayValue
            : displayValue || 'N/A'}
        </dd>
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/transactions')}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transaction Details</h1>
            <p className="mt-1 text-gray-600">Transaction ID: {payment.id}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Information */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary-100 rounded-lg">
                  <CreditCard className="w-6 h-6 text-primary-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Payment Information</h2>
              </div>

              <dl className="space-y-0">
                <DetailRow
                  label="Amount Paid"
                  value={formatCurrency(payment.amount_paid)}
                  field="amount_paid"
                />
                <DetailRow
                  label="Payment Method"
                  value={
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getMethodColor(
                        payment.method
                      )}`}
                    >
                      {payment.method.toUpperCase()}
                    </span>
                  }
                  field="method"
                />
                <DetailRow
                  label="Status"
                  value={
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      payment.status
                    )}`}
                    >
                      {payment.status}
                    </span>
                  }
                  field="status"
                />
                <DetailRow
                  label="Payment Provider"
                  value={payment.payment_provider}
                  field="payment_provider"
                />
                <DetailRow
                  label="Provider Transaction ID"
                  value={payment.provider_txn_id}
                  field="provider_txn_id"
                />
                <DetailRow
                  label="Initiated At"
                  value={formatDateTime(payment.initiated_at)}
                  field="initiated_at"
                />
                <DetailRow
                  label="Completed At"
                  value={formatDateTime(payment.completed_at)}
                  field="completed_at"
                />
              </dl>
            </div>

            {/* Student Information */}
            {canAccessField(user, 'student.first_name') && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <User className="w-6 h-6 text-green-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Student Information</h2>
                </div>

                <dl className="space-y-0">
                  <DetailRow
                    label="Name"
                    value={`${maskField(payment.student?.first_name, 'student.first_name', user)} ${maskField(
                      payment.student?.last_name,
                      'student.last_name',
                      user
                    )}`}
                    field="student.first_name"
                  />
                  <DetailRow
                    label="Student Number"
                    value={payment.student?.student_number}
                    field="student.student_number"
                  />
                  <DetailRow
                    label="Class"
                    value={payment.student?.class}
                    field="student.class"
                  />
                  <DetailRow
                    label="Section"
                    value={payment.student?.section}
                    field="student.section"
                  />
                  <DetailRow
                    label="Email"
                    value={payment.student?.email}
                    field="student.email"
                    mask={true}
                  />
                  <DetailRow
                    label="Phone"
                    value={payment.student?.phone}
                    field="student.phone"
                    mask={true}
                  />
                </dl>
              </div>
            )}

            {/* Fee Bill Information */}
            {payment.feeBill && canAccessField(user, 'feeBill.amount_due') && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Fee Bill Information</h2>
                </div>

                <dl className="space-y-0">
                  <DetailRow
                    label="Amount Due"
                    value={formatCurrency(payment.feeBill.amount_due)}
                    field="feeBill.amount_due"
                  />
                  <DetailRow
                    label="Due Date"
                    value={formatDate(payment.feeBill.due_date)}
                    field="feeBill.due_date"
                  />
                  <DetailRow
                    label="Period"
                    value={payment.feeBill.period}
                    field="feeBill.period"
                  />
                  <DetailRow
                    label="Status"
                    value={
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          payment.feeBill.status
                        )}`}
                      >
                        {payment.feeBill.status}
                      </span>
                    }
                    field="feeBill.status"
                  />
                </dl>
              </div>
            )}

            {/* Transaction Status History */}
            {payment.transactionStatuses && payment.transactionStatuses.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Status History</h2>
                </div>

                <div className="space-y-4">
                  {payment.transactionStatuses.map((status, index) => (
                    <div
                      key={status.id}
                      className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">
                            {status.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDateTime(status.changed_at)}
                          </span>
                        </div>
                        {status.notes && (
                          <p className="mt-1 text-sm text-gray-600">{status.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Summary</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Transaction Status</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900 capitalize">
                    {payment.status}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="mt-1 text-2xl font-bold text-primary-600">
                    {formatCurrency(payment.amount_paid)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900 capitalize">
                    {payment.method}
                  </p>
                </div>
              </div>
            </div>

            {/* Metadata */}
            {payment.metadata && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Info</h3>
                <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-auto">
                  {JSON.stringify(payment.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
