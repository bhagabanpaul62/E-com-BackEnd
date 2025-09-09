// Test file for Razorpay API
const Razorpay = require("razorpay");

console.log("Starting Razorpay test script...");

// Create Razorpay instance with hardcoded keys
const instance = new Razorpay({
  key_id: "rzp_test_KDN5uTNLu5ZbaY",
  key_secret: "fPKTAuJmq1WvpNSQruEEtxsM",
});

// Test order creation
async function createOrder() {
  try {
    console.log("Attempting to create a Razorpay order...");

    const options = {
      amount: 50000, // amount in paise (₹500)
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    console.log("Order options:", options);

    const order = await instance.orders.create(options);
    console.log("Order created successfully:", order);
    return order;
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
}

// Run the test
createOrder()
  .then(() => console.log("Test completed successfully"))
  .catch((error) => console.error("Test failed:", error));
