import Product from '../../models/productSchema.js'
import Verient from '../../models/verientSchema.js'
import Offer from '../../models/offerSchema.js'
import Category from '../../models/categorySchema.js'  
import User from '../../models/userSchema.js' 


const getOffer = async (req, res) => {
    try {
        const ID = req.query.id;

        if (req.session.passport) {
            req.session.userId = req.session.passport.user;
        }
        let userId = req.session.userId;
        let isLoggedIn = false;

        if (userId) {
            const userData = await User.findOne({ _id: userId, isBlocked: false });
            if (userData) {
                isLoggedIn = true;
            }
        }

        const countCart = res.locals.cartCount;
        const offer = await Offer.findById(ID).populate("categoryId");
        if (!offer) {
            return res.status(404).json({ success: false, message: "Offer not found" });
        }

        let products = [];
        if (offer.productIds.length > 0) {
            products = await Product.find({ _id: { $in: offer.productIds } }).populate("variants");
        } else {
            products = await Product.find({ categoryName: offer.categoryId._id }).populate("variants");
        }

        // Calculate the offer price
        products = products.map(product => {
            let finalPrice = product.regularPrice;
            
            if (offer.discountType === "fixed") {
                finalPrice = Math.max(0, product.salePrice - offer.discountValue); // Ensure no negative price
            } else if (offer.discountType === "percentage") {
                finalPrice = Math.max(0, product.salePrice - (product.salePrice * offer.discountValue / 100));
            }

            return {
                ...product.toObject(), // Convert Mongoose document to plain object
                offerPrice: finalPrice.toFixed(2) // Add offer price
            };
        });

        const offerImage = offer.image ? offer.image : "/images/default-offer.jpg";

        return res.render("offer", { offer, isLoggedIn, countCart, offerImage, products });

    } catch (error) {
        console.log(`Error occurred while rendering the offer page: ${error}`);
        return res.render("404");
    }
};




export default {
    getOffer
}
