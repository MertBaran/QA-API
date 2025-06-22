const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Schema = mongoose.Schema;
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const Question = require('./Question');

const userSchema = new Schema({
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
        //user can provide a title
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
        //admin can block a user
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

userSchema.methods.generateJWTFromUser = function(){
    const {JWT_SECRET_KEY, JWT_EXPIRE} = process.env;
    const payload = {
        id: this._id,
        name: this.name
    };
  
    const token = jwt.sign(payload, JWT_SECRET_KEY, {expiresIn: JWT_EXPIRE});
    return token;
};


userSchema.methods.getResetPasswordTokenFromUser = function(){
    const randomHexString = crypto.randomBytes(15).toString("hex");
    const {RESET_PASSWORD_EXPIRE} = process.env;
    const resetPasswordToken = crypto.createHash("SHA256").update(randomHexString).digest("hex");
    this.resetPasswordToken = resetPasswordToken;
    this.resetPasswordExpire = Date.now() + (parseInt(RESET_PASSWORD_EXPIRE) * 1000);
    return resetPasswordToken;
};

//pre hooks
userSchema.pre("save", function(next){
    //if password is not modified, skip the process
    if(!this.isModified("password")){
        next();
    }
    
    bcrypt.genSalt(10, (err, salt) => {
        if(err) next(err);
        bcrypt.hash(this.password, salt, (err, hash) => {
            if(err) next(err);
            this.password = hash;
            next();
        });
    });
});

userSchema.post("findOneAndDelete", async function(doc){
    try {
        const result = await Question.deleteMany({
            user : doc._id
        });
        console.log('User deleted:', doc._id);
        console.log('Questions deleted:', result.deletedCount);
    } catch (error) {
        console.error('Error deleting questions:', error);
    }
});

const User = mongoose.model("User", userSchema);
module.exports = User;
