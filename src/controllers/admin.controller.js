import { User } from "../models/user.model.js";
import { Lor } from "../models/lor.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { generateReferenceNumber } from "../utils/generateReferenceNumber.js";
import { generatePdfFromTemplate } from "../utils/generatePdfFromTemplate.js";
import fs from "fs";



const registerAsAdmin = async (req, res) => {
    try {
        let { fullName, email, phoneNumber, password } = req.body;

        // Check if any required field is missing
        if (!fullName || !email || !phoneNumber) {
            return res.status(400).json({
                status: 400,
                message: "All fields are required except password."
            });
        }

        // Remove all whitespace characters from these fields
        email = email.replace(/\s+/g, '');
        phoneNumber = phoneNumber.replace(/\s+/g, '').toUpperCase();

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
                message: "Admin already Registered"
            });
        }

        // Determine which field is already registered and return corresponding response
        if (existedUser) {
            if (existedUser.email === email) {
                return res.status(409).json({
                    status: 409,
                    message: "Email is already registered"
                });
            } else {
                return res.status(409).json({
                    status: 409,
                    message: "Phone number is already registered"
                });
            }
        }

        const insertedUser = await User.create({
            fullName,
            fatherName: 'NA',
            classRollNumber: 'NA',
            registrationNumber: 'NA',
            examRollNumber: 'NA',
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
                message: "Something Went Wrong While Registering the Admin"
            });
        }

        return res.status(201).json({
            status: 201,
            message: "Admin Registered Successfully",
            user: createdUser
        });

    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: "Internal Server Error on: registerAsAdmin Controller"
        });
    }
}



const updateLORrequest = async (req, res) => {
    try {
        const lorId = req.params.lorId;

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
                message: "No fields provided for update."
            });
        }

        // Findling LOR
        const lor = await Lor.findById(lorId);

        if (!lor) {
            return res.status(404).json({
                status: 404,
                message: "LOR not found"
            })
        }

        const updatedLor = await Lor.findByIdAndUpdate(lorId, updateFields, { new: true });

        // Return success response with updated Lor data
        return res.status(200).json({
            status: 200,
            message: "Lor data updated successfully.",
            user: updatedLor
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: "Internal server error occurred in updateLORrequest Controller"
        });
    }
}



const approveLORrequest = async (req, res) => {
    try {
        // Extract LOR ID from request parameters
        const lorId = req.params.lorId;

        // Find the LOR and populate the user details
        const lor = await Lor.findById(lorId).populate('user', '-password -refreshToken');

        if (!lor) {
            return res.status(404).json({
                status: 404,
                message: "LOR not found"
            });
        }

        if (lor.status === "approved") {
            return res.status(403).json({
                status: 403,
                message: "Operation declined: LOR already approved"
            });
        }

        if (!lor.recipient) {
            return res.status(403).json({
                status: 403,
                message: "Operation declined: Recipient missing"
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
        const templatePath = './src/templates/templateWithoutRecipientDepartment.html';

        // Path where generated PDF will be Saved
        const pdfFileName = `${nextCount}_${user.examRollNumber}.pdf`; // File name for the PDF
        const outputPath = `./public/${pdfFileName}`;

        // Generate PDF from template and save to outputPath
        await generatePdfFromTemplate(templatePath, templateData, outputPath);
        const uplodedPdf = await uploadOnCloudinary(outputPath, pdfFileName);

        if (!uplodedPdf) {
            console.log("upload File Missing");
        }

        lor.lorPdfLink = uplodedPdf.url;
        lor.status = 'approved';
        lor.approvedBy = 'Admin' // In later I will change this.

        // Save the updated LOR request
        await lor.save();
        // Return success response
        return res.status(200).json({
            status: 200,
            message: "LOR request approved successfully",
            lor
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: 'Internal server error on approveLORrequest controller'
        });
    }
};



const rejectLORrequest = async (req, res) => {
    try {
        const lorId = req.params.lorId;

        // Finding LOR
        const lor = await Lor.findById(lorId);

        if (!lor) {
            return res.status(404).json({
                status: 404,
                message: "LOR not found"
            })
        }

        if (lor.status === "approved") {
            return res.status(403).json({
                status: 404,
                message: "Operation declined. LOR already approved - You can't Reject it"
            });
        }

        if (lor.status === "rejected") {
            return res.status(403).json({
                status: 404,
                message: "Operation declined. LOR already rejected"
            });
        }

        // Update current status to rejected
        lor.status = 'rejected';
        await lor.save({ validateBeforeSave: false });
        return res.status(200).json({
            status: 200,
            message: "LOR request Rejected successfully",
            lor
        })


    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: 'Internal server error on rejectLORrequest Controller'
        });
    }
}



const getAllPendingLOR = async (req, res) => {
    try {
        const pendingLORs = await Lor.find({ status: 'pending' }).populate('user');
        return res.status(200).json({
            status: 200,
            pendingLORs
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: "Internal Server Error on getAllPendingLOR Controller"
        });
    }
};



const getAllApprovedLOR = async (req, res) => {
    try {
        const approvedLORs = await Lor.find({ status: 'approved' }).populate('user');
        return res.status(200).json({
            status: 200,
            approvedLORs
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: "Internal Server Error on getAllApprovedLOR Controller"
        });
    }
};



const getAllRejectedLOR = async (req, res) => {
    try {
        const rejectedLORs = await Lor.find({ status: 'rejected' }).populate('user');
        return res.status(200).json({
            status: 200,
            rejectedLORs
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: "Internal Server Error on getAllApprovedLOR Controller"
        });
    }
}











export { registerAsAdmin, updateLORrequest, approveLORrequest, rejectLORrequest, getAllPendingLOR, getAllApprovedLOR, getAllRejectedLOR }