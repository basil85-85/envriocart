import mongoose from "mongoose";

const { Schema } = mongoose;

const wishlistSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId, 
            ref: "User",
            required: true,
        },
        products: [
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
                
                
              
            },
        ],
    },
    {
        timestamps: true, 
    }
);

const Wishlist = mongoose.model("Wishlist", wishlistSchema);

export default Wishlist;
