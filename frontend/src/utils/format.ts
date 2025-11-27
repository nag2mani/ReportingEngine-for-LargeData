import { format, parseISO } from 'date-fns';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'N/A';
  try {
    return format(parseISO(dateString), 'MMM dd, yyyy');
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string | undefined): string {
  if (!dateString) return 'N/A';
  try {
    return format(parseISO(dateString), 'MMM dd, yyyy HH:mm');
  } catch {
    return dateString;
  }
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    success: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    initiated: 'bg-yellow-100 text-yellow-800',
    reversed: 'bg-gray-100 text-gray-800',
    paid: 'bg-green-100 text-green-800',
    partial: 'bg-blue-100 text-blue-800',
    due: 'bg-orange-100 text-orange-800',
    overdue: 'bg-red-100 text-red-800',
  };
  return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
}

export function getMethodColor(method: string): string {
  const colors: Record<string, string> = {
    upi: 'bg-purple-100 text-purple-800',
    card: 'bg-blue-100 text-blue-800',
    cash: 'bg-green-100 text-green-800',
    netbanking: 'bg-indigo-100 text-indigo-800',
    cheque: 'bg-yellow-100 text-yellow-800',
    wallet: 'bg-pink-100 text-pink-800',
  };
  return colors[method.toLowerCase()] || 'bg-gray-100 text-gray-800';
}
