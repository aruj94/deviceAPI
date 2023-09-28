import mongoose from "mongoose";


/**
 * Function to connect to the MongoDb database
 */
const connectToDatabase = async () => {
  const DB_NAME = process.env.DB_NAME;

  try {
    await mongoose.connect(process.env.MONGO_URI, {
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
const closeDbConnection = async () => {
    await mongoose.connection.close();
    console.log("Connection to MongoDB successfully closed.");
}

/**
 * Check if there is connection with MongoDb
 * @returns bool indicating if there is a successful connection with MongoDb
 */
const checkMongoDbConnection = async () => {
  if (mongoose.connection.readyState === 1) {
    return true
  }

  return false
} 
     
export { connectToDatabase, closeDbConnection, checkMongoDbConnection };