import { checkApiHashData } from "../utils/helpers.js";

/**
 * Middleware is desgined to check if the request header has the correct key-value pair
 * with the right API key. Unauthorized access requests are denied.
 * @param req client request
 * @param res respond back to client in case of authentication issues
 * @param next after authentication move to the next middleware in the route
 */
const authentication = async (req, res, next) => {

    try {
        const apikey = req.headers.authorization;
        
        // check if provided API key hash exists in cache or database
        const keyAuthenticated = await checkApiHashData(apikey, res);
        
        if (!apikey || !keyAuthenticated) {
            return res.status(401).json({ error: "Unauthorized: Invalid API key provided" });
        }

        next();

    } catch (error) {
        console.log(error);
    }
}

export {authentication}