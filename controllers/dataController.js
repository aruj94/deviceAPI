import { getErrorData, deleteErrorData, checkJsonReqFormat, checkOvertemperature } from "../utils/helpers.js";

/**
 * An initial welcome message is sent back to the client
 */
const initialMessage = (req, res) => {
    res.status(200).send('Welcome to megapack test API');
}

/**
 * Error data saved in mongoDb is retreived and is sent back to the user
 */
const getErrorsCollectionData = async (req, res) => {
    try{
        await getErrorData(res);
    } catch(error) {
        res.status(404).json({ message: error.message });
    }
}

/**
 * In this functionwe go and delete all the incorrectly formatted error strings saved in mongoDb and redis.
 */
const deleteData = async (req, res) => {
    try{
        await deleteErrorData(res);
    } catch(error) {
        res.status(404).json({ message: error.message });
    }
}

/**
 * In this function we test if the request input data is of the correct format or not.
 * If data is incorrectly formatted then appropriate responses are sent back to the client.
 * Incorrectly formatted data strings are further saved into a mongoDb cluster for future usage.
*/
const postErrorsData = async (req, res) => {
    const contentType = req.get('Content-Type');
    
    // Check request content type is JSON
    if (contentType === 'application/json') {
        try {
            if(!await checkJsonReqFormat(req.body)) {
                return res.status(400).json({ "error": "bad request" })
            }

            const tempJson = checkOvertemperature(req.body);
            res.status(200).json(tempJson);
            
        } catch (error){
            console.log(error)
            return res.status(500).json({ "error": 'Internal Server Error' });
        }
    } else {
        res.status(415).json({ "error": 'Unsupported Request Type' });
    }        
}

export { initialMessage, getErrorsCollectionData, deleteData, postErrorsData }
