import { User } from "../models/user.model.js";
import { generateAccessAndRefreshTokens } from "../utils/generateAccessAndRefreshTokens.js";




const home = (req, res) => {
    return res.status(200).send("<h1>Welcome to User Controllers Page</h1>");
};



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
                message: "Something Went Wrong While Registering the User"
            });
        }

        return res.status(201).json({
            status: 201,
            message: "User Registered Successfully",
            user: createdUser
        });

    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: "Internal Server Error on: registerUser Controller",
            error
        });
    }
};



const loginUser = async (req, res) => {
    try {
        const { examRollNumber, email, password } = req.body;

        if (!((email && password) || (examRollNumber && password))) {
            return res.status(400).json({
                status: 400,
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
                message: "User Does not Exist"
            });
        }

        const isPasswordValid = await user.isPasswordCorrect(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                status: 401,
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
                message: "User Logged in Successfully",
                user: loggedInUser,
                accessToken,
                refreshToken
            });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: "Internal server error occurred in login Controller.",
            error
        });
    }
};



const forgetPassword = async (req, res) => {
    try {
        const { fullName, fatherName, examRollNumber, registrationNumber, email, phoneNumber, newPassword } = req.body;

        // Validate if all required fields are provided
        if (!fullName || !fatherName || !examRollNumber || !registrationNumber || !email || !phoneNumber || !newPassword) {
            return res.status(400).json({
                status: 400,
                message: "All fields are required."
            });
        }

        // Find the user based on the provided details
        const user = await User.findOne({
            fullName,
            fatherName,
            examRollNumber,
            registrationNumber,
            email,
            phoneNumber
        });

        // Check if the user exists
        if (!user) {
            return res.status(404).json({
                status: 404,
                message: "User not found. Please provide correct details."
            });
        }

        // Update user's password
        user.password = newPassword
        await user.save({ validateBeforeSave: false })

        return res.status(200).json({
            status: 200,
            message: "Password updated successfully."
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: "Internal server error occurred on forget password controller.",
            error
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
                    message: "Email is already registered"
                });
            }
            if (phoneNumber !== undefined && existingUser.phoneNumber === phoneNumber) {
                return res.status(409).json({
                    status: 409,
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
                message: "No fields provided for update."
            });
        }

        // Perform the update operation
        const updatedUser = await User.findByIdAndUpdate(userId, updateFields, { new: true });

        if (!updatedUser) {
            return res.status(404).json({
                status: 404,
                message: "User not found."
            });
        }

        // Return success response with updated user data
        return res.status(200).json({
            status: 200,
            message: "Student data updated successfully.",
            user: updatedUser
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: "Internal server error occurred in updateProfile Controller",
            error
        });
    }
};



const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body

        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                status: 400,
                message: "Old Password & New Password are required"
            })
        }

        if (oldPassword === newPassword) {
            return res.status(401).json({
                status: 401,
                message: "Old Password & New Password Can not be Same"
            })
        }

        const user = await User.findById(req.user?._id)

        const isOldPasswordCorrect = await user.isPasswordCorrect(oldPassword)

        if (!isOldPasswordCorrect) {
            return res.status(400)
                .json({
                    status: 400,
                    message: "Invalid Old Password"
                })
        }

        user.password = newPassword
        await user.save({ validateBeforeSave: false })

        return res.status(200)
            .json({
                status: 200,
                message: "Password Changed Successfully"
            })
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: "Internal server error occurred in changePassword Controller",
            error
        });
    }
}



const getCurrentUser = (req, res) => {
    try {
        return res.status(200)
            .json({
                status: 200,
                message: "Current User Fetched Successfully",
                user: req.user
            })
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: "Internal server error occurred in getCurrentUser Controller",
            error
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
                message: "User Logged Out"
            })
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: "Internal server error occurred in logout Controller",
            error
        });
    }

}








export { home, registerUser, loginUser, forgetPassword, updateProfile, changePassword, getCurrentUser, logout }