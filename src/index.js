import dotenv from "dotenv";
dotenv.config()
import app from "./app.js";
import connectDB from "./db/dbConnection.js";





app.listen(process.env.PORT, () => {
    console.log(`Server is Running on ${process.env.PORT}`)
})

connectDB()