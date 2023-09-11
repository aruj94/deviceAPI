import mongoose from "mongoose";

const ERRORS_COLLECTION_NAME = process.env.ERRORS_COLLECTION_NAME;
const API_COLLECTION_NAME = process.env.API_COLLECTION_NAME;

/**
 * Basic model is setup for the type of data allowed in the mongodb errors collection.
 * Version keys are set to false hence will not be stored in the document
 */
const errorData = mongoose.Schema({
    data: { type: String, required: true },
}, { versionKey: false });

const errorDataModel = mongoose.model("Error", errorData, ERRORS_COLLECTION_NAME)

/**
 * Basic model is setup for the type of data allowed in the mongodb API keys collection.
 */
const API_key_data = mongoose.Schema({
    data: { type: String, required: true },
    expirationTimestamp: { type: Date, required: true },
}, { versionKey: false });

const apiKeyDataModel = mongoose.model("apikeys", API_key_data, API_COLLECTION_NAME)


export {errorDataModel, apiKeyDataModel}