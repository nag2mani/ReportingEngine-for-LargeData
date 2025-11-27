import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import {
  School,
  Student,
  FeeBill,
  Payment,
  TransactionStatus,
  User,
  Role,
  Permission,
  FieldPermission,
  FeeBillStatus,
  PaymentMethod,
  PaymentStatus,
  Resource,
  Action,
} from '../src/entities';
import databaseConfig from '../src/config/database.config';

interface SeedOptions {
  schools?: number;
  studentsPerSchool?: number;
  minBillsPerStudent?: number;
  maxBillsPerStudent?: number;
}

const defaultOptions: SeedOptions = {
  schools: 20,
  studentsPerSchool: 1000,
  minBillsPerStudent: 1,
  maxBillsPerStudent: 2,
};

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDate(start: Date, end: Date): Date {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
}

async function createRoles(dataSource: DataSource) {
  const roleRepository = dataSource.getRepository(Role);
  const permissionRepository = dataSource.getRepository(Permission);
  const fieldPermissionRepository = dataSource.getRepository(FieldPermission);

  // Create roles
  const platformAdminRole = roleRepository.create({
    name: 'platform_admin',
    description: 'Platform administrator with full access',
  });
  await roleRepository.save(platformAdminRole);

  const schoolAdminRole = roleRepository.create({
    name: 'school_admin',
    description: 'School administrator',
  });
  await roleRepository.save(schoolAdminRole);

  const accountantRole = roleRepository.create({
    name: 'accountant',
    description: 'Accountant with financial access',
  });
  await roleRepository.save(accountantRole);

  const teacherRole = roleRepository.create({
    name: 'teacher',
    description: 'Teacher with read-only access',
  });
  await roleRepository.save(teacherRole);

  const readonlyRole = roleRepository.create({
    name: 'readonly',
    description: 'Read-only access',
  });
  await roleRepository.save(readonlyRole);

  // Create permissions for platform_admin (all resources, all actions)
  for (const resource of Object.values(Resource)) {
    for (const action of Object.values(Action)) {
      await permissionRepository.save({
        role_id: platformAdminRole.id,
        resource,
        action,
      });
    }
  }

  // Create permissions for school_admin
  const schoolAdminResources = [
    Resource.STUDENTS,
    Resource.FEE_BILLS,
    Resource.PAYMENTS,
    Resource.REPORTS,
  ];
  for (const resource of schoolAdminResources) {
    for (const action of Object.values(Action)) {
      await permissionRepository.save({
        role_id: schoolAdminRole.id,
        resource,
        action,
      });
    }
  }

  // Create permissions for accountant
  const accountantResources = [Resource.FEE_BILLS, Resource.PAYMENTS, Resource.REPORTS];
  for (const resource of accountantResources) {
    for (const action of [Action.READ, Action.CREATE, Action.UPDATE]) {
      await permissionRepository.save({
        role_id: accountantRole.id,
        resource,
        action,
      });
    }
  }

  // Create permissions for teacher (read-only)
  const teacherResources = [Resource.STUDENTS, Resource.REPORTS];
  for (const resource of teacherResources) {
    await permissionRepository.save({
      role_id: teacherRole.id,
      resource,
      action: Action.READ,
    });
  }

  // Create permissions for readonly
  for (const resource of Object.values(Resource)) {
    await permissionRepository.save({
      role_id: readonlyRole.id,
      resource,
      action: Action.READ,
    });
  }

  // Create field-level permissions (accountant can't see student email/phone)
  await fieldPermissionRepository.save({
    role_id: accountantRole.id,
    resource: Resource.STUDENTS,
    field_name: 'email',
    allowed_actions: [],
  });

  await fieldPermissionRepository.save({
    role_id: accountantRole.id,
    resource: Resource.STUDENTS,
    field_name: 'phone',
    allowed_actions: [],
  });

  return {
    platformAdminRole,
    schoolAdminRole,
    accountantRole,
    teacherRole,
    readonlyRole,
  };
}

async function createUsers(dataSource: DataSource, roles: any) {
  const userRepository = dataSource.getRepository(User);
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create platform admin
  await userRepository.save({
    email: 'admin@platform.com',
    hashed_password: hashedPassword,
    name: 'Platform Admin',
    role_id: roles.platformAdminRole.id,
    is_active: true,
  });

  console.log('Created platform admin user: admin@platform.com / password123');
}

async function seedSchools(dataSource: DataSource, count: number): Promise<School[]> {
  const schoolRepository = dataSource.getRepository(School);
  const schools: School[] = [];

  const regions = ['North', 'South', 'East', 'West', 'Central'];
  const timezones = ['Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore'];

  for (let i = 1; i <= count; i++) {
    const school = schoolRepository.create({
      name: `School ${i}`,
      region: getRandomElement(regions),
      timezone: getRandomElement(timezones),
    });
    const saved = await schoolRepository.save(school);
    schools.push(saved);

    if (i % 10 === 0) {
      console.log(`Created ${i}/${count} schools`);
    }
  }

  return schools;
}

