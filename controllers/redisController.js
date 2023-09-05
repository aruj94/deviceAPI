import { Redis } from "ioredis";
import { redisClient } from "../app.js";
import { connectToDatabase, closeDbConnection } from "./dbControllers.js";
import errorData from "../model/errorData.js";

/**
 * Connect to Redis server
 * @returns Redis client
 */
const connectToRedis = async () => {
    const redisClient = new Redis({
        host: 'localhost',
        port: process.env.REDIS_PORT || 6379,
    });

    redisClient.on('error', (error) => {
        console.error('Redis connection error:', error);
    });

    return redisClient;
}

/**
 * Check if an IP violates the rate limit. If so then send an error response.
 * Token bucket algorithm is used for rate limiting.
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
const checkRateLimit = async (req, res, next) => {
    const RATE_LIMIT = 100;
    const WINDOW_SECONDS = 60;

    try {
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const key = `rate_limit:${ipAddress}`;

        // Check if the bucket exists in Redis, if not, create it
        const exists = await redisClient.exists(key);

        if (!exists) {
            await redisClient.hset(key, 'tokens', RATE_LIMIT);
            await redisClient.expire(key, WINDOW_SECONDS);
        }

        const tokens = await redisClient.hget(key, 'tokens');
        if (tokens > 0) {
            // Decrement the token count and proceed
            await redisClient.hset(key, 'tokens', tokens - 1);
            next();
        } else {
            // No tokens left, return a rate limit exceeded response
            res.status(429).json({ error: 'Rate limit exceeded' });
        }
    } catch (error) {
        console.error('Error connecting to Redis:', error);
        // Handle the Redis connection error and respond to the client
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * Function to read to data from MongoDb collection and sync the redis cache
 */
const initialCacheSyncWithDb = async () => {
    try {
        await connectToDatabase();
        const findresult = await errorData.find({}, { _id: 0 });
        await redisClient.set(process.env.CACHE_NAME, JSON.stringify(findresult));
    } catch(error) {
        console.log(error.message);
    } finally {
        await closeDbConnection();
    }
}

/**
 * Function fetches data from redis, parses it from a JSON string to an array.
 * The new data point is pushed to the array and the entire array written to redis.
 * @param {*} errorData JSON data with the posted ill-formatted data
 */
const writeToCache = async (errorData) => {
    try {
        let cachedData = await redisClient.get(process.env.CACHE_NAME);
        const cachedDataArray = JSON.parse(cachedData);

        // Push the new data into the array
        cachedDataArray.push(errorData);

        // Convert the modified array back to a JSON string
        const updatedDataString = JSON.stringify(cachedDataArray);

        // Update the Redis key with the new JSON string
        await redisClient.set(process.env.CACHE_NAME, updatedDataString);
    } catch(error) {
        console.log(error.message);
    }
}

/**
 * Delete key from the redis cache
 */
const clearCacheKey = () => {
    try {
        redisClient.del(process.env.CACHE_NAME);
        console.log("Error data cleared from the cache");
    } catch(error) {
        console.log(error.message);
    }
}

export {connectToRedis, checkRateLimit, initialCacheSyncWithDb, writeToCache, clearCacheKey}