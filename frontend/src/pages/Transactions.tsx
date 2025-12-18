// Transactions Page - displays paginated list of all payment transactions with filtering and sorting
import { Layout } from '../components/Layout';
import { TransactionsTable } from '../components/TransactionsTable';

export function Transactions() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="mt-2 text-gray-600">
            View and manage all payment transactions
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <TransactionsTable limit={20} showPagination={true} />
        </div>
      </div>
    </Layout>
  );
}
