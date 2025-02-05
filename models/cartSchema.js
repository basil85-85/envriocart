import mongoose from "mongoose";

const { Schema } = mongoose;

const cartSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User", // Reference to the User model
            required: true,
        },
        Items: [
            {
                productId: {
                    type: Schema.Types.ObjectId,
                    ref: "Product", // Reference to the Product model
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 1, // Minimum quantity should be 1
                    default: 1,
                },
                price: {
                    type: Number,
                    required: true, // Captures the price of the product at the time of adding
                },
                total: {
                    type: Number,
                    required: true, // Calculated as quantity * price
                },
                status:{
                    type:String,
                    default:"placed"
                },
                

            },
        ],
        totalPrice: {
            type: Number,
            required: true, // Sum of all product totals
            default: 0,
        },
    },
    {
        timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
    }
);

// Middleware to calculate `total` and `totalPrice`
cartSchema.pre("save", function (next) {
    this.products.forEach((product) => {
        product.total = product.quantity * product.price; // Calculate total for each product
    });
    this.totalPrice = this.products.reduce((acc, item) => acc + item.total, 0); // Calculate total price
    next();
});

// Creating the model
const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
