// Permission Utilities - frontend field-level access control mirroring backend permissions (masks sensitive data like email/phone for accountants)
import { User } from '../types';

/**
 * Determine which fields a user can see based on their role
 * This mirrors the backend field-level permissions
 */
export function getAccessibleFields(user: User | null): string[] {
  if (!user) return [];

  const role = user.role.toLowerCase();

  // Platform admin and school admin can see all fields
  if (role === 'platform_admin' || role === 'school_admin') {
    return [
      'id',
      'amount_paid',
      'method',
      'payment_provider',
      'provider_txn_id',
      'status',
      'initiated_at',
      'completed_at',
      'student.first_name',
      'student.last_name',
      'student.student_number',
      'student.class',
      'student.section',
      'student.email',
      'student.phone',
      'feeBill.amount_due',
      'feeBill.due_date',
      'feeBill.period',
    ];
  }

  // Accountant can see financial fields but not student PII
  if (role === 'accountant') {
    return [
      'id',
      'amount_paid',
      'method',
      'payment_provider',
      'provider_txn_id',
      'status',
      'initiated_at',
      'completed_at',
      'student.first_name',
      'student.last_name',
      'student.student_number',
      'student.class',
      'student.section',
      'feeBill.amount_due',
      'feeBill.due_date',
      'feeBill.period',
      // Note: email and phone are masked
    ];
  }

  // Teacher and readonly can see limited fields
  if (role === 'teacher' || role === 'readonly') {
    return [
      'id',
      'amount_paid',
      'method',
      'status',
      'completed_at',
      'student.first_name',
      'student.last_name',
      'student.student_number',
      'student.class',
      'student.section',
    ];
  }

  return [];
}

/**
 * Check if a field is accessible to the user
 */
export function canAccessField(user: User | null, field: string): boolean {
  const accessibleFields = getAccessibleFields(user);
  return accessibleFields.includes(field) || accessibleFields.some((f) => field.startsWith(f));
}

/**
 * Mask sensitive data based on user role
 */
export function maskField(value: any, field: string, user: User | null): any {
  if (!user) return '***MASKED***';

  const role = user.role.toLowerCase();

  // Accountant cannot see student email/phone
  if (role === 'accountant' && (field.includes('email') || field.includes('phone'))) {
    return '***MASKED***';
  }

  return value;
}
