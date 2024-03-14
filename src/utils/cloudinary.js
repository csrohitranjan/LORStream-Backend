import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();



cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
    secure: true,
});

const uploadOnCloudinary = async (pdfFilePath, originalFilename) => {
    try {
        if (!pdfFilePath) return null;

        // Specify the public_id to use the original filename
        const response = await cloudinary.uploader.upload(pdfFilePath, {
            resource_type: 'auto',
            public_id: originalFilename
        });

        // File uploaded successfully, Now Delete that File from Local
        fs.unlinkSync(pdfFilePath)
        return response;
    } catch (error) {
        console.log("File Upload Failed on Cloudinary");
        fs.unlinkSync(pdfFilePath)
        return null;
    }
};





export { uploadOnCloudinary }