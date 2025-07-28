import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth';

const prisma = new PrismaClient();

async function main() {
  // Create user Vipul
  const existingUser = await prisma.user.findUnique({
    where: { email: 'vipul@gmail.com' },
  });

  if (!existingUser) {
    const hashedPassword = await hashPassword('abcd123@');

    const user = await prisma.user.create({
      data: {
        email: 'vipul@gmail.com',
        password: hashedPassword,
        name: 'Vipul',
        role: 'user',
      },
    });

    console.log(`Created user: ${user.email}`);
  } else {
    console.log('User Vipul already exists');
  }
  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@gmail.com' },
  });

  if (!existingAdmin) {
    // Create admin user
    const hashedPassword = await hashPassword('abcd123@');
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@gmail.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'admin',
      },
    });
    
    console.log(`Created admin user: ${admin.email}`);
  } else {
    console.log('Admin user already exists');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });