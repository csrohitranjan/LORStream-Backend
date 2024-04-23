import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);

app.use(express.json());
app.use(cookieParser());

// ##############     Routes   #######################

import userRouter from "./routes/user.routes.js";

// ##########      Routes Declaration   ############################

app.get('/', (req, res) => {
    res.status(200).send(`
        <div style="text-align: center;">
            <h1>Welcome to College ERP</h1>
            <p>Developed by Mr. Rohit Ranjan</p>
            <p>😊🎓📚</p>
        </div>
    `);
});


app.use("/api/v1/users", userRouter);



export default app;