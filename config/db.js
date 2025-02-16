import mongoose from "mongoose";



const connectDB = async () => {
    try {
        await mongoose.connect("mongodb://localhost:27017/envriocart");
        console.log("Database connected successfully");
    } catch (error) {
        console.error(`DB connection error occur: ${error}`);
    }
};

export default connectDB;
           