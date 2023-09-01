import Express from "express";
import cors from 'cors'
import dotenv from 'dotenv'
import { connectToRedis } from "./controllers/redisController.js";
import ApiRouters from "./routes/apiRoutes.js";

const app = Express();
dotenv.config();

const PORT = process.env.PORT || 3000;

const redis = await connectToRedis();

app.use(Express.json());
app.use(cors());

app.use("/api", ApiRouters);

app.listen(PORT)

export {redis}