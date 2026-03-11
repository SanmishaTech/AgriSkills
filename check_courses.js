
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        isActive: true,
        isPublic: true
      }
    });
    console.log('Courses in database:');
    console.log(JSON.stringify(courses, null, 2));
  } catch (err) {
    console.error('Prisma Error:', err);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
