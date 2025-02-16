import mongoose, { Types } from "mongoose";
import { Schema } from "mongoose";

const addressSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true, 
    },
    title:{
           type: String,
           required: true,
        },
    address: {
             type: String,
            required: true,
        },
     phone: {
            type: Number,
            required: true, 
        },
     country:{
            type:String,
            required:true,
        },
     state: {
            type: String,
            required: true, 
        },
     city: {
            type: String,
            required: true, 
        },
      pincode: {
            type: Number,
            required: true,
        },
} ,{
    timestamps: true,
});

const Address = mongoose.model("Address", addressSchema);  

export default Address;
