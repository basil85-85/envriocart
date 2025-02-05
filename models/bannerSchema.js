import mongoose from "mongoose";
const { Schema } = mongoose;

const bannerSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        imageUrl: {
            type: String, // URL for the image to display on the banner
            required: true,
        },
        linkUrl: {
            type: String, // The link where the user will be redirected when clicking the banner
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true, // Controls if the banner is active or not
        },
        position: {
            type: String,
            enum: ["top", "middle", "bottom"], // Defines the position of the banner on the page
            required: true,
        },
        startDate: {
            type: Date, // When the banner starts appearing
        },
        endDate: {
            type: Date, // When the banner stops appearing
        },
    },
    { timestamps: true }
);

const Banner = mongoose.model("Banner", bannerSchema);

export default Banner;
