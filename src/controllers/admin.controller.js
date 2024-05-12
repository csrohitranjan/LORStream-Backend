import { User } from "../models/user.model.js";
import { Lor } from "../models/lor.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { uploadOnFirebase } from "../utils/firebase.js";
import { generateReferenceNumber } from "../utils/generateReferenceNumber.js";
import { generatePdfFromTemplate } from "../utils/generatePdfFromTemplate.js";
import fs from "fs";
import { sendMail } from "../utils/sendMail.js"


const registerAsAdmin = async (req, res) => {
    try {
        let { fullName, email, phoneNumber, password } = req.body;

        // Check if any required field is missing
        if (!fullName || !email || !phoneNumber) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "All fields are required except password."
            });
        }

        // Remove all whitespace characters from these fields
        email = email.replace(/\s+/g, '');
        phoneNumber = phoneNumber.replace(/\s+/g, '').toUpperCase();

        // Concatenate fullName and phoneNumber for registrationNumber and examRollNumber
        const registrationNumber = fullName.replace(/\s+/g, '').toUpperCase() + phoneNumber.replace(/\s+/g, '');
        const examRollNumber = fullName.replace(/\s+/g, '').toUpperCase() + phoneNumber.replace(/\s+/g, '').toUpperCase();

        // Set password as last five digits of examRollNumber if not provided
        if (!password) {
            password = phoneNumber.substr(-5); // Extract last five characters
        }


        const existedUser = await User.findOne({
            $or: [{ email }, { phoneNumber }]
        });

        if (existedUser && existedUser.role === 'admin') {
            return res.status(409).json({
                status: 409,
                success: false,
                message: "Admin already Registered"
            });
        }

        // Determine which field is already registered and return corresponding response
        if (existedUser) {
            if (existedUser.email === email) {
                return res.status(409).json({
                    status: 409,
                    success: false,
                    message: "Email is already registered",
                });
            } else {
                return res.status(409).json({
                    status: 409,
                    success: false,
                    message: "Phone number is already registered"
                });
            }
        }

        const insertedUser = await User.create({
            fullName,
            fatherName: 'NA',
            classRollNumber: 'NA',
            registrationNumber,
            examRollNumber,
            programme: 'NA',
            department: 'NA',
            role: 'admin', // Set the role to 'admin'
            email,
            phoneNumber,
            password
        });

        const createdUser = await User.findById(insertedUser._id).select(
            "-password -refreshToken"
        );

        if (!createdUser) {
            return res.status(500).json({
                status: 500,
                success: false,
                message: "Something Went Wrong While Registering the Admin"
            });
        }

        return res.status(201).json({
            status: 201,
            success: true,
            message: "Admin Registered Successfully",
            user: createdUser
        });

    } catch (error) {
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal Server Error on: registerAsAdmin Controller",
            error: error.message
        });
    }
}



const updateLORrequest = async (req, res) => {
    try {
        const { lorId } = req.params;

        const { recipient, recipientDepartment, companyName, companyAddress } = req.body;

        // Update Lor data
        const updateFields = {}; // Initialize an empty object to store fields to update

        if (recipient) {
            updateFields.recipient = recipient;
        }
        if (recipientDepartment) {
            updateFields.recipientDepartment = recipientDepartment;
        }
        if (companyName) {
            updateFields.companyName = companyName;
        }
        if (recipient) {
            updateFields.companyAddress = companyAddress;
        }

        // Check if any field to update is provided
        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "No fields provided for update."
            });
        }

        // Findling LOR
        const lor = await Lor.findById(lorId);

        if (!lor) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "LOR not found"
            })
        }

        const updatedLor = await Lor.findByIdAndUpdate(lorId, updateFields, { new: true });

        // Return success response with updated Lor data
        return res.status(200).json({
            status: 200,
            success: true,
            message: "Lor data updated successfully.",
            user: updatedLor
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: "Internal server error occurred in updateLORrequest Controller",
            error: error.message
        });
    }
}



const approveLORrequest = async (req, res) => {
    try {
        // Extract LOR ID from request parameters
        const { lorId } = req.params;

        // Find the LOR and populate the user details
        const lor = await Lor.findById(lorId).populate('user', '-password -refreshToken');

        if (!lor) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "LOR not found"
            });
        }

        if (lor.status === "approved") {
            return res.status(403).json({
                status: 403,
                success: false,
                message: "Operation declined: LOR already approved"
            });
        }

        if (!lor.recipient) {
            return res.status(403).json({
                status: 403,
                success: false,
                message: "Operation declined: Recipient and Recipent Department (Optional) Missing",
            });
        }

        // Finding user data from that lor
        const { user } = lor;

        // Generate reference number for the LOR
        const { referenceNumber, nextCount } = await generateReferenceNumber(user);
        lor.referenceNumber = referenceNumber;

        // Convert image to base64-encoded string
        const imageBase64 = fs.readFileSync('./src/templates/sxcLogo.jpg', 'base64');

        // Creating an Object that Hold all data of LOR
        const templateData = {
            image: imageBase64, // Add image data to template data
            referenceNumber: referenceNumber,
            recipient: lor.recipient,
            recipientDepartment: lor.recipientDepartment,
            companyName: lor.companyName,
            companyAddress: lor.companyAddress,
            fullName: user.fullName,
            fatherName: user.fatherName,
            classRollNumber: user.classRollNumber,
            registrationNumber: user.registrationNumber,
            examRollNumber: user.examRollNumber,
            programme: user.programme,
            currentSemester: user.currentSemester,
            // Add other LOR request details here...
        };

        // Path of HTML template file
        let templatePath;
        if (user.gender === 'Male') {
            if (templateData.recipientDepartment !== undefined) {
                templatePath = './src/templates/csLORtemplateWithRecipientDepartment_Male.html'
            } else {
                templatePath = './src/templates/csLORtemplateWithoutRecipientDepartment_Male.html'
            }
        } else if (user.gender === 'Female') {
            if (templateData.recipientDepartment !== undefined) {
                templatePath = './src/templates/csLORtemplateWithRecipientDepartment_Female.html'
            } else {
                templatePath = './src/templates/csLORtemplateWithoutRecipientDepartment_Female.html'
            }
        }

        // Path where generated PDF will be Saved
        const pdfFileName = `${nextCount}_${user.examRollNumber}.pdf`; // File name for the PDF
        const outputPath = `./public/${pdfFileName}`;

        // Generate PDF from template and save to outputPath
        await generatePdfFromTemplate(templatePath, templateData, outputPath);

        // ##########   PDF Uploading to Cloud -- START ###########

        // Upload PDF to Cloudinary Cloud
        // const uplodedPdf = await uploadOnCloudinary(outputPath, pdfFileName);

        // Upload PDF to FireBase Cloud
        const uplodedPdf = await uploadOnFirebase(outputPath, pdfFileName);

        // ##########   PDF Uploading to Cloud -- END ###########
        if (!uplodedPdf) {
            console.log("Uploaded PDF File Missing");
        }

        // If File is Uploded Through Clodinary then we have to use this here --> uplodedPdf.url
        lor.lorPdfLink = uplodedPdf;
        lor.status = 'approved';

        const approvingUser = req.user;
        lor.approvedBy = approvingUser.fullName;

        await lor.save();

        const mailOptions = {
            from: '"College ERP" <rrcovid2019@gmail.com>',
            to: user.email,
            subject: '🎉 Your LOR Request Approved!',
            html: `
            <div style="font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0px 0px 10px 0px rgba(0,0,0,0.1);">
             <div style="background-color: #007bff; color: #ffffff; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="font-size: 28px; margin: 0;">🎓 College ERP</h1>
            </div>
            <div style="padding: 20px;">
            <h4 style="margin-top: 0;">Dear ${user.fullName},</h4>
            <p style="font-size: 16px; margin-bottom: 10px;">We are pleased to inform you that your request for a Letter of Recommendation (LOR) has been approved. Below are the details:</p>
            <ul style="font-size: 16px; margin-top: 0;">
                <li><strong>Company Name:</strong> ${lor.companyName}</li>
                <li><strong>Company Address:</strong> ${lor.companyAddress}</li>
                <li><strong>Reference No.:</strong> ${lor.referenceNumber}</li>
            </ul>
            <p style="font-size: 16px; margin-top: 10px;">You can download your Letter of Recommendation (LOR) by clicking the button below:</p>
            <p style="text-align: center;">
                <a href="${lor.lorPdfLink}" style="background-color: #007bff; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px;">Download LOR</a>
            </p>
            <p style="font-size: 16px; margin-top: 20px;">If you have any questions or need further assistance, feel free to contact our support team.</p>
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

        return res.status(200).json({
            status: 200,
            success: true,
            message: "LOR request approved successfully",
            lor
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            success: false,
            message: 'Internal server error on approveLORrequest controller',
            error: error.message
        });
    }
};



const rejectLORrequest = async (req, res) => {
    try {
        const { lorId } = req.params;
        const { reasonOfRejection } = req.body;

        // Finding LOR
        const lor = await Lor.findById(lorId);

        if (!lor) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "LOR not found"
            })
        }

        const { user } = lor;
        // console.log(user);
        const linkedUser = await User.findById(user);
        // console.log("Linked User",linkedUser)
        if (!linkedUser) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "User linked to LOR not found"
            });
        }

        if (lor.status === "approved") {
            return res.status(403).json({
                status: 404,
                success: false,
                message: "Operation declined: LOR already approved - You can't Reject it"
            });
        }

        if (lor.status === "rejected") {
            return res.status(403).json({
                status: 404,
                success: false,
                message: "Operation declined: LOR already rejected"
            });
        }

        // Update current status to rejected & reason of Rejection
        lor.reasonOfRejection = reasonOfRejection;
        lor.status = 'rejected';
        await lor.save({ validateBeforeSave: false });

        const mailOptions = {
            from: '"College ERP" <rrcovid2019@gmail.com>',
            to: linkedUser.email,
            subject: '📬 Update: LOR Request Rejected',
            html: `
            <div style="font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0px 0px 10px 0px rgba(0,0,0,0.1);">
                <div style="background-color: #ff6b6b; color: #ffffff; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="font-size: 28px; margin: 0;">🎓 College ERP</h1>
                </div>
                <div style="padding: 20px;">
                    <h4 style="margin-top: 0;">Dear ${linkedUser.fullName},</h4>
                    <p style="font-size: 16px; margin-bottom: 10px;">We regret to inform you that your request for a Letter of Recommendation (LOR) has been rejected. Below are the details:</p>
                    <ul style="font-size: 16px; margin-top: 0;">
                        <li><strong>Company Name:</strong> ${lor.companyName}</li>
                        <li><strong>Company Address:</strong> ${lor.companyAddress}</li>
                    </ul>
                    <p style="font-size: 16px; margin-top: 10px;">If you have any questions or need further clarification, please don't hesitate to reach out to our support team.</p>
                    <p style="font-size: 16px; margin-top: 20px;">Best regards,<br/>College ERP Team</p>
                </div>
                <div style="background-color: #ff6b6b; color: #ffffff; text-align: center; padding: 10px; border-radius: 0 0 10px 10px;">
                    <p style="font-size: 14px; margin: 0;">Designed and developed by Mr. Rohit Ranjan <a href="https://www.linkedin.com/in/csrohitranjan/" target="_blank"><img src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" alt="LinkedIn" style="width: 15px; vertical-align: middle;"></a></p>
                </div>
            </div>
        </div>
            `
        };

        await sendMail(mailOptions);

        return res.status(200).json({
            status: 200,
            success: true,
            message: "LOR request Rejected successfully",
            lor
        })


    } catch (error) {
        return res.status(500).json({
            status: 500,
            success: false,
            message: 'Internal server error on rejectLORrequest Controller',
            error: error.message
        });
    }
}



const getAllPendingLOR = async (req, res) => {
    try {
        const pendingLORs = await Lor.find({ status: 'pending' }).populate('user', '-password -refreshToken');
        return res.status(200).json({
            status: 200,
            success: true,
            pendingLORs
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal Server Error on getAllPendingLOR Controller",
            error: error.message
        });
    }
};



const getAllApprovedLOR = async (req, res) => {
    try {
        const approvedLORs = await Lor.find({ status: 'approved' }).populate('user', '-password -refreshToken');
        return res.status(200).json({
            status: 200,
            success: true,
            approvedLORs
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal Server Error on getAllApprovedLOR Controller",
            error: error.message
        });
    }
};



const getAllRejectedLOR = async (req, res) => {
    try {
        const rejectedLORs = await Lor.find({ status: 'rejected' }).populate('user', '-password -refreshToken');
        return res.status(200).json({
            status: 200,
            success: true,
            rejectedLORs
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal Server Error on getAllApprovedLOR Controller",
            error: error.message
        });
    }
}



const findLorsByExamRollNumber = async (req, res) => {
    try {
        const { examRollNumber } = req.params;

        // Find the user by examRollNumber
        const user = await User.findOne({ examRollNumber }).select(
            "-password -refreshToken"
        );

        if (!user) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "User not found"
            });
        }

        // Find all LORs associated with the user
        const lors = await Lor.find({ user: user._id });

        return res.status(200).json({
            status: 200,
            success: true,
            message: "User and LORs found successfully",
            user,
            lors
        });

    } catch (error) {
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal Server Error on findLorsByExamRollNumber Controller",
            error: error.message
        });
    }
}



const findUserByExamRollNumber = async (req, res) => {
    const { examRollNumber } = req.params;

    try {
        const user = await User.findOne({ examRollNumber }).select(
            "-password -refreshToken"
        );;

        if (!user) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "User not found"
            });
        }

        // If user found, send the user details
        return res.status(200).json({
            status: 200,
            success: true,
            user,
            message: "User found successfully"
        })
    } catch (error) {
        return res.status(400).json({
            status: 400,
            success: false,
            message: "Insternal Server Error in finUserByExamRollNumber controller",
            error: error.message
        })
    }
}



const updateUserProfileByExamRollNumber = async (req, res) => {
    try {
        const { examRollNumber } = req.params;
        const { fullName, fatherName, classRollNumber, registrationNumber, programme, department, currentSemester, gender, email, phoneNumber } = req.body;

        const user = await User.findOne({ examRollNumber })
        if (!user) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "No user found from provided ExamRollNumber"
            });
        }
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
        if (fullName) {
            updateFields.fullName = fullName;
        }
        if (fatherName) {
            updateFields.fatherName = fatherName;
        }
        if (classRollNumber) {
            updateFields.classRollNumber = classRollNumber;
        }
        if (registrationNumber) {
            updateFields.registrationNumber = registrationNumber;
        }
        if (programme) {
            updateFields.programme = programme;
        }
        if (department) {
            updateFields.department = department;
        }
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
        const updatedUser = await User.findOneAndUpdate({ examRollNumber }, updateFields, { new: true });

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
            message: "Internal server error occurred in updateUserProfileBYExamRollNumber Controller",
            error: error.message
        });
    }
}




export { registerAsAdmin, updateLORrequest, approveLORrequest, rejectLORrequest, getAllPendingLOR, getAllApprovedLOR, getAllRejectedLOR, findLorsByExamRollNumber, findUserByExamRollNumber, updateUserProfileByExamRollNumber }