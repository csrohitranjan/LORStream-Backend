import dotenv from "dotenv";
import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";


dotenv.config();


cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
    secure: true,
});

const uploadOnCloudinary = async (pdfFilePath, originalFilename) => {
    if (!pdfFilePath) return null;

    try {
        const response = await cloudinary.uploader.upload(pdfFilePath, {
            resource_type: 'auto',
            public_id: originalFilename
        });
        return response;
    } catch (error) {
        console.log("File Upload Failed on Cloudinary:", error);
        return null;
    } finally {
        try {
            fs.unlinkSync(pdfFilePath);
            console.log("Local File Deleted Successfully");
        } catch (error) {
            console.log("Error Deleting Local File:", error);
        }
    }
};



export { uploadOnCloudinary };
