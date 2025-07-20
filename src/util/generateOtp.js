import crypto from "crypto";

// Hash OTP (synchronous, no need for async/await)
export function hashedOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

// Generate OTP and its hashed version
export function generateOtp() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
  const hashed = hashedOtp(otp);
  return { otp, hashedOtp: hashed }; // send only hashedOtp to frontend or DB
}

// Compare input OTP with stored hash
export function verifyOtp(inputOtp, storedHashedOtp) {
  const hashedInput = hashedOtp(inputOtp);
  return hashedInput === storedHashedOtp;
}
