import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/auth';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const prisma = new PrismaClient();

async function seedUsers() {
  try {
    const testUsers = [
      {
        email: 'john.doe@example.com',
        password: 'password123',
        name: 'John Doe',
        role: 'user'
      },
      {
        email: 'jane.smith@example.com',
        password: 'password123',
        name: 'Jane Smith',
        role: 'user'
      },
      {
        email: 'bob.johnson@example.com',
        password: 'password123',
        name: 'Bob Johnson',
        role: 'user'
      },
      {
        email: 'alice.williams@example.com',
        password: 'password123',
        name: 'Alice Williams',
        role: 'user'
      },
      {
        email: 'charlie.brown@example.com',
        password: 'password123',
        name: 'Charlie Brown',
        role: 'user'
      }
    ];

    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        console.log(`User ${userData.email} already exists`);
        continue;
      }

      // Create user
      const hashedPassword = await hashPassword(userData.password);
      
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          role: userData.role,
          emailVerified: new Date(),
        }
      });

      console.log('User created successfully:', {
        email: user.email,
        name: user.name,
        role: user.role
      });
    }

    // Display total user count
    const userCount = await prisma.user.count();
    console.log(`\nTotal users in database: ${userCount}`);

  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedUsers();
