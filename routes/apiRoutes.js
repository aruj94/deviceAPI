import { initialMessage, getData, deleteData, postData } from "../controllers/dataController.js";
import { Router } from "express";
import authentication from "../middleware/authentication.js";

const router = Router();

// Route to get the initial welcome message
router.get('/', initialMessage)

// Route to get all the error data saved in mongodb cluster
router.get('/errors', authentication, getData )

// Route to delete all the error data from the mongodb collection
router.delete('/errors', authentication, deleteData )

// Route to test device temperature data and if the provided data
// string is correctly formatted or not. If not formatted correctly 
// then it is stored in mongoDb for future retreival.
router.post('/temp', authentication, postData )

export default router;
