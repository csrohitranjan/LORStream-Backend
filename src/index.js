import dotenv from "dotenv";
dotenv.config()
import app from "./app.js";
import connectDB from "./db/dbConnection.js";



connectDB()
    .then(() => {
        app.listen(process.env.PORT, () => {
            console.log(`SERVER is Running at ${process.env.PORT}`)
        });
        app.on("error", (error) => {
            console.log("ERROR: ", error)
            throw error;
        })
    });