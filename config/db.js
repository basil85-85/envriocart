import mongoose from "mongoose";
import env from "dotenv/config";

const connectDB=async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("database connected sucessfully")
    } catch (error) {
        console.log(`DB connection error occur ${{error}}`)
    }
} 
export default connectDB
