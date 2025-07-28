import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function testAdminAuth() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('Testing Admin Authentication Flow...\n');
  
  try {
    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@gmail.com',
        password: 'abcd123@'
      })
    });

    if (!loginResponse.ok) {
      const error = await loginResponse.json();
      console.error('Login failed:', error);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful!');
    console.log('User:', {
      id: loginData.user.id,
      email: loginData.user.email,
      name: loginData.user.name,
      role: loginData.user.role
    });
    console.log('Token received:', loginData.token.substring(0, 50) + '...');

    // Step 2: Test protected user endpoint
    console.log('\n2. Testing protected user endpoint...');
    const userResponse = await fetch(`${baseUrl}/api/protected/user`, {
      headers: {
        'Authorization': `Bearer ${loginData.token}`
      }
    });

    if (!userResponse.ok) {
      const error = await userResponse.json();
      console.error('Protected endpoint failed:', error);
    } else {
      const userData = await userResponse.json();
      console.log('✅ Protected endpoint successful!');
      console.log('User data:', userData.user);
    }

    // Step 3: Test admin users endpoint
    console.log('\n3. Testing admin users endpoint...');
    const adminResponse = await fetch(`${baseUrl}/api/admin/users`, {
      headers: {
        'Authorization': `Bearer ${loginData.token}`
      }
    });

    if (!adminResponse.ok) {
      const error = await adminResponse.json();
      console.error('Admin endpoint failed:', error);
    } else {
      const adminData = await adminResponse.json();
      console.log('✅ Admin endpoint successful!');
      console.log(`Found ${adminData.users.length} users:`);
      interface User {
        id: string;
        email: string;
        name?: string;
        role: string;
      }
      adminData.users.forEach((user: User) => {
        console.log(`  - ${user.name || 'N/A'} (${user.email}) - Role: ${user.role}`);
      });
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Check if server is running
fetch('http://localhost:3000/api/check-env')
  .then(() => {
    testAdminAuth();
  })
  .catch(() => {
    console.error('❌ Server is not running. Please start the server with: npm run dev');
  });
