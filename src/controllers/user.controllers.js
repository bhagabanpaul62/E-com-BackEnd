import { asyncHandler } from "../util/asyncHandler.js";
import { ApiError } from "../util/ApiError.js";
import { User } from "../models/User.model.js";

import { ApiResponse } from "../util/ApiResponse.js";
import { generateOtp, verifyOtp } from "../util/generateOtp.js";
import { Otp } from "../models/OtpVerification.model.js";
import { sendEmail } from "../util/sendEmail.js";
import jwt from "jsonwebtoken";

//generate Access And refresh token method
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken(); //accessToken is fro user
    const refreshToken = await user.generateRefreshToken(); //and refresh token we need to save in database

    user.refreshToken = refreshToken; // save in database
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while generating access and refresh token"
    );
  }
};

//OTP SENDER
export const sendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new ApiError(400, "EMAIL AND PASSWORD IS REQUIRED");
  }
  const existUser = await User.findOne({ email });

  if (existUser) {
    throw new ApiError(409, "This email id  already exist");
  }
  const { otp, hashedOtp } = generateOtp(); //this function give us 6 digit OTP
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await Otp.findOneAndUpdate(
    { identifier: email },
    { code: hashedOtp, expiresAt },
    { upsert: true, new: true }
  );
  await sendEmail(
    email,
    "you opt code",
    `<p>your opt is </p>${otp}</b> it will expire in 10 minutes`
  );

  return res
    .status(200)
    .json(new ApiResponse(200, { email: email }, "otp send successful"));
});

//OTP VALIDATION
export const OtpValidation = asyncHandler(async (req, res) => {
  console.log("REQ BODY RECEIVED:", req.body);
  const { email, code } = req.body;

  // Validation
  if (!email || !code) {
    console.log("❌ Missing email or code");
    throw new ApiError(400, "Enter both email and OTP code");
  }

  // Fetch latest OTP record
  const record = await Otp.findOne({ identifier: email }).sort({
    createdAt: -1,
  });

  if (!record) {
    throw new ApiError(400, "No OTP found for this email");
  }

  // Expiry check
  if (record.expiresAt < new Date()) {
    throw new ApiError(400, "OTP has expired");
  }

  // Match the code (assuming `verifyOtp` handles hashed comparison)
  const isValid = verifyOtp(code, record.code);
  if (!isValid) {
    throw new ApiError(401, "Invalid OTP");
  }

  // Mark OTP as verified
  record.isVerified = true;
  await record.save();

  // Send confirmation email
  await sendEmail(
    email,
    "Email Verified Successfully",
    `<p>Your email <strong>${email}</strong> has been successfully verified.</p>`
  );

  return res.status(200).json(new ApiResponse(200, { email }, "OTP verified"));
});

//CREATE USER
export const registerUser = asyncHandler(async (req, res, next) => {
  //get data
  //validation
  //check user already exist
  //check for images files
  //upload them to cloudinary
  //create user object - create entry in db
  //remove password and refresh token fild from fild
  //check fro user creation
  //return res

  const { name, email, password, phone } = req.body;
  //email give by previous response
  if ([name, email, password, phone].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "all fields are required");
  }

  //check otp verified or not
  const record = await Otp.findOne({ identifier: email });
  if (!record) {
    throw new ApiError(400, "No OTP found for this email");
  }
  if (!record.isVerified || record.identifier !== email) {
    throw new ApiError(400, `your email is not verified `);
  }

  //check user exist or not
  const existUser = await User.findOne({
    $or: [{ email }, { phone }],
  });
  if (existUser) {
    throw new ApiError(409, "This email id or phone number already exist");
  }

  // const profileImagePath = req.files?.profileImage[0]?.path;
  // const profileImage = await uploadCloudinary(profileImagePath);

  const user = await User.create({
    name,
    email,
    phone,
    password,
    emailVerified: true,
  });

  //creating the user
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "something went wrong");
  }

  //notify the user account is created
  await sendEmail(
    email,
    "Account Created Successfully",
    `<p>dear <span>${name}</span> </br> your Account is created successfully</p>`
  );

  //delete the otp record
  await Otp.deleteMany({ email });

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "user registered successfully"));
});

//LOGIN
export const login = asyncHandler(async (req, res, next) => {
  console.log(req.body);

  const { email, password } = req.body;

  //null checking
  if (!email || !password) {
    throw new ApiError(400, "enter the email and password");
  }

  const record = await User.findOne({ email: email });
  if (!record) {
    throw new ApiError(401, "no user found");
  }

  //check password and emailId
  const isPassword = await record.isPasswordCorrect(password);
  if (email !== record.email || !isPassword) {
    throw new ApiError(400, "email or password is wrong");
  }

  //accessToken and refreshToken  handel
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    record._id
  );

  console.log("accessToken :", accessToken, "\n refreshToken : ", refreshToken); //just for debugging

  const loginUser = await User.findById(record._id).select("-password ");

  //send token by secure cookie

  const options = {
    httpOnly: true, // if we don't provide this true our cookie any one can modified in frontend
    secure: true, // Must be true for cross-domain cookies with SameSite=None
    sameSite: "none", // Required for cross-domain cookies
    path: "/", // it true on production
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loginUser,
          accessToken,
          refreshToken,
        },
        "login is successful"
      )
    );
});

//LOGOUT
export const logout = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new ApiError(400, "User not authenticated");
  }
  //remove cookies and reset the refresh token
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: "",
      },
    },
    { new: true }
  );

  const options = {
    httpOnly: true, // if we don't provide this true our cookie any one can modified in frontend
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/", // it true on production
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged Out"));
});

//REFRESH ACCESS TOKEN
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(400, "Unauthorized Request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new ApiError(401, "invalid refresh token");
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token is used");
    }

    const { accessToken, NewRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          refreshToken: NewRefreshToken,
        },
      },
      {
        new: true,
      }
    );
    const options = {
      httpOnly: true, // if we don't provide this true our cookie any one can modified in frontend
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/", // it true on production
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", NewRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: NewRefreshToken },
          "token is refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error.message || "Invalid refresh token");
  }
});
