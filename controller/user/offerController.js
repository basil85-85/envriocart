import Product from '../../models/productSchema.js'
import Verient from '../../models/verientSchema.js'
import Offer from '../../models/offerSchema.js'
import Category from '../../models/categorySchema.js'


const getOffer =async (req,res) => {
    try {
        const ID = req.query.id;
            let isLoggedIn = false;
            const countCart = res.locals.cartCount;

            const offer = await Offer.findById(ID).populate("categoryId");

            if (!offer) {
                return res.status(404).json({ success: false, message: "Offer not found" });
            }

            // console.log(offer);


            let products = [];
            if (offer.productIds.length > 0) {
            
                products = await Product.find({ _id: { $in: offer.productIds } }).populate("variants");
            } else {
            
                products = await Product.find({ categoryName: offer.categoryId._id }).populate("variants");
            }
            console.log(products)
            const offerImage = offer.image ? offer.image : "/images/default-offer.jpg";

            return res.render("offer", { offer, isLoggedIn, countCart, offerImage, products });
    } catch (error) {
        console.log(`error occur on the offering rendering time due to :${error}`)
        return res.render("404")
    }
}




export default {
    getOffer
}
