/**
 * Debug utility for testing localStorage persistence
 * Run this in the browser console to check localStorage data
 */

function debugLocalStorage() {
  console.log('🔍 LocalStorage Debug Utility');
  console.log('==============================\n');
  
  // Get current user
  const userData = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  
  console.log('👤 Current User Info:');
  console.log('  Token:', token ? 'Present' : 'Missing');
  console.log('  User Data:', userData);
  
  if (userData) {
    try {
      const user = JSON.parse(userData);
      console.log('  User ID:', user.id);
      console.log('  User Name:', user.name);
    } catch (e) {
      console.log('  ❌ Invalid user data format');
    }
  }
  
  console.log('\n📦 All localStorage keys:');
  const allKeys = Object.keys(localStorage);
  allKeys.forEach(key => {
    const value = localStorage.getItem(key);
    console.log(`  ${key}: ${value}`);
  });
  
  console.log('\n🎯 Topic Questions Data:');
  const questionKeys = allKeys.filter(key => key.startsWith('topic-questions-'));
  if (questionKeys.length === 0) {
    console.log('  No topic question data found');
  } else {
    questionKeys.forEach(key => {
      const value = localStorage.getItem(key);
      console.log(`  ${key}: ${value}`);
      try {
        const parsed = JSON.parse(value);
        console.log(`    Parsed: ${parsed.length} selections:`, parsed);
      } catch (e) {
        console.log(`    ❌ Invalid JSON format`);
      }
    });
  }
  
  console.log('\n🧪 Test Storage:');
  const testKey = 'debug-test-key';
  const testValue = 'test-value-' + Date.now();
  
  try {
    localStorage.setItem(testKey, testValue);
    const retrieved = localStorage.getItem(testKey);
    
    if (retrieved === testValue) {
      console.log('  ✅ localStorage write/read working correctly');
      localStorage.removeItem(testKey);
    } else {
      console.log('  ❌ localStorage read/write issue');
    }
  } catch (e) {
    console.log('  ❌ localStorage error:', e.message);
  }
  
  console.log('\n==============================');
}

// Function to clear all topic question data (for testing)
function clearAllTopicData() {
  const keys = Object.keys(localStorage);
  const removed = [];
  
  keys.forEach(key => {
    if (key.startsWith('topic-questions-')) {
      localStorage.removeItem(key);
      removed.push(key);
    }
  });
  
  console.log(`🧹 Cleared ${removed.length} topic question entries:`, removed);
}

// Function to simulate user data for testing
function setTestUser(userId = 'test-user-123', name = 'Test User') {
  const user = {
    id: userId,
    name: name,
    email: `${userId}@test.com`,
    role: 'user'
  };
  
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('token', 'test-token-' + userId);
  
  console.log(`👤 Set test user:`, user);
}

// Run debug by default
debugLocalStorage();

// Export functions for manual use
window.debugLocalStorage = debugLocalStorage;
window.clearAllTopicData = clearAllTopicData;
window.setTestUser = setTestUser;

console.log('\n💡 Available functions:');
console.log('  debugLocalStorage() - Show current state');
console.log('  clearAllTopicData() - Clear all topic selections');
console.log('  setTestUser(id, name) - Set a test user');
