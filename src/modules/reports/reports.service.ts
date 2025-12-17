import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { FeeBill, FeeBillStatus } from '../../entities/fee-bill.entity';
import { Payment, PaymentStatus, PaymentMethod } from '../../entities/payment.entity';
import { Student } from '../../entities/student.entity';
import { School } from '../../entities/school.entity';
import { ReportFilterDto, TimeSeriesFilterDto } from './dto/report-filter.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(FeeBill)
    private feeBillRepository: Repository<FeeBill>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(School)
    private schoolRepository: Repository<School>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getSummary(filter: ReportFilterDto, userSchoolId?: string) {
    const cacheKey = `summary:${JSON.stringify(filter)}:${userSchoolId || 'all'}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const schoolId = userSchoolId || filter.school_id;
    const fromDate = filter.from ? new Date(filter.from) : new Date();
    const toDate = filter.to ? new Date(filter.to) : new Date();

    if (!filter.from) {
      fromDate.setMonth(fromDate.getMonth() - (filter.period_months || 1));
    }

    // Build query conditions
    const feeBillConditions: any = {};
    const paymentConditions: any = {};

    if (schoolId) {
      feeBillConditions.school_id = schoolId;
      paymentConditions.school_id = schoolId;
    }

    if (filter.student_id) {
      feeBillConditions.student_id = filter.student_id;
      paymentConditions.student_id = filter.student_id;
    }

    // Calculate total due
    const totalDueQuery = this.feeBillRepository
      .createQueryBuilder('fb')
      .select('COALESCE(SUM(fb.amount_due), 0)', 'total_due')
      .where('fb.status != :paidStatus', { paidStatus: FeeBillStatus.PAID });

    if (schoolId) {
      totalDueQuery.andWhere('fb.school_id = :schoolId', { schoolId });
    }
    if (filter.student_id) {
      totalDueQuery.andWhere('fb.student_id = :studentId', {
        studentId: filter.student_id,
      });
    }

    const totalDueResult = await totalDueQuery.getRawOne();
    const totalDue = parseFloat(totalDueResult?.total_due || '0');

    // Calculate total collected
    const totalCollectedQuery = this.paymentRepository
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount_paid), 0)', 'total_collected')
      .where('p.status = :status', { status: PaymentStatus.SUCCESS })
      .andWhere('p.completed_at BETWEEN :from AND :to', {
        from: fromDate,
        to: toDate,
      });

    if (schoolId) {
      totalCollectedQuery.andWhere('p.school_id = :schoolId', { schoolId });
    }
    if (filter.student_id) {
      totalCollectedQuery.andWhere('p.student_id = :studentId', {
        studentId: filter.student_id,
      });
    }
    if (filter.method) {
      totalCollectedQuery.andWhere('p.method = :method', { method: filter.method });
    }

    const totalCollectedResult = await totalCollectedQuery.getRawOne();
    const totalCollected = parseFloat(totalCollectedResult?.total_collected || '0');

    // Calculate outstanding
    const outstanding = totalDue - totalCollected;

    // Get breakdown by payment method
    const methodBreakdown = await this.getMethodBreakdown(
      fromDate,
      toDate,
      schoolId,
      filter.student_id,
    );

    const result = {
      total_due: totalDue,
      total_collected: totalCollected,
      outstanding: outstanding,
      collection_rate: totalDue > 0 ? (totalCollected / totalDue) * 100 : 0,
      method_breakdown: methodBreakdown,
      period: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      },
    };

    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, result, 300000);
    return result;
  }

  async getTimeSeries(filter: TimeSeriesFilterDto, userSchoolId?: string) {
    const cacheKey = `timeseries:${JSON.stringify(filter)}:${userSchoolId || 'all'}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const schoolId = userSchoolId || filter.school_id;
    const fromDate = filter.from ? new Date(filter.from) : new Date();
    const toDate = filter.to ? new Date(filter.to) : new Date();

    if (!filter.from) {
      fromDate.setMonth(fromDate.getMonth() - (filter.period_months || 1));
    }

    const interval = filter.interval || 'day';
    let dateFormat: string;
    let dateTrunc: string;

    switch (interval) {
      case 'day':
        dateFormat = 'YYYY-MM-DD';
        dateTrunc = 'day';
        break;
      case 'week':
        dateFormat = 'YYYY-"W"WW';
        dateTrunc = 'week';
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        dateTrunc = 'month';
        break;
      default:
        dateFormat = 'YYYY-MM-DD';
        dateTrunc = 'day';
    }

    const query = this.paymentRepository
      .createQueryBuilder('p')
      .select(`DATE_TRUNC('${dateTrunc}', p.completed_at)`, 'period')
      .addSelect('COALESCE(SUM(p.amount_paid), 0)', 'amount')
      .addSelect('COUNT(p.id)', 'count')
      .where('p.status = :status', { status: PaymentStatus.SUCCESS })
      .andWhere('p.completed_at BETWEEN :from AND :to', {
        from: fromDate,
        to: toDate,
      })
      .groupBy('period')
      .orderBy('period', 'ASC');

    if (schoolId) {
      query.andWhere('p.school_id = :schoolId', { schoolId });
    }
    if (filter.student_id) {
      query.andWhere('p.student_id = :studentId', { studentId: filter.student_id });
    }
    if (filter.method) {
      query.andWhere('p.method = :method', { method: filter.method });
    }

    const results = await query.getRawMany();

    const data = results.map((row) => ({
      period: new Date(row.period).toISOString().split('T')[0],
      amount: parseFloat(row.amount),
      count: parseInt(row.count, 10),
    }));

    const result = {
      interval,
      data,
      period: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      },
    };

    // Cache for 2 minutes
    await this.cacheManager.set(cacheKey, result, 120000);
    return result;
  }

  async getStudentReport(studentId: string, userSchoolId?: string) {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
      relations: ['school'],
    });

    if (!student) {
      throw new Error('Student not found');
    }

    if (userSchoolId && student.school_id !== userSchoolId) {
      throw new Error('Access denied');
    }

    const feeBills = await this.feeBillRepository.find({
      where: { student_id: studentId },
      order: { due_date: 'DESC' },
    });

    const payments = await this.paymentRepository.find({
      where: { student_id: studentId },
      relations: ['feeBill'],
      order: { completed_at: 'DESC' },
    });

    const totalDue = feeBills.reduce((sum, bill) => sum + parseFloat(bill.amount_due.toString()), 0);
    const totalPaid = payments
      .filter((p) => p.status === PaymentStatus.SUCCESS)
      .reduce((sum, p) => sum + parseFloat(p.amount_paid.toString()), 0);

    return {
      student: {
        id: student.id,
        student_number: student.student_number,
        name: `${student.first_name} ${student.last_name}`,
        class: student.class,
        section: student.section,
      },
      summary: {
        total_due: totalDue,
        total_paid: totalPaid,
        outstanding: totalDue - totalPaid,
      },
      fee_bills: feeBills,
      payments: payments,
    };
  }

  async getTopSchools(limit: number = 10, periodMonths: number = 1) {
    const fromDate = new Date();
    fromDate.setMonth(fromDate.getMonth() - periodMonths);

    const query = this.schoolRepository
      .createQueryBuilder('s')
      .leftJoin('payments', 'p', 'p.school_id = s.id')
      .select('s.id', 'school_id')
      .addSelect('s.name', 'school_name')
      .addSelect('COALESCE(SUM(p.amount_paid), 0)', 'total_collected')
      .addSelect('COUNT(DISTINCT p.student_id)', 'students_count')
      .where('p.status = :status', { status: PaymentStatus.SUCCESS })
      .andWhere('p.completed_at >= :from', { from: fromDate })
      .groupBy('s.id, s.name')
      .orderBy('total_collected', 'DESC')
      .limit(limit);

    const results = await query.getRawMany();

    return results.map((row) => ({
      school_id: row.school_id,
      school_name: row.school_name,
      total_collected: parseFloat(row.total_collected),
      students_count: parseInt(row.students_count, 10),
    }));
  }

  async getPlatformStats() {
    const cacheKey = 'platform:stats';
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Count total schools
    const totalSchools = await this.schoolRepository.count();

    // Count total students
    const totalStudents = await this.studentRepository.count();

    // Count active students
    const activeStudents = await this.studentRepository.count({
      where: { is_active: true },
    });

    // Count total fee bills
    const totalFeeBills = await this.feeBillRepository.count();

    // Count total payments
    const totalPayments = await this.paymentRepository.count();

    // Calculate total revenue (sum of successful payments)
    const revenueResult = await this.paymentRepository
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount_paid), 0)', 'total_revenue')
      .where('p.status = :status', { status: PaymentStatus.SUCCESS })
      .getRawOne();
    const totalRevenue = parseFloat(revenueResult?.total_revenue || '0');

    const result = {
      total_schools: totalSchools,
      total_students: totalStudents,
      active_students: activeStudents,
      total_fee_bills: totalFeeBills,
      total_payments: totalPayments,
      total_revenue: totalRevenue,
    };

    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, result, 300000);
    return result;
  }

  private async getMethodBreakdown(
    fromDate: Date,
    toDate: Date,
    schoolId?: string,
    studentId?: string,
  ) {
    const query = this.paymentRepository
      .createQueryBuilder('p')
      .select('p.method', 'method')
      .addSelect('COALESCE(SUM(p.amount_paid), 0)', 'amount')
      .addSelect('COUNT(p.id)', 'count')
      .where('p.status = :status', { status: PaymentStatus.SUCCESS })
      .andWhere('p.completed_at BETWEEN :from AND :to', {
        from: fromDate,
        to: toDate,
      })
      .groupBy('p.method');

    if (schoolId) {
      query.andWhere('p.school_id = :schoolId', { schoolId });
    }
    if (studentId) {
      query.andWhere('p.student_id = :studentId', { studentId });
    }

    const results = await query.getRawMany();

    return results.map((row) => ({
      method: row.method,
      amount: parseFloat(row.amount),
      count: parseInt(row.count, 10),
    }));
  }
}
