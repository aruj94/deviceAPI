import dotenv from 'dotenv'
import mongoose from "mongoose";

dotenv.config();
const MONGO_URI = process.env.MONGO_URI;

/**
 * Function to connect to the MongoDb database
 */
async function connectToDatabase() {
    const DB_NAME = process.env.DB_NAME;

    try {
      await mongoose.connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        dbName: DB_NAME,
      });

      console.log("Connected to MongoDB!");
    } catch (error) {
      console.error("Error connecting to MongoDB:", error);
    }
  }

/**
 * Close connection with the database
 */
async function closeDbConnection() {
    await mongoose.connection.close();
    console.log("Connection to MongoDB successfully closed.");
}
     
export { connectToDatabase, closeDbConnection };