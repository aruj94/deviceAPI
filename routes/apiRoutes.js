import { initialMessage, getData, deleteData, postData } from "../controllers/dataController.js";
import { Router } from "express";
import authentication from "../middleware/authentication.js";

const router = Router();

router.get('/', initialMessage)
router.get('/errors', authentication, getData )
router.delete('/errors', authentication, deleteData )
router.post('/temp', authentication, postData )

export default router;
