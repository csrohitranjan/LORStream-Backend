import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";



const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    fatherName: {
        type: String,
        required: true
    },
    classRollNumber: {
        type: String,
        required: true
    },
    registrationNumber: {
        type: String,
        unique: true,
        required: true
    },
    examRollNumber: {
        type: String,
        required: true,
        unique: true
    },
    programme: {    //  -> B.Sc (Honours) Computer Application
        type: String,
        required: true

    },
    department: {   // -> BCA
        type: String,
        required: true
    },
    currentSemester: {
        type: String
    },
    gender: {
        type: String
    },
    email: {
        type: String
    },
    phoneNumber: {
        type: String
    },
    role: {
        type: String,
        enum: ['student', 'admin'],
        default: 'student',
        required: true
    },
    password: {
        type: String,
        required: true
    },
    refreshToken: {
        type: String
    }
}, { timestamps: true });



userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            examRollNumber: this.examRollNumber,
            role: this.role
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
};
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    );
};




export const User = mongoose.model("User", userSchema);