import { User } from "../models/user.model.js";
import { generateAccessAndRefreshTokens } from "../utils/generateAccessAndRefreshTokens.js";
import { generateRandomPassword } from "../utils/generateRandomPassword.js"
import nodemailer from 'nodemailer';
import dotenv from "dotenv";
dotenv.config();
import { sendMail } from "../utils/sendMail.js"



const registerUser = async (req, res) => {
    try {
        let { fullName, fatherName, classRollNumber, registrationNumber, examRollNumber, programme, department, password } = req.body;

        // Check if any required field is missing
        if (!fullName || !fatherName || !classRollNumber || !registrationNumber || !examRollNumber || !programme || !department) {
            return res.status(400).json({
                status: 400,
                message: "All fields are required except password."
            });
        }

        // Remove all whitespace characters from these fields
        registrationNumber = registrationNumber.replace(/\s+/g, '').toUpperCase();
        examRollNumber = examRollNumber.replace(/\s+/g, '').toUpperCase();
        department = department.replace(/\s+/g, '').toUpperCase();

        // Set password as last five digits of examRollNumber if not provided
        if (!password) {
            password = examRollNumber.substr(-5); // Extract last five characters
        }

        const existedUser = await User.findOne({
            $or: [{ registrationNumber }, { examRollNumber }]
        });

        if (existedUser) {
            return res.status(409).json({
                status: 409,
                success: false,
                message: "User already Registered"
            });
        }

        const insertedUser = await User.create({
            fullName,
            fatherName,
            classRollNumber,
            registrationNumber,
            examRollNumber,
            programme,
            department,
            password
        });

        const createdUser = await User.findById(insertedUser._id).select(
            "-password -refreshToken"
        );

        if (!createdUser) {
            return res.status(500).json({
                status: 500,
                success: false,
                message: "Something Went Wrong While Registering the User"
            });
        }

        return res.status(200).json({
            status: 200,
            success: true,
            message: "User Registered Successfully",
            user: createdUser
        });

    } catch (error) {
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal Server Error on: registerUser Controller",
            error: error.message
        });
    }
};



const loginUser = async (req, res) => {
    try {
        let { examRollNumber, email, password } = req.body;

        // Convert examRollNumber to uppercase 
        if (examRollNumber) {
            examRollNumber = examRollNumber.replace(/\s+/g, '').toUpperCase();
        }

        if (!((email && password) || (examRollNumber && password))) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "Email or Exam Roll Number and Password are required"
            });
        }

        let user;
        if (email) {
            user = await User.findOne({ email });
        }

        if (examRollNumber) {
            user = await User.findOne({ examRollNumber });
        }

        if (!user) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "User Does not Exist"
            });
        }

        const isPasswordValid = await user.isPasswordCorrect(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                status: 401,
                success: false,
                message: "Wrong Password"
            });
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

        const loggedInUser = await User.findById(user._id).select(
            "-password -refreshToken"
        );

        const options = {
            httpOnly: true,
            secure: true
        };

        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json({
                status: 200,
                success: true,
                message: "User Logged in Successfully",
                user: loggedInUser,
                accessToken,
                refreshToken
            });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal server error occurred in login Controller.",
            error: error.message
        });
    }
};



const forgetPassword = async (req, res) => {
    try {
        const { registrationNumber, email } = req.body;

        if (!registrationNumber || !email) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "All fields are required."
            });
        }

        const user = await User.findOne({
            registrationNumber,
            email,
        });

        if (!user) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "User not found. Please provide correct details."
            });
        }

        const newPassword = generateRandomPassword(12);

        const mailOptions = {
            from: '"College ERP" <rrcovid2019@gmail.com>',
            to: user.email,
            subject: '🔒 Your New College ERP Password',
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0px 0px 10px 0px rgba(0,0,0,0.1);">
                        <div style="background-color: #007bff; color: #ffffff; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1 style="font-size: 28px; margin: 0;">🎓 College ERP</h1>
                        </div>
                        <div style="padding: 20px;">
                            <h2 style="color: #007bff; margin-top: 0;">Hello,</h2>
                            <p style="font-size: 16px; margin-bottom: 10px;">We have received a request to reset your password for your College ERP account.</p>
                            <div style="background-color: #f0f0f0; padding: 10px; border-radius: 5px;">
                                <p style="font-size: 16px; margin: 0;">Your new password is: <strong>${newPassword}</strong></p>
                            </div>
                            <p style="font-size: 16px; margin-top: 10px;">For security reasons, we recommend changing this password after logging in.</p>
                            <p style="font-size: 16px; margin-top: 10px;">If you didn't request this password change, please contact our support team immediately.</p>
                            <p style="font-size: 16px; margin-top: 20px;">Best regards,<br/>College ERP Team</p>
                        </div>
                        <div style="background-color: #007bff; color: #ffffff; text-align: center; padding: 10px; border-radius: 0 0 10px 10px;">
                        <p style="font-size: 14px; margin: 0;">Designed and developed by Mr. Rohit Ranjan <a href="https://www.linkedin.com/in/csrohitranjan/" target="_blank"><img src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" alt="LinkedIn" style="width: 15px; vertical-align: middle;"></a></p>
                        </div>
                    </div>
                </div>
            `
        };

        await sendMail(mailOptions);

        // Update user's password after successfully sending the email
        user.password = newPassword;
        await user.save({ validateBeforeSave: false });
        return res.status(200).json({
            status: 200,
            success: true,
            message: "Password Reset successfully. New password sent to your email.",
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal server error occurred on forget password controller.",
            error: error.message
        });
    }
};



const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id; // Assuming user is authenticated and userId is available in req.user._id
        const { currentSemester, gender, email, phoneNumber } = req.body;

        // Check if email or phoneNumber is already registered
        const existingUser = await User.findOne({ $or: [{ email }, { phoneNumber }] });

        // Determine which field is already registered and return corresponding response
        if (existingUser) {
            if (email !== undefined && existingUser.email === email) {
                return res.status(409).json({
                    status: 409,
                    success: false,
                    message: "Email is already registered"
                });
            }
            if (phoneNumber !== undefined && existingUser.phoneNumber === phoneNumber) {
                return res.status(409).json({
                    status: 409,
                    success: false,
                    message: "Phone number is already registered"
                });
            }
        }

        // Update user data
        const updateFields = {}; // Initialize an empty object to store fields to update

        // Only include fields in the updateFields object if they are provided in the request body
        if (currentSemester) {
            updateFields.currentSemester = currentSemester;
        }
        if (gender) {
            updateFields.gender = gender;
        }
        if (email) {
            updateFields.email = email;
        }
        if (phoneNumber) {
            updateFields.phoneNumber = phoneNumber;
        }

        // Check if any field to update is provided
        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "No fields provided for update."
            });
        }

        // Perform the update operation
        const updatedUser = await User.findByIdAndUpdate(userId, updateFields, { new: true });

        if (!updatedUser) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "User not found."
            });
        }

        // Return success response with updated user data
        return res.status(200).json({
            status: 200,
            success: true,
            message: "Student data updated successfully.",
            user: updatedUser
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal server error occurred in updateProfile Controller",
            error: error.message
        });
    }
};



const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body

        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "Old Password & New Password are required"
            })
        }

        if (oldPassword === newPassword) {
            return res.status(401).json({
                status: 401,
                success: false,
                message: "Old Password & New Password Can not be Same"
            })
        }

        const user = await User.findById(req.user?._id)

        const isOldPasswordCorrect = await user.isPasswordCorrect(oldPassword)

        if (!isOldPasswordCorrect) {
            return res.status(400)
                .json({
                    status: 400,
                    success: false,
                    message: "Invalid Old Password"
                })
        }

        user.password = newPassword
        await user.save({ validateBeforeSave: false })

        return res.status(200)
            .json({
                status: 200,
                success: true,
                message: "Password Changed Successfully"
            })
    } catch (error) {
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal server error occurred in changePassword Controller",
            error: error.message
        });
    }
}



const getCurrentUser = (req, res) => {
    try {
        return res.status(200)
            .json({
                status: 200,
                success: true,
                message: "Current User Fetched Successfully",
                user: req.user
            })
    } catch (error) {
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal server error occurred in getCurrentUser Controller",
            error: error.message
        });
    }
}



const logout = async (req, res) => {
    try {
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    refreshToken: undefined
                }
            },
            {
                new: true
            }
        )

        const options = {
            httpOnly: true,
            secure: true
        }

        return res.status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json({
                status: 200,
                success: true,
                message: "User Logged Out"
            })
    } catch (error) {
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal server error occurred in logout Controller",
            error: error.message
        });
    }

}








export { registerUser, loginUser, forgetPassword, updateProfile, changePassword, getCurrentUser, logout }