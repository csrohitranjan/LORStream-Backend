import { Lor } from "../models/lor.model.js";
import { sendMail } from "../utils/sendMail.js"


const requestLOR = async (req, res) => {
    try {
        const { companyName, companyAddress } = req.body;
        const user = req.user;

        if (!(companyName && companyAddress)) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "Company Name and Company Address is required"
            })
        }

        // Check if user profile has necessary details
        if (!user.email) {
            return res.status(400).json({ message: "Update Email in your profile" });
        } else if (!user.currentSemester) {
            return res.status(400).json({ message: "Update Current Semester in your profile" });
        } else if (!user.gender) {
            return res.status(400).json({ message: "Update Gender in your profile" });
        }

        // Create LOR document
        const lor = new Lor({
            user: user._id,
            companyName: companyName,
            companyAddress: companyAddress
        });

        // Save LOR document
        await lor.save();

        const mailOptions = {
            from: '"College ERP" <rrcovid2019@gmail.com>',
            to: user.email,
            subject: '📝 Confirmation of LOR Request',
            html: `
            <div style="font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0px 0px 10px 0px rgba(0,0,0,0.1);">
                <div style="background-color: #007bff; color: #ffffff; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="font-size: 28px; margin: 0;">🎓 College ERP</h1>
                </div>
                <div style="padding: 20px;">
                    <h4 style="margin-top: 0;">Dear ${user.fullName},</h4>
                    <p style="font-size: 16px; margin-bottom: 10px;">Your request for a Letter of Recommendation (LOR) has been received and is being processed. Please find below the details you provided:</p>
                    <ul style="font-size: 16px; margin-top: 0;">
                        <li><strong>Company Name:</strong> ${companyName}</li>
                        <li><strong>Company Address:</strong> ${companyAddress}</li>
                    </ul>
                    <p style="font-size: 16px; margin-top: 10px;">Our team will work on preparing the LOR for you. You will receive another email once it's ready for your review and download.</p>
                    <p style="font-size: 16px; margin-top: 10px;">If you have any questions or need further assistance, feel free to contact our support team.</p>
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
            message: "LOR requested successfully",
            companyName, companyAddress
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal server error on requestLOR Controller.",
            error: error.message
        });
    }
};



// Controller to get all LORs of the logged-in user
const getAllLorsOfLoggedInUser = async (req, res) => {
    try {
        // Retrieve the logged-in user's ID from the authentication token
        const userId = req.user._id; // Assuming the authenticated user's ID is available in req.user

        // Query the database for all LORs associated with the logged-in user
        const userLors = await Lor.find({ user: userId });

        // Return the list of LORs as a response
        return res.status(200).json({
            status: 200,
            success: true,
            userLors
        })
    } catch (error) {
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal Server Error on getAllLorsofLoggedInUser Controller",
            error: error.message
        });
    }
};





export { requestLOR, getAllLorsOfLoggedInUser }