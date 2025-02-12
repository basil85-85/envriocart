import mongoose from "mongoose";

const { Schema } = mongoose;

const cartSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User", 
            required: true,
        },
        items: [
            {
                verientId: {
                    type: Schema.Types.ObjectId,
                    ref: "Verient", 
                    required: true,
                },
                productName:{
                    type: String,
                    required: false,
                },
                size: {
                    type: String,
                    required: false, 
                },
                price: {
                    type: Number,
                    required: true,
                },
                color: {
                    type: String,
                    required: false, 
                },
                image: {
                    type: String,
                    required: false,
                },
                
                quantity: {
                    type: Number,
                    required: true,
                    min: 1, 
                    default: 1,
                },
                
                total: {
                    type: Number, 
                    default: 0,
                },
            },
        ],
        totalPrice: {
            type: Number,
            required: true, 
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

cartSchema.pre("save", function (next) {
    this.items.forEach((item) => {
        item.total = item.quantity * item.price;
    });
    this.totalPrice = this.items.reduce((acc, item) => acc + item.total, 0); 
    next();
});

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;