async function seedStudents(
  dataSource: DataSource,
  schools: School[],
  studentsPerSchool: number,
): Promise<Student[]> {
  const studentRepository = dataSource.getRepository(Student);
  const students: Student[] = [];

  const classes = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const sections = ['A', 'B', 'C', 'D'];

  let globalStudentNumber = 1;

  for (const school of schools) {
    for (let i = 0; i < studentsPerSchool; i++) {
      const student = studentRepository.create({
        school_id: school.id,
        student_number: `STU${school.id.substring(0, 8)}${String(globalStudentNumber).padStart(6, '0')}`,
        first_name: `Student${globalStudentNumber}`,
        last_name: `Last${globalStudentNumber}`,
        class: getRandomElement(classes),
        section: getRandomElement(sections),
        admission_date: getRandomDate(
          new Date(2020, 0, 1),
          new Date(2024, 11, 31),
        ),
        email: `student${globalStudentNumber}@school${school.id.substring(0, 8)}.com`,
        phone: `+91${getRandomInt(7000000000, 9999999999)}`,
        is_active: Math.random() > 0.1, // 90% active
        meta: {
          parent_name: `Parent${globalStudentNumber}`,
          address: `Address ${globalStudentNumber}`,
        },
      });

      const saved = await studentRepository.save(student);
      students.push(saved);
      globalStudentNumber++;

      if (globalStudentNumber % 1000 === 0) {
        console.log(`Created ${globalStudentNumber} students`);
      }
    }
  }

  return students;
}

async function seedFeeBills(
  dataSource: DataSource,
  students: Student[],
  minBills: number,
  maxBills: number,
): Promise<FeeBill[]> {
  const feeBillRepository = dataSource.getRepository(FeeBill);
  const feeBills: FeeBill[] = [];

  const currentYear = new Date().getFullYear();
  const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

  for (const student of students) {
    const billCount = getRandomInt(minBills, maxBills);

    for (let i = 0; i < billCount; i++) {
      const year = currentYear - Math.floor(Math.random() * 2);
      const month = getRandomElement(months);
      const period = `${year}-${month}`;

      const dueDate = new Date(year, parseInt(month, 10) - 1, getRandomInt(1, 28));
      const isOverdue = dueDate < new Date() && Math.random() > 0.3;

      const amountDue = getRandomInt(5000, 50000);

      const status = isOverdue
        ? getRandomElement([FeeBillStatus.DUE, FeeBillStatus.OVERDUE, FeeBillStatus.PARTIAL])
        : getRandomElement([FeeBillStatus.DUE, FeeBillStatus.PAID, FeeBillStatus.PARTIAL]);

      const feeBill = feeBillRepository.create({
        school_id: student.school_id,
        student_id: student.id,
        amount_due: amountDue,
        due_date: dueDate,
        period,
        status,
        meta: {
          tuition: amountDue * 0.6,
          transport: amountDue * 0.2,
          library: amountDue * 0.1,
          sports: amountDue * 0.1,
        },
      });

      const saved = await feeBillRepository.save(feeBill);
      feeBills.push(saved);
    }
  }

  console.log(`Created ${feeBills.length} fee bills`);
  return feeBills;
}

async function seedPayments(
  dataSource: DataSource,
  feeBills: FeeBill[],
): Promise<Payment[]> {
  const paymentRepository = dataSource.getRepository(Payment);
  const transactionStatusRepository = dataSource.getRepository(TransactionStatus);
  const payments: Payment[] = [];

  const methods = Object.values(PaymentMethod);
  const providers = ['Razorpay', 'Stripe', 'PayU', 'Cash', null];

  // Create payments for fee bills
  for (const feeBill of feeBills) {
    if (feeBill.status === FeeBillStatus.PAID || feeBill.status === FeeBillStatus.PARTIAL) {
      const paymentCount = feeBill.status === FeeBillStatus.PAID ? 1 : getRandomInt(1, 3);

      for (let i = 0; i < paymentCount; i++) {
        const method = getRandomElement(methods);
        const amountPaid =
          feeBill.status === FeeBillStatus.PAID
            ? parseFloat(feeBill.amount_due.toString())
            : parseFloat(feeBill.amount_due.toString()) * (0.3 + Math.random() * 0.5);

        const initiatedAt = getRandomDate(
          new Date(feeBill.due_date),
          new Date(),
        );
        const completedAt = new Date(initiatedAt.getTime() + getRandomInt(0, 3600000));

        const payment = paymentRepository.create({
          fee_bill_id: feeBill.id,
          school_id: feeBill.school_id,
          student_id: feeBill.student_id,
          amount_paid: Math.round(amountPaid * 100) / 100,
          method,
          payment_provider: method !== PaymentMethod.CASH ? getRandomElement(providers) : null,
          provider_txn_id:
            method !== PaymentMethod.CASH
              ? `TXN${Date.now()}${getRandomInt(1000, 9999)}`
              : null,
          status: PaymentStatus.SUCCESS,
          initiated_at: initiatedAt,
          completed_at: completedAt,
          metadata: {
            gateway_response: 'Success',
            fees: amountPaid * 0.02,
          },
        });

        const saved = await paymentRepository.save(payment);
        payments.push(saved);

        // Create transaction status
        await transactionStatusRepository.save({
          payment_id: saved.id,
          status: PaymentStatus.INITIATED,
          changed_at: initiatedAt,
          notes: 'Payment initiated',
        });

        await transactionStatusRepository.save({
          payment_id: saved.id,
          status: PaymentStatus.SUCCESS,
          changed_at: completedAt,
          notes: 'Payment completed successfully',
        });
      }
    }
  }

  // Create some standalone payments (not linked to fee bills)
  const students = await dataSource.getRepository(Student).find({ take: 1000 });
  for (let i = 0; i < 500; i++) {
    const student = getRandomElement(students);
    const method = getRandomElement(methods);

    const payment = paymentRepository.create({
      school_id: student.school_id,
      student_id: student.id,
      amount_paid: getRandomInt(1000, 20000),
      method,
      payment_provider: method !== PaymentMethod.CASH ? getRandomElement(providers) : null,
      provider_txn_id:
        method !== PaymentMethod.CASH ? `TXN${Date.now()}${getRandomInt(1000, 9999)}` : null,
      status: getRandomElement([PaymentStatus.SUCCESS, PaymentStatus.FAILED, PaymentStatus.INITIATED]),
      initiated_at: getRandomDate(new Date(2024, 0, 1), new Date()),
      completed_at:
        Math.random() > 0.2
          ? getRandomDate(new Date(2024, 0, 1), new Date())
          : null,
    });

    const saved = await paymentRepository.save(payment);
    payments.push(saved);
  }

  console.log(`Created ${payments.length} payments`);
  return payments;
}

