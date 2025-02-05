import mongoose from "mongoose";

const { Schema } = mongoose;

const wishlistSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User", // Reference to the User model
            required: true,
        },
        products: [
            {
                productId: {
                    type: Schema.Types.ObjectId,
                    ref: "Product", // Reference to the Product model
                    required: true,
                },
                addedAt: {
                    type: Date,
                    default: Date.now, // Tracks when the product was added to the wishlist
                },
            },
        ],
    },
    {
        timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
    }
);

// Creating the model
const Wishlist = mongoose.model("Wishlist", wishlistSchema);

export default Wishlist;
