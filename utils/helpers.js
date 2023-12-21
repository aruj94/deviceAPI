import { connectToDatabase, checkMongoDbConnection } from "../controllers/dbControllers.js";
import {errorDataModel, apiKeyDataModel} from "../model/MongoData.js";
import { redisClient } from "../app.js";
import { writeDataToCache, clearCacheKey, initialCacheSyncWithDb, keyExists, isRedisConnected, connectToRedis, setKeyName } from "../controllers/redisController.js";
import bcrypt from 'bcrypt'; 

const stringPattern = /^(\d+):(\d+):'Temperature':(-?\d+(\.\d+)?)$/;

/**
 * Function checks if the given JSON request data string pattern is correct or not
 * @param {*} request client request body
 * @returns boolean
 */
async function checkJsonReqFormat(request) {
    // Check if the JSON request has the correct key
    if (!("data" in request)) {
        return false
    }
    
    const pattern = stringPattern.test(request["data"]);

    // in case pattern is not correct, write to database
    if (!pattern) {
        await saveErrorData(request);
    }

    return pattern
}

/**
 * Check for device over temperature
 * @param {*} request client request body
 * @returns JSON accordingly
 */
function checkOvertemperature(request) {
    let matches = request["data"].match(stringPattern);

    const temp = matches[3];

    if (temp >= 90) {
        const device_id = matches[1];
        const currentDate = new Date();

        const currentYear = String(currentDate.getFullYear());
        const currentDayOfMonth = String(currentDate.getDate()).padStart(2, '0');
        const currentMonth = String(currentDate.getMonth()+1).padStart(2, '0');
        const currentHour = String(currentDate.getHours()).padStart(2, '0');
        const currentMinutes = String(currentDate.getMinutes()).padStart(2, '0');
        const currentSeconds = String(currentDate.getSeconds()).padStart(2, '0');
        const timestamp = currentYear + '/' + currentMonth + '/' + currentDayOfMonth + ' ' + currentHour + ":" + currentMinutes + ":" + currentSeconds;

        return {"overtemp": true, "device_id": device_id, "formatted_time": timestamp}
    }

    return {"overtemp": false}
}

/**
 * Save the incorrectly formatted data to MongoDb database and redis cache
 * @param {*} req client request body
 */
async function saveErrorData(req) {

    const errorDataJson = {data: req["data"]};
    const newdata = new errorDataModel(errorDataJson);

    try {
        // check if mongoDb is connected
        if (! await checkMongoDbConnection()) {
            await connectToDatabase();
        }

        const savedData = await newdata.save();
        console.log("bad data saved to database\n", savedData);

        await writeDataToCache(errorDataJson, process.env.ERROR_CACHE_NAME);
    } catch(error) {
        console.log(error.message);
    }
}

/**
 * Save the hashed API key to both the database and redis cache
 * @param {*} key hashed value of the API key
 */
async function saveApiKeysHash(key) {
    const newExpirationTimestamp = new Date();
    newExpirationTimestamp.setDate(newExpirationTimestamp.getDate() -1 ); // Set to expire in 30 days

    const keyHashJson = {data: key, expirationTimestamp: newExpirationTimestamp};
    const newdata = new apiKeyDataModel(keyHashJson);

    try {
        // check if mongoDb is connected
        if (! await checkMongoDbConnection()) {
            await connectToDatabase();
        }

        const savedData = await newdata.save();
        console.log("api key data saved to database\n", savedData);

        // Check if redis is connected and reconnect if it is not
        if (!isRedisConnected()) {
            const redisClient = await connectToRedis();
        }

        await setKeyName(process.env.API_HASH_CACHE_NAME);
        await writeDataToCache(keyHashJson, process.env.API_HASH_CACHE_NAME);

    } catch(error) {
        console.log(error.message);
    }
}

/**
 * Error data is sent to client from the redis cache server or the 
 * database if the cache server is empty.
 * @param {*} res send back to the client
 */
async function getErrorData(res) {
    
    let error_msg = [];

    try{
        // check if key exists in redis
        if (keyExists(process.env.ERROR_CACHE_NAME)) {
            let cachedData = await redisClient.get(process.env.ERROR_CACHE_NAME);
            const findresult = JSON.parse(cachedData);
            
            for (var i in findresult) {
                error_msg.push(findresult[i]["data"])
            }
        } else {
            // check if mongoDb is connected
            if (! await checkMongoDbConnection()) {
                await connectToDatabase();
            }

            const findresult = await errorDataModel.find({}, { _id: 0 });

            for (var i in findresult) {
                error_msg.push(findresult[i]["data"])
            }
            
            // sync cache with database since cahce is empty
            await initialCacheSyncWithDb(process.env.ERROR_CACHE_NAME, errorDataModel);
        }

        res.status(200).json({"errors": error_msg});
        console.log("sent error data\n", {"errors": error_msg})

    } catch(error) {
        console.log(error.message);
    }
}

/**
 * API hash data is sent to client from the redis cache server 
 * or the database if the cache server is empty.
 * @param {*} res send back to the client
 */
async function getApiHashData(res) {
    
    let api_array = [];

    try{
        // check if key exists in redis
        if (keyExists(process.env.API_HASH_CACHE_NAME)) {
            let cachedData = await redisClient.get(process.env.API_HASH_CACHE_NAME);
            const findresult = JSON.parse(cachedData);
            
            for (var i in findresult) {
                api_array.push(findresult[i])
            }
        } else {
            // check if mongoDb is connected
            if (! await checkMongoDbConnection()) {
                await connectToDatabase();
            }

            const findresult = await apiKeyDataModel.find({}, { _id: 0 });

            for (var i in findresult) {
                api_array.push(findresult[i])
            }
            
            // sync cache with database since cahce is empty
            await initialCacheSyncWithDb(process.env.API_HASH_CACHE_NAME, apiKeyDataModel);
        }

        return api_array;

    } catch(error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

/**
 * Check if the provided API key hash is a part of other stored hash values and it has not expired.
 * bcrypt compare function is used to carry this functionality out
 * @param {*} clientAPIKey plain text value of provided API key
 * @param {*} res response to the client
 * @returns bool indicating if the API hash exists or not
 */
async function checkApiHashData(clientAPIKey, res) {
    
    try {
        // get an array of all api hash values
        const ApiHashData = await getApiHashData(res);

        // Get todays date
        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate());

        // check if the given client API Key exists or not
        for (let i = 0; i < ApiHashData.length; i++) {
            if (bcrypt.compareSync(clientAPIKey, ApiHashData[i]["data"])) {
                
                const ApiKeyExpiration = ApiHashData[i]["expirationTimestamp"];
                const ApiKeyExpirationDate = new Date(ApiKeyExpiration);
                
                if (currentDate > ApiKeyExpirationDate) {
                    return false
                }
                
                return true
            }
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

/**
 * Clear error data from the database and redis cahce. 
 * Respond abck to the client
 * @param {*} res send back to the client
 */
async function deleteErrorData(res) {
    try{
        // check if mongoDb is connected
        if (! await checkMongoDbConnection()) {
            await connectToDatabase();
        }

        await errorDataModel.deleteMany({});

        res.status(200).json({"message": "Error buffer cleared successfully"});
        console.log("Error data cleared from the database")

        clearCacheKey(process.env.ERROR_CACHE_NAME);
    } catch(error) {
        console.log(error.message);
    }
}

export { getErrorData, deleteErrorData, checkJsonReqFormat, checkOvertemperature, checkApiHashData }