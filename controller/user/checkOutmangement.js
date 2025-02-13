import Cart from "../../models/cartSchema.js"
import Address from "../../models/addressSchema.js"

const getCheckout = async (req,res) => {
    try {
        let isLoggedIn =true
        const countCart = res.locals.cartCount
        
        const userID=req.session.userId
        const cart = await Cart.findOne({userId:userID})
        const details =await Address.find({userId:userID})
        return res.render("checkout",{isLoggedIn,countCart,cart,details})

    } catch (error) {
        console.log(`error occur on the check out page due to :${error}`)
        return res.render("404")
    }
}

export default {
   getCheckout
}