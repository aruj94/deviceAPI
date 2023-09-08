import Express from "express";
import cors from 'cors'
import dotenv from 'dotenv'
import { connectToRedis } from "./controllers/redisController.js";
import ApiRouters from "./routes/apiRoutes.js";
import { initialCacheSyncWithDb } from "./controllers/redisController.js";
import { connectToDatabase } from "./controllers/dbControllers.js";
import { errorDataModel, apiKeyDataModel } from "./model/MongoData.js";

const app = Express();
dotenv.config();

const PORT = process.env.PORT || 3000;

const redisClient = await connectToRedis();
await connectToDatabase();

app.use(Express.json());
app.use(cors());

app.use("/api", ApiRouters);

await initialCacheSyncWithDb(process.env.ERROR_CACHE_NAME, errorDataModel);
await initialCacheSyncWithDb(process.env.API_HASH_CACHE_NAME, apiKeyDataModel);
app.listen(PORT);


export {redisClient}