import { Redis } from "ioredis";
import { redis } from "../app.js";

/**
 * Connect to Redis server
 * @returns Redis client
 */
const connectToRedis = async () => {
    const redis = new Redis({
        host: 'localhost',
        port: process.env.REDIS_PORT || 6379,
    });

    redis.on('error', (error) => {
        console.error('Redis connection error:', error);
    });

    return redis;
}

/**
 * Check if an IP violates the rate limit. If so then send an error response.
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

        const currentCount = await redis.incr(ipAddress);
        console.log(`Current count: ${currentCount}`);

        if (currentCount === 1) {
            // Set an expiry time for the Redis key
            await redis.expire(ipAddress, WINDOW_SECONDS);
        }

        if (currentCount > RATE_LIMIT) {
            return res.status(429).json({ error: 'Rate limit exceeded' });
        }

        next();
    } catch (error) {
        console.error('Error connecting to Redis:', error);
        // Handle the Redis connection error and respond to the client
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export {connectToRedis, checkRateLimit}