/**
 * Test script to verify user-specific localStorage separation
 * Run this in the browser console to test the fix
 */

// Function to simulate user login and data storage
function testUserSeparation() {
  console.log('🧪 Testing User Data Separation...\n');
  
  // Clear all localStorage first
  localStorage.clear();
  
  // Simulate User 1 login
  console.log('1️⃣ Simulating User 1 login...');
  const user1 = { id: 'user1', name: 'John Doe', email: 'john@example.com' };
  localStorage.setItem('user', JSON.stringify(user1));
  localStorage.setItem('token', 'token1');
  
  // User 1 selects some questions for topic "agriculture"
  const user1Selections = ['q1', 'q2', 'q3'];
  localStorage.setItem(`topic-questions-agriculture-${user1.id}`, JSON.stringify(user1Selections));
  console.log(`   ✅ User 1 selected questions:`, user1Selections);
  
  // Simulate User 2 login (logout User 1 first)
  console.log('\n2️⃣ Simulating User 2 login...');
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  
  const user2 = { id: 'user2', name: 'Jane Smith', email: 'jane@example.com' };
  localStorage.setItem('user', JSON.stringify(user2));
  localStorage.setItem('token', 'token2');
  
  // User 2 selects different questions for the same topic
  const user2Selections = ['q4', 'q5'];
  localStorage.setItem(`topic-questions-agriculture-${user2.id}`, JSON.stringify(user2Selections));
  console.log(`   ✅ User 2 selected questions:`, user2Selections);
  
  // Verify data separation
  console.log('\n🔍 Verifying data separation:');
  const user1Data = localStorage.getItem(`topic-questions-agriculture-${user1.id}`);
  const user2Data = localStorage.getItem(`topic-questions-agriculture-${user2.id}`);
  
  console.log(`   User 1 data: ${user1Data}`);
  console.log(`   User 2 data: ${user2Data}`);
  
  if (user1Data !== user2Data && user1Data && user2Data) {
    console.log('\n✅ SUCCESS: Users have separate data!');
  } else {
    console.log('\n❌ FAILED: User data is not properly separated!');
  }
  
  // Test localStorage keys
  console.log('\n📦 All localStorage keys:');
  Object.keys(localStorage).forEach(key => {
    console.log(`   ${key}: ${localStorage.getItem(key)}`);
  });
  
  // Clean up
  localStorage.clear();
  console.log('\n🧹 Test completed and localStorage cleared.');
}

// Run the test
testUserSeparation();
