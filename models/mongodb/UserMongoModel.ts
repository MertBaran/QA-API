import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from 'crypto';
import { EntityId } from '../../types/database';

export interface IUserMongo extends Document {
  _id: EntityId;
  name: string;
  email: string;
  role: "user" | "admin";
  password: string;
  createdAt: Date;
  title?: string;
  about?: string;
  place?: string;
  website?: string;
  profile_image: string;
  blocked: boolean;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  generateJWTFromUser(): string;
  getResetPasswordTokenFromUser(): string;
}

const userSchema = new Schema<IUserMongo>({
  name: {
    type: String,
    required: [true, "Please provide a name"]
  },
  email: {
    type: String,
    required: [true, "Please provide an email"],
    unique: true,
    match: [
      /^\S+@\S+\.\S+$/,
      "Please provide a valid email"
    ]
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: [6, "Password must be at least 6 characters long"],
    select: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  title: {
    type: String
  },
  about: {
    type: String
  },
  place: {
    type: String
  },
  website: {
    type: String
  },
  profile_image: {
    type: String,
    default: "default.jpg"
  },
  blocked: {
    type: Boolean,
    default: false
  }, 
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpire: {
    type: Date
  }
});

// JWT token oluşturma metodu
userSchema.methods['generateJWTFromUser'] = function(this: IUserMongo): string {
  const {JWT_SECRET_KEY, JWT_EXPIRE} = process.env;
  const payload = {
    id: this._id,
    name: this.name
  };
  const secret: string = JWT_SECRET_KEY || "default_secret";
  const expires: string | number = JWT_EXPIRE ? JWT_EXPIRE : "1d";
  // @ts-expect-error jwt types bug workaround
  const token = jwt.sign(payload, secret, { expiresIn: expires });
  return token;
};

// Şifre sıfırlama tokeni oluşturma metodu
userSchema.methods['getResetPasswordTokenFromUser'] = function(this: IUserMongo): string {
  const randomHexString = crypto.randomBytes(15).toString("hex");
  const {RESET_PASSWORD_EXPIRE} = process.env;
  const resetPasswordToken = crypto.createHash("SHA256").update(randomHexString).digest("hex");
  this.resetPasswordToken = resetPasswordToken;
  this.resetPasswordExpire = new Date(Date.now() + (parseInt(RESET_PASSWORD_EXPIRE || "3600") * 1000));
  return resetPasswordToken;
};

//pre hooks - şifre hashleme işlemi
userSchema.pre("save", function(this: IUserMongo, next) {
  // Set default values if not provided
  if (this.role === undefined) {
    this.role = "user";
  }
  if (this.profile_image === undefined) {
    this.profile_image = "default.jpg";
  }
  if (this.blocked === undefined) {
    this.blocked = false;
  }
  
  //if password is not modified, skip the process
  if(!this.isModified("password")){
    next();
  }
  
  bcrypt.genSalt(10, (err, salt) => {
    if(err) next(err);
    if (this.password && salt) {
      bcrypt.hash(this.password, salt, (err, hash) => {
        if(err) next(err);
        if (hash) this.password = hash;
        next();
      });
    } else {
      next();
    }
  });
});

const UserMongo = mongoose.model<IUserMongo>("User", userSchema);
export default UserMongo; 