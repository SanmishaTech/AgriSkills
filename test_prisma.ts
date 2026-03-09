import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

console.log('PrismaPg:', typeof PrismaPg);

const connectionString = 'postgres://dummy:dummy@localhost:5432/dummy';
const pool = new Pool({ connectionString });
console.log('Pool created');
const adapter = new PrismaPg(pool);
console.log('Adapter created:', !!adapter);

const prisma = new PrismaClient({ adapter });
console.log('Prisma client created');
