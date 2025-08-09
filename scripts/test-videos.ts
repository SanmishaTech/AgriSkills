import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testVideos() {
  try {
    const topicId = 'd34408a0-a3d1-4e5d-9238-e5f953a716cf';
    
    // Test API endpoint
    console.log('🧪 Testing demo video display...');
    
    const response = await fetch(`http://localhost:3000/api/topics/${topicId}`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response Status: Success');
      console.log(`📺 Demo Videos Found: ${data.demoVideos?.length || 0}`);
      console.log(`📄 Demo Content: ${data.demoContent ? 'Present' : 'Missing'}`);
      
      if (data.demoVideos?.length > 0) {
        console.log('\n🎬 Video Details:');
        data.demoVideos.forEach((video: any, index: number) => {
          console.log(`   ${index + 1}. ${video.title}`);
          console.log(`      YouTube ID: ${video.youtubeId}`);
          console.log(`      Instructor: ${video.instructor}`);
          console.log(`      Duration: ${video.duration}`);
          console.log('');
        });
        
        console.log('🌟 Demo videos are properly configured!');
        console.log('📍 Visit: http://localhost:3000/topic/d34408a0-a3d1-4e5d-9238-e5f953a716cf');
      }
    } else {
      console.log('❌ API request failed');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testVideos();
