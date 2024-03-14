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
        console.error("Error requesting LOR:", error);
        return res.status(500).json({ message: "Internal server error on requestLOR Controller." });
    }
};





export { requestLOR }