import { getErrorData, deleteErrorData, checkJsonReqFormat, checkOvertemperature } from "./helpers.js";

const initialMessage = (req, res) => {
    res.status(200).send('Welcome to megapack test API');
}

const getData = async (req, res) => {
    try{
        await getErrorData(res);
    } catch(error) {
        res.status(404).json({ message: error.message });
    }
}

const deleteData = async (req, res) => {
    try{
        await deleteErrorData(res);
    } catch(error) {
        res.status(404).json({ message: error.message });
    }
}

const postData = async (req, res) => {
    const contentType = req.get('Content-Type');
    
    // Check request content type is JSON
    if (contentType === 'application/json') {
        try {
            if(!await checkJsonReqFormat(req.body)) {
                return res.status(400).json({ "error": "bad request" })
            }

            const tempJson = checkOvertemperature(req.body, res);
            res.status(200).json(tempJson);
            
        } catch (error){
            console.log(error)
            return res.status(500).json({ "error": 'Internal Server Error' });
        }
    } else {
        res.status(415).json({ "error": 'Unsupported Request Type' });
    }        
}

export { initialMessage, getData, deleteData, postData }
