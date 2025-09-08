// Test file for Razorpay API - Balance Check
import Razorpay from 'razorpay';

console.log('Starting Razorpay balance check...');

// Create Razorpay instance with hardcoded keys
const instance = new Razorpay({
  key_id: 'rzp_test_KDN5uTNLu5ZbaY',
  key_secret: 'fPKTAuJmq1WvpNSQruEEtxsM',
});

// Test balance fetch
async function checkBalance() {
  try {
    console.log('Attempting to fetch Razorpay balance...');
    
    // This is a simpler API call that might work even if order creation doesn't
    const balance = await instance.balance.fetch();
    console.log('Balance fetched successfully:', balance);
    return balance;
  } catch (error) {
    console.error('Error fetching balance:', error);
    throw error;
  }
}

// Run the test
checkBalance()
  .then(() => console.log('Balance check completed successfully'))
  .catch((error) => console.error('Balance check failed:', error));
