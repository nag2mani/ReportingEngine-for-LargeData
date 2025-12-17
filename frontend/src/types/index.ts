export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  school_id: string | null;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface Payment {
  id: string;
  fee_bill_id?: string;
  school_id: string;
  student_id: string;
  amount_paid: number;
  method: 'cash' | 'card' | 'upi' | 'netbanking' | 'cheque' | 'wallet';
  payment_provider?: string;
  provider_txn_id?: string;
  status: 'initiated' | 'success' | 'failed' | 'reversed';
  initiated_at?: string;
  completed_at?: string;
  metadata?: any;
  created_at: string;
  student?: {
    id: string;
    student_number: string;
    first_name: string;
    last_name: string;
    class?: string;
    section?: string;
  };
  feeBill?: {
    id: string;
    amount_due: number;
    due_date: string;
    period: string;
    status: string;
  };
  transactionStatuses?: Array<{
    id: string;
    status: string;
    changed_at: string;
    notes?: string;
  }>;
}

export interface PaymentListResponse {
  data: Payment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SummaryReport {
  total_due: number;
  total_collected: number;
  outstanding: number;
  collection_rate: number;
  method_breakdown: Array<{
    method: string;
    amount: number;
    count: number;
  }>;
  period: {
    from: string;
    to: string;
  };
}

export interface TimeSeriesData {
  interval: string;
  data: Array<{
    period: string;
    amount: number;
    count: number;
  }>;
  period: {
    from: string;
    to: string;
  };
}

export interface FilterOptions {
  student_id?: string;
  status?: string;
  method?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface PlatformStats {
  total_schools: number;
  total_students: number;
  active_students: number;
  total_fee_bills: number;
  total_payments: number;
  total_revenue: number;
}
