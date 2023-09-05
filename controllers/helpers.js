import { connectToDatabase, closeDbConnection } from "./dbControllers.js";
import errorData from "../model/errorData.js";
import { redisClient } from "../app.js";
import { writeToCache, clearCacheKey, initialCacheSyncWithDb } from "./redisController.js";

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
    const newdata = new errorData(errorDataJson);

    try {
        await connectToDatabase();
        const savedData = await newdata.save();
        console.log("bad data saved to database\n", savedData);

        await writeToCache(errorDataJson);
    } catch(error) {
        console.log(error.message);
    } finally {
        await closeDbConnection();
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
        let cachedData = await redisClient.get('errorData');

        if (cachedData) {
            const findresult = JSON.parse(cachedData);
            
            for (var i in findresult) {
                error_msg.push(findresult[i]["data"])
            }
        } else {
            await connectToDatabase();
            const findresult = await errorData.find({}, { _id: 0 });

            for (var i in findresult) {
                error_msg.push(findresult[i]["data"])
            }
            await closeDbConnection();
            
        }

        res.status(200).json({"errors": error_msg});
        console.log("sent error data\n", {"errors": error_msg})

        // sync cache with database since cahce is empty
        await initialCacheSyncWithDb();

    } catch(error) {
        console.log(error.message);
    }
}

/**
 * Clear error data from the database and redis cahce. 
 * Respond abck to the client
 * @param {*} res send back to the client
 */
async function deleteErrorData(res) {
    try{
        await connectToDatabase();
        await errorData.deleteMany({});

        res.status(200).json({"message": "Error buffer cleared successfully"});
        console.log("Error data cleared from the database")

        clearCacheKey();
    } catch(error) {
        console.log(error.message);
    } finally {
        await closeDbConnection();
    }
}

export { getErrorData, deleteErrorData, checkJsonReqFormat, checkOvertemperature }