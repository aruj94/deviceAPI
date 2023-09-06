import { Redis } from "ioredis";
import { redisClient } from "../app.js";
import { connectToDatabase, checkMongoDbConnection } from "./dbControllers.js";
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
 * Check if redis connection works
 */
const isRedisConnected = async () => {
    redisClient.ping().then((result) => {
        if (result === 'PONG') {
            return true
        } else {
            return false
        }
    })
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

    // Check if redis is connected and reconnect if it is not
    if (!isRedisConnected()) {
        const redisClient = await connectToRedis();
    }

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

    // Check if redis is connected and reconnect if it is not
    if (!isRedisConnected()) {
        const redisClient = await connectToRedis();
    }

    try {
        // check if mongoDb is connected
        if (! await checkMongoDbConnection()) {
            await connectToDatabase();
        }

        const findresult = await errorData.find({}, { _id: 0 });
        await redisClient.set(process.env.CACHE_NAME, JSON.stringify(findresult));
    } catch(error) {
        console.log(error.message);
    }
}

/**
 * Function fetches data from redis, parses it from a JSON string to an array.
 * The new data point is pushed to the array and the entire array written to redis.
 * @param {*} errorData JSON data with the posted ill-formatted data
 */
const writeToCache = async (errorData) => {

    // Check if redis is connected and reconnect if it is not
    if (!isRedisConnected()) {
        const redisClient = await connectToRedis();
    }
    
    try {
        let cachedData = await redisClient.get(process.env.CACHE_NAME);

        if (!cachedData) {
            await setKeyName();
            cachedData = await getCacheData();
        }
        
        let cachedDataArray = JSON.parse(cachedData);

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
 * Set a key name in redis. This will be used for storing server cache data
 */
const setKeyName = async () => {
    redisClient.set(process.env.CACHE_NAME, JSON.stringify([]));
}

/**
 * 
 * @returns data from redis for the cache key name
 */
const getCacheData = async () => {
    return redisClient.get(process.env.CACHE_NAME);
}

/**
 * Check if a key exists in redis
 * @returns bool that represents if the given key exists in redis
 */
const keyExists = async () => {
    const cachedData = await getCacheData();
    if (!cachedData) {
        return true
    }

    return false;
}

/**
 * Delete key from the redis cache
 */
const clearCacheKey = async () => {
    try {
        await redisClient.del(process.env.CACHE_NAME);
        console.log("Error data cleared from the cache");
    } catch(error) {
        console.log(error.message);
    }
}

export {connectToRedis, checkRateLimit, initialCacheSyncWithDb, writeToCache, clearCacheKey, keyExists}