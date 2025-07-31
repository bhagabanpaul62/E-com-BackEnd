import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "warning", "Blocked"],
      default: "Active",
    },
    warningNote: {
      type: String,
    },
    phone: {
      type: Number,

      required: true,
    },
    profileImage: {
      type: String,
    },
    lastLogin: {
      type: Date,
    },
    blockedAt: {
      type: Date,
    },
    phoneVerified :{
      type:Boolean,
      default:false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
    },
    otp: {
      code: String,
      expiresAt: Date,
    },
    loginMethod: {
      type: String,
      enum: ["email", "phone", "google"],
      default: "email",
    },
    googleId: {
      type: String,
    },
  },
  { timestamps: true }
);

//hooks mongoose
UserSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    //if password fild is modified is encrypt the password with 10 round hash
    this.password = await bcrypt.hash(this.password, 10);
    return next();
  } else {
    return next();
  }
});

//methods for checking password
UserSchema.methods.isPasswordCorrect = async function (password) {
  //this compare function is check tha password
  return await bcrypt.compare(password, this.password);
};

UserSchema.methods.generateAccessToken = async function () {
  const token = await jwt.sign(
    {
      _id: this._id,
      email: this.email,
      name: this.name,
      isAdmin:this.isAdmin,
      status:this.status,
      
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
  return token;
};

UserSchema.methods.generateRefreshToken = async function () {
  const token = await jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
  return token;
};

export const User = mongoose.model("User", UserSchema);
