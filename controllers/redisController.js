import { Redis } from "ioredis";
import { redisClient } from "../app.js";
import { connectToDatabase, checkMongoDbConnection } from "./dbControllers.js";
import {errorDataModel, apiKeyDataModel} from "../model/MongoData.js";

/**
 * Connect to Redis server
 * @returns Redis client
 */
const connectToRedis = async () => {
    const redisClient = new Redis({
        password: process.env.REDIS_CLOUD_PASSWORD,
        host: process.env.REDIS_CLOUD_HOSTNAME,
        port: process.env.REDIS_CLOUD_PORT,
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
 * Function to read to data from MongoDb collections and sync the redis cache.
 * Data is read and written in batches so redis can handle data size comfortably.
 */
const cacheSyncWithDb = async (key, dataModel) => {
    const batchSize = 10; // Number of documents to fetch per batch

    // Check if redis is connected and reconnect if it is not
    if (!isRedisConnected()) {
        const redisClient = await connectToRedis();
    }
    
    try {
        // check if mongoDb is connected
        if (! await checkMongoDbConnection()) {
            await connectToDatabase();
        }

        const totalErrorDocuments = await dataModel.countDocuments({});
        let offset = 0;

        while (offset < totalErrorDocuments) {
            const findresults = await dataModel.find({}, { _id: 0 }).skip(offset).limit(batchSize).exec();

            for (let document of findresults) {
                await writeDataToCache(document, key);
            }

            offset += batchSize;
        }
        
    } catch(error) {
        console.log(error.message);
    }
}

/**
 * Function fetches data from redis, parses it from a JSON string to an array.
 * The new data point is pushed to the array and the entire array written to redis.
 * @param {*} data JSON data with the posted ill-formatted data
 * @param {*} key redis data key for fetching data from redis
 */
const writeDataToCache = async (data, key) => {

    // Check if redis is connected and reconnect if it is not
    if (!isRedisConnected()) {
        let redisClient = await connectToRedis();
    }
    
    try {
        let cachedData = await redisClient.get(key);

        if (!cachedData) {
            await setKeyName(key);
            await setKeyTTL(key);
            cachedData = await getCacheData(key);
        }
        
        let cachedDataArray = JSON.parse(cachedData);

        // Push the new data into the array
        cachedDataArray.push(data);

        // Convert the modified array back to a JSON string
        const updatedDataString = JSON.stringify(cachedDataArray);

        // Update the Redis key with the new JSON string
        await redisClient.set(key, updatedDataString);
    } catch(error) {
        console.log(error.message);
    }
}

/**
 * Set a key name in redis. This will be used for storing server cache data
 */
const setKeyName = async (key) => {
    redisClient.set(key, JSON.stringify([]));
}

/**
 * Set a key time-to-live in redis. The key will expire after the set time.
 * Redis will remove the key-value pair after the key expiration time elapses.
 */
const setKeyTTL = async (key) => {
    var TTL_SECONDS = 0;

    switch(key) { 
        case process.env.API_HASH_CACHE_NAME:
            TTL_SECONDS = 43200;
            await redisClient.expire(key, TTL_SECONDS);
            break;
        case process.env.ERROR_CACHE_NAME:
            TTL_SECONDS = 86400;
            await redisClient.expire(key, TTL_SECONDS);
            break;
        default:
          break;
      }
}

/**
 * 
 * @returns data from redis for the cache key name
 */
const getCacheData = async (key) => {
    return redisClient.get(key);
}

/**
 * Check if a data key exists in redis
 * @returns bool that represents if the given key exists in redis
 */
const keyExists = async (key) => {
    const cachedData = await getCacheData(key);
    
    if (!cachedData) {
        return false;
    }

    return true;
}

/**
 * Delete key from the redis cache
 */
const clearCacheKey = async (key) => {
    try {
        await redisClient.del(key);
        console.log("Error data cleared from the cache");
    } catch(error) {
        console.log(error.message);
    }
}

/**
 * Delete the given value from the redis cache
 * @param {*} valueToRemove 
 */
const deleteSpecificValue = async (valueToRemove) => {
    try {
        let cachedData = await redisClient.get(process.env.API_HASH_CACHE_NAME);
        const currentJsonObj = JSON.parse(cachedData);

        // Filter out the item you want to remove
        const updatedJsonObj = currentJsonObj.filter(item => item.data !== valueToRemove.data);
        
        // Serialize the modified JavaScript object back into a JSON strin
        const updatedJsonValue = JSON.stringify(updatedJsonObj);

        // Update the Redis key with the new JSON string
        await redisClient.set(process.env.API_HASH_CACHE_NAME, updatedJsonValue);
        console.log('Removed the API key from Redis.');
    } catch(error) {
        console.log(error.message);
    }
}

export {connectToRedis, cacheSyncWithDb, writeDataToCache, clearCacheKey, keyExists, isRedisConnected, setKeyName, setKeyTTL, getCacheData, deleteSpecificValue}
