import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import dotenv from "dotenv";
dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log("DATABASE CONNECTED !!!")
    } catch (error) {
        console.log("Database Cnnection Failed", error)
    }
}


export default connectDB;