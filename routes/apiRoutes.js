import { Router } from "express";
import { initialMessage, getErrorsCollectionData, deleteData, postErrorsData } from "../controllers/dataController.js";
import { authentication } from "../middleware/authentication.js";
import { checkRateLimit } from "../controllers/redisController.js";

const router = Router();

// Route to get the initial welcome message
router.get('/', checkRateLimit, initialMessage)

// Route to get all the error data saved in mongodb cluster
router.get('/errors', authentication, checkRateLimit, getErrorsCollectionData )

// Route to delete all the error data from the mongodb collection
router.delete('/errors', authentication, checkRateLimit, deleteData )

// Route to test device temperature data and if the provided data
// string is correctly formatted or not. If not formatted correctly 
// then it is stored in mongoDb for future retreival.
router.post('/temp', authentication, checkRateLimit, postErrorsData )

export default router;