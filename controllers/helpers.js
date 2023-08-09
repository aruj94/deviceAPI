import { connectToDatabase, closeDbConnection } from "./dbControllers.js";
import errorData from "../model/errorData.js";

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
 * Save the incorrectly formatted data to MongoDb database
 * @param {*} req client request body
 */
async function saveErrorData(req) {

    const errorDataJson = {data: req["data"]};
    const newdata = new errorData(errorDataJson);

    try {
        await connectToDatabase();
        const savedData = await newdata.save();
        console.log("bad data saved\n", savedData);

    } catch(error) {
        console.log(error.message);
    } finally {
        await closeDbConnection();
    }
}

/**
 * Send error data from the database to the client
 * @param {*} res send back to the client
 */
async function getErrorData(res) {
    let error_msg = [];

    try{
        await connectToDatabase();
        const findresult = await errorData.find({}, { _id: 0 });

        for (var i in findresult) {
            error_msg.push(findresult[i]["data"])
        }

        res.status(200).json({"errors": error_msg});
        console.log("sent error data\n", {"errors": error_msg})

    } catch(error) {
        console.log(error.message);
    } finally {
        await closeDbConnection();
    }
}

/**
 * Clear error data from the data and respond to the client
 * @param {*} res send back to the client
 */
async function deleteErrorData(res) {
    try{
        await connectToDatabase();
        await errorData.deleteMany({});

        res.status(200).json({"message": "Error buffer cleared successfully"});
        console.log("Error data cleared")

    } catch(error) {
        console.log(error.message);
    } finally {
        await closeDbConnection();
    }
}

export { getErrorData, deleteErrorData, checkJsonReqFormat, checkOvertemperature }