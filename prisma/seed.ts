import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

// Use DIRECT_URL for seeding to avoid pgbouncer issues
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL,
    },
  },
});

async function main() {
  console.log('Seeding database...');

  // Create Admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { loginId: 'admin' },
    update: {},
    create: {
      email: 'admin@vyaapar.com',
      loginId: 'admin',
      password: adminPassword,
      name: 'System Admin',
      role: UserRole.ADMIN,
      phone: '9999999999',
      isActive: true,
    },
  });

  console.log('Created Admin user:', {
    id: admin.id,
    loginId: admin.loginId,
    email: admin.email,
    role: admin.role,
  });

  console.log('\n✅ Seed completed!');
  console.log('\n📝 Admin Login Credentials:');
  console.log('   Login ID: admin');
  console.log('   Password: admin123');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
