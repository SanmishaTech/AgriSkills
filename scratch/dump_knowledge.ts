import { prisma } from '../src/lib/prisma';

async function main() {
    console.log("--- START OF KNOWLEDGE BASE ---");
    console.log("PLATFORM NAME: GramKushal");
    console.log("DESCRIPTION: GramKushal is an agricultural learning platform providing expert courses on modern farming techniques.");
    console.log("");

    const topics = await prisma.topic.findMany({
        where: { isActive: true },
        include: {
            subtopics: {
                where: { isActive: true },
                include: {
                    courses: {
                        where: { isActive: true },
                        include: {
                            chapters: {
                                where: { isActive: true },
                                orderBy: { orderIndex: 'asc' }
                            }
                        }
                    }
                }
            }
        }
    });

    for (const topic of topics) {
        console.log(`TOPIC: ${topic.title}`);
        if (topic.description) console.log(`Description: ${topic.description}`);
        
        for (const sub of topic.subtopics) {
            console.log(`  SUBTOPIC: ${sub.title}`);
            
            for (const course of sub.courses) {
                console.log(`    COURSE: ${course.title}`);
                if (course.description) console.log(`    Description: ${course.description}`);
                console.log(`    Level: ${course.level || 'Beginner'}`);
                
                for (const chapter of course.chapters) {
                    console.log(`      CHAPTER: ${chapter.title}`);
                    // Concatenate first 200 chars of content for context
                    const snippet = chapter.content.replace(/<[^>]*>/g, '').slice(0, 200).trim();
                    if (snippet) console.log(`      Content Snippet: ${snippet}...`);
                }
            }
        }
        console.log("---\n");
    }

    const shorts = await prisma.youTubeShort.findMany({ where: { isActive: true } });
    if (shorts.length > 0) {
        console.log("REELS / SHORTS AVAILABLE:");
        for (const s of shorts) {
            console.log(`- ${s.title}: ${s.url}`);
        }
    }

    console.log("--- END OF KNOWLEDGE BASE ---");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
