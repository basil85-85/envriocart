import mongoose from "mongoose";

const { Schema } = mongoose;

const categorySchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true, // Ensures category names are unique
            trim: true,   // Removes unnecessary spaces
        },
        description: {
            type: String,
            required: true, // Description is required for clarity
            trim: true,     // Removes unnecessary spaces
        },
        isListed:{
            type:Boolean,
            default:true

        },
        CategoryOffer:{
              type:Number,
              default:0
        },
        createdAt: {
            type: Date,
            default: Date.now, // Automatically set to the current date
        },
        updatedAt: {
            type: Date,
            default: Date.now, // Automatically set to the current date
        },
    });
    

     // Middleware to update the `updatedAt` field before saving
     categorySchema.pre("save", function (next) {
        this.updatedAt = Date.now();
        next();
    });

// Creating the model
const Category = mongoose.model("Category", categorySchema);

export default Category;