async function createSchoolUsers(
  dataSource: DataSource,
  schools: School[],
  roles: any,
) {
  const userRepository = dataSource.getRepository(User);
  const hashedPassword = await bcrypt.hash('password123', 10);

  for (const school of schools.slice(0, 10)) {
    // Create school admin
    await userRepository.save({
      email: `admin@school${school.id.substring(0, 8)}.com`,
      hashed_password: hashedPassword,
      name: `Admin ${school.name}`,
      school_id: school.id,
      role_id: roles.schoolAdminRole.id,
      is_active: true,
    });

    // Create accountant
    await userRepository.save({
      email: `accountant@school${school.id.substring(0, 8)}.com`,
      hashed_password: hashedPassword,
      name: `Accountant ${school.name}`,
      school_id: school.id,
      role_id: roles.accountantRole.id,
      is_active: true,
    });
  }

  console.log('Created school users (admin@school*.com / accountant@school*.com)');
}

async function seed(options: SeedOptions = {}) {
  const opts = { ...defaultOptions, ...options };
  console.log('Starting seed with options:', opts);

  const dataSource = await databaseConfig.initialize();

  try {
    // Create roles and permissions
    console.log('Creating roles and permissions...');
    const roles = await createRoles(dataSource);

    // Create users
    console.log('Creating users...');
    await createUsers(dataSource, roles);

    // Seed schools
    console.log(`Creating ${opts.schools} schools...`);
    const schools = await seedSchools(dataSource, opts.schools);

    // Create school users
    await createSchoolUsers(dataSource, schools, roles);

    // Seed students
    console.log(
      `Creating ${opts.studentsPerSchool} students per school (${opts.schools * opts.studentsPerSchool} total)...`,
    );
    const students = await seedStudents(dataSource, schools, opts.studentsPerSchool);

    // Seed fee bills
    console.log('Creating fee bills...');
    const feeBills = await seedFeeBills(
      dataSource,
      students,
      opts.minBillsPerStudent,
      opts.maxBillsPerStudent,
    );

    // Seed payments
    console.log('Creating payments...');
    await seedPayments(dataSource, feeBills);

    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Error during seed:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: SeedOptions = {};

for (let i = 0; i < args.length; i += 2) {
  const key = args[i]?.replace('--', '');
  const value = args[i + 1];

  if (key === 'schools') {
    options.schools = parseInt(value, 10);
  } else if (key === 'students') {
    options.studentsPerSchool = parseInt(value, 10);
  } else if (key === 'min-bills') {
    options.minBillsPerStudent = parseInt(value, 10);
  } else if (key === 'max-bills') {
    options.maxBillsPerStudent = parseInt(value, 10);
  } else if (key === 'scale') {
    if (value === 'small') {
      options.schools = 5;
      options.studentsPerSchool = 100;
      options.minBillsPerStudent = 1;
      options.maxBillsPerStudent = 2;
    } else if (value === 'medium') {
      options.schools = 20;
      options.studentsPerSchool = 1000;
      options.minBillsPerStudent = 1;
      options.maxBillsPerStudent = 2;
    } else if (value === 'large') {
      options.schools = 100;
      options.studentsPerSchool = 2000;
      options.minBillsPerStudent = 1;
      options.maxBillsPerStudent = 3;
    }
  }
}

seed(options).catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
