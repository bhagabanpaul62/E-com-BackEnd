// Test file for Razorpay API - Basic test
import Razorpay from 'razorpay';
import { createHmac } from 'crypto';

console.log('Starting basic Razorpay test...');

// Print version info
console.log('Node.js version:', process.version);
// Skip package version in ESM

// Try a base64 encoding of the key and secret (proper API auth method)
const key_id = 'rzp_test_KDN5uTNLu5ZbaY';
const key_secret = 'fPKTAuJmq1WvpNSQruEEtxsM';
const auth = Buffer.from(`${key_id}:${key_secret}`).toString('base64');
console.log('Base64 auth string:', auth);

// Create a signature with the secret key to test crypto
const payload = 'test_payload';
const signature = createHmac('sha256', key_secret)
  .update(payload)
  .digest('hex');
console.log('Test signature with key:', signature);

// Create Razorpay instance
try {
  const instance = new Razorpay({
    key_id: key_id,
    key_secret: key_secret,
  });
  
  console.log('Razorpay instance created successfully');
  console.log('Available APIs:', Object.keys(instance));
  
  // Test a simple API call
  const testOrder = async () => {
    try {
      console.log('Testing direct API call with fetch...');
      
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`,
        },
        body: JSON.stringify({
          amount: 50000,
          currency: 'INR',
          receipt: `receipt_${Date.now()}`,
        }),
      };
      
      // Using node-fetch to directly call the API
      const fetch = (await import('node-fetch')).default;
      const response = await fetch('https://api.razorpay.com/v1/orders', options);
      const data = await response.json();
      
      console.log('Direct API response:', data);
    } catch (error) {
      console.error('Error with direct API call:', error);
    }
  };
  
  testOrder();
  
} catch (error) {
  console.error('Error creating Razorpay instance:', error);
}
