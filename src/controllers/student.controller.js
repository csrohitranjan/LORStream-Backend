import { Lor } from "../models/lor.model.js";


const requestLOR = async (req, res) => {
    try {
        const { companyName, companyAddress } = req.body;
        const user = req.user;

        if (!(companyName && companyAddress)) {
            return res.status(400).json({
                message: "Company Name and Company Address is required"
            })
        }

        // Check if user profile has necessary details
        if (!user.email) {
            return res.status(400).json({ message: "Update Email in your profile" });
        } else if (!user.currentSemester) {
            return res.status(400).json({ message: "Update Current Semester in your profile" });
        }

        // Create LOR document
        const lor = new Lor({
            user: user._id,
            companyName: companyName,
            companyAddress: companyAddress
        });

        // Save LOR document
        await lor.save();

        return res.status(200).json({
            message: "LOR requested successfully",
            companyName, companyAddress
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: "Internal server error on requestLOR Controller.",
            error
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
            userLors
        })
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: "Internal Server Error on getAllLorsofLoggedInUser Controller",
            error
        });
    }
};





export { requestLOR, getAllLorsOfLoggedInUser }