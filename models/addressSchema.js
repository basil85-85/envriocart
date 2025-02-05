import mongoose, { Types } from "mongoose";
import { Schema } from "mongoose";

const addressSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true, 
    },
    address: {
        addressType: {
            type: String,
            required: true,
        },
        firstname: {
            type: String,
            required: true, 
        },
        lastname: {
            type: String,
            required: true, 
        },
        city: {
            type: String,
            required: true, 
        },
        landMark: {
            type: String,
            required: true, 
        },
        State: {
            type: String,
            required: true, 
        },
        pincode: {
            type: Number,
            required: true,
        },
        Phone: {
            type: Number,
            required: true, 
        },
        altPhone: {
            type: String,
            required: true,
        },
    },
});

const Address = mongoose.model("Address", addressSchema);

export default Address;
