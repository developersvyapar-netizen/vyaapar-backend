import { PrismaClient, UserRole } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
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

  // Test users for API tests and cart flow (retailer, distributor, stockist, salesperson)
  const testPassword = await bcrypt.hash('password123', 10);
  const retailer = await prisma.user.upsert({
    where: { loginId: 'retailer1' },
    update: {},
    create: {
      email: 'retailer1@vyaapar.com',
      loginId: 'retailer1',
      password: testPassword,
      name: 'Test Retailer',
      role: UserRole.RETAILER,
      isActive: true,
    },
  });
  const distributor = await prisma.user.upsert({
    where: { loginId: 'distributor1' },
    update: {},
    create: {
      email: 'distributor1@vyaapar.com',
      loginId: 'distributor1',
      password: testPassword,
      name: 'Test Distributor',
      role: UserRole.DISTRIBUTOR,
      isActive: true,
    },
  });
  const stockist = await prisma.user.upsert({
    where: { loginId: 'stockist1' },
    update: {},
    create: {
      email: 'stockist1@vyaapar.com',
      loginId: 'stockist1',
      password: testPassword,
      name: 'Test Stockist',
      role: UserRole.STOCKIST,
      isActive: true,
    },
  });
  const salesperson = await prisma.user.upsert({
    where: { loginId: 'salesperson1' },
    update: {},
    create: {
      email: 'salesperson1@vyaapar.com',
      loginId: 'salesperson1',
      password: testPassword,
      name: 'Test Salesperson',
      role: UserRole.SALESPERSON,
      isActive: true,
    },
  });
  console.log('Created test users: retailer1, distributor1, stockist1, salesperson1');

  // Tea products for cart tests
  const teaProducts = [
    { sku: 'TEA-001', name: 'Assam Tea', description: 'Premium Assam black tea', price: new Decimal(299.99), unit: 'kg' },
    { sku: 'TEA-002', name: 'Darjeeling Tea', description: 'Darjeeling first flush', price: new Decimal(449.99), unit: 'kg' },
    { sku: 'TEA-003', name: 'Green Tea', description: 'Classic green tea', price: new Decimal(349.99), unit: 'kg' },
    { sku: 'TEA-004', name: 'Masala Chai', description: 'Spiced chai blend', price: new Decimal(279.99), unit: 'kg' },
    { sku: 'TEA-005', name: 'Earl Grey', description: 'Bergamot black tea', price: new Decimal(399.99), unit: 'kg' },
  ];
  for (const p of teaProducts) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        name: p.name,
        description: p.description,
        sku: p.sku,
        price: p.price,
        unit: p.unit,
      },
    });
  }
  console.log('Created tea products:', teaProducts.map((p) => p.sku).join(', '));

  console.log('\n✅ Seed completed!');
  console.log('\n📝 Login Credentials:');
  console.log('   Admin:       admin / admin123');
  console.log('   Retailer:    retailer1 / password123');
  console.log('   Distributor: distributor1 / password123');
  console.log('   Stockist:    stockist1 / password123');
  console.log('   Salesperson: salesperson1 / password123');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
