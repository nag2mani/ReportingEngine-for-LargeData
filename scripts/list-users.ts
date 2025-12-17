import { DataSource, Not, IsNull } from 'typeorm';
import { User, School, Role } from '../src/entities';
import databaseConfig from '../src/config/database.config';

async function listUsers() {
  const dataSource = await databaseConfig.initialize();

  try {
    const userRepository = dataSource.getRepository(User);
    const schoolRepository = dataSource.getRepository(School);
    const roleRepository = dataSource.getRepository(Role);

    // Get all roles
    const roles = await roleRepository.find();
    const roleMap = new Map(roles.map(r => [r.id, r.name]));

    // Get all schools
    const schools = await schoolRepository.find({ order: { created_at: 'ASC' } });

    // Get all users with school_id (school users)
    const schoolUsers = await userRepository.find({
      where: { school_id: Not(IsNull()) },
      relations: ['school', 'role'],
      order: { created_at: 'ASC' },
    });

    console.log('\n=== PLATFORM ADMIN ===');
    const platformAdmin = await userRepository.findOne({
      where: { email: 'admin@platform.com' },
      relations: ['role'],
    });
    if (platformAdmin) {
      console.log(`Email: ${platformAdmin.email}`);
      console.log(`Password: password123`);
      console.log(`Role: ${platformAdmin.role?.name || roleMap.get(platformAdmin.role_id)}`);
      console.log(`Name: ${platformAdmin.name}`);
      console.log('');
    }

    console.log('\n=== SCHOOL USERS ===\n');
    
    // Group users by school
    const usersBySchool = new Map<string, User[]>();
    for (const user of schoolUsers) {
      if (user.school_id) {
        if (!usersBySchool.has(user.school_id)) {
          usersBySchool.set(user.school_id, []);
        }
        usersBySchool.get(user.school_id)!.push(user);
      }
    }

    // Display users grouped by school
    for (const school of schools) {
      const users = usersBySchool.get(school.id) || [];
      if (users.length > 0) {
        console.log(`\n--- ${school.name} (ID: ${school.id.substring(0, 8)}...) ---`);
        for (const user of users) {
          const roleName = user.role?.name || roleMap.get(user.role_id) || 'Unknown';
          console.log(`  ${roleName.toUpperCase()}:`);
          console.log(`    Email: ${user.email}`);
          console.log(`    Password: password123`);
          console.log(`    Name: ${user.name}`);
        }
      }
    }

  } catch (error) {
    console.error('Error listing users:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

listUsers().catch((error) => {
  console.error('Failed to list users:', error);
  process.exit(1);
});
