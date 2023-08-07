import Express from "express";
import cors from 'cors'
import dotenv from 'dotenv'
import ApiRouters from "./routes/apiRoutes.js";

const app = Express();
dotenv.config();

const PORT = process.env.PORT || 3000;

app.use(Express.json());
app.use(cors());

app.use("/api", ApiRouters);

/*const connectionDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        app.listen(PORT, () => console.log(`Server successfully connected to port ${PORT}`));
    } catch (err) {
        console.error("Connection to MongoDB failed", err.message);
    }
}

connectionDB();

mongoose.connection.on("open", () => console.log("Connection to database has been established successfully"));
mongoose.connection.on("error", (err) => console.log(err));*/

app.listen(PORT)
