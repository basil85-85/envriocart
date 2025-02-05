import mongoose from "mongoose";
const { Schema } = mongoose;

const couponSchema = new Schema(
    {
        name:{
            type:String,
            required:true,
            unique:true
        },
        code: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        createOn:{
            type:Date,
            default:Date.now,
            required:true
        },
        discountType: {
            type: String,
            enum: ["Percentage", "Flat"], // Options for discount type
            required: true,
        },
        OfferValue: {
            type: Number,
            required: true,
        },
        minPurchase: {
            type: Number, // Minimum purchase amount to apply the coupon
            default: 0,
        },
        maxDiscount: {
            type: Number, // Maximum discount allowed (for percentage discounts)
        },
        expireDate: {
            type: Date,
            required: true,
        },
        usageLimit: {
            type: Number, // Maximum number of times this coupon can be used
            default: 1,
        },
        usedCount: {
            type: Number, // Tracks how many times this coupon has been used
            default: 0,
        },
        isListed:{
            type:Boolean,
            default:true
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        userId: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User", // Track users who have used this coupon
            },
        ],
    },
    { timestamps: true }
);

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;
