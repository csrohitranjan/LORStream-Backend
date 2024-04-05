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
    res.status(200).send("<h1>Welcome to College ERP Project</h1>");
});


app.use("/api/v2/users", userRouter);



export default app;