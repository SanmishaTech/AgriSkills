
import { prisma } from './src/lib/prisma';

async function testVisibility() {
    console.log('--- Testing Course Visibility ---');

    try {
        // 1. Find a topic
        const topic = await prisma.topic.findFirst({
            where: { isActive: true },
            include: { subtopics: { where: { isActive: true } } }
        });

        if (!topic || topic.subtopics.length === 0) {
            console.log('No active topic/subtopic found for testing.');
            return;
        }

        const subtopicId = topic.subtopics[0].id;

        // 2. Create a hidden course
        const hiddenCourse = await prisma.course.create({
            data: {
                title: 'Hidden Test Course ' + Date.now(),
                description: 'This should not appear in listings',
                isActive: true,
                isPublic: false,
                subtopicId: subtopicId
            }
        });
        console.log(`Created hidden course: ${hiddenCourse.id}`);

        // 3. Create a public course
        const publicCourse = await prisma.course.create({
            data: {
                title: 'Public Test Course ' + Date.now(),
                description: 'This should appear in listings',
                isActive: true,
                isPublic: true,
                subtopicId: subtopicId
            }
        });
        console.log(`Created public course: ${publicCourse.id}`);

        // 4. Check public API logic (simulated)
        const topicResult = await prisma.topic.findUnique({
            where: { id: topic.id },
            include: {
                subtopics: {
                    include: {
                        courses: {
                            where: { isActive: true, isPublic: true }
                        }
                    }
                }
            }
        });

        if (!topicResult) throw new Error('Topic not found');

        const allCourses = topicResult.subtopics.flatMap(s => s.courses);
        const foundHidden = allCourses.find(c => c.id === hiddenCourse.id);
        const foundPublic = allCourses.find(c => c.id === publicCourse.id);

        console.log('Verification Results:');
        console.log(`- Public course found in listing: ${!!foundPublic}`);
        console.log(`- Hidden course found in listing: ${!!foundHidden} (Should be false)`);

        if (!foundHidden && foundPublic) {
            console.log('SUCCESS: Visibility filtering is working properly.');
        } else {
            console.log('FAILURE: Visibility filtering is NOT working correctly.');
        }

        // 5. Cleanup
        await prisma.course.deleteMany({
            where: { id: { in: [hiddenCourse.id, publicCourse.id] } }
        });
        console.log('Cleaned up test courses.');
    } catch (err) {
        console.error('Test failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

testVisibility();
