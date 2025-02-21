import Wishlist from '../../models/wislistSchema.js'
import Verient from '../../models/verientSchema.js'
import Cart from '../../models/cartSchema.js'

const addWishlist = async (req, res) => {
      try {
           

            const {
                  variantId,
                  productName,
                  size,
                  color,
                  price,
                  image,
            } = req.body
            const userID = req.session.userId

            if (!userID) {
                  return res
                        .status(401)
                        .json({
                              success: false,
                              message:
                                    "You're logged out. Please log in again.",
                        })
            }

            const variant = await Verient.findById(variantId)
            if (!variant) {
                  return res
                        .status(404)
                        .json({
                              success: false,
                              message: 'Variant not found. Please try again.',
                        })
            }

            let wishlist = await Wishlist.findOne({ userId: userID })

            if (!wishlist) {
                  wishlist = new Wishlist({
                        userId: userID,
                        products: [],
                  })
            }

  
            const productExists = wishlist.products.some(
                  item =>
                        item.verientId.toString() === variantId &&
                        item.size === size
            )
            if (productExists) {
                  return res
                        .status(400)
                        .json({
                              success: false,
                              message: 'Product already exists in wishlist.',
                        })
            }

            wishlist.products.push({
                verientId:variantId,
                  productName,
                  size,
                  color,
                  price,
                  image,
            })

            await wishlist.save()

            return res
                  .status(200)
                  .json({
                        success: true,
                        message: 'Product added to wishlist successfully!',
                        wishlist,
                  })
      } catch (error) {
            console.error(`Error occurred: ${error}`)
            return res
                  .status(500)
                  .json({ success: false, message: 'Server error occurred.' })
      }
}


const getWishlist =async (req,res) => {
    try {
        let isLoggedIn = true
        const userID = req.session.userId
        const wishlist = await Wishlist.findOne({ userId: userID }).populate({
            path:"products.verientId",
            select:"productId"
        })
        const countCart = res.locals.cartCount
        return res.render('wishlist', { isLoggedIn,wishlist, countCart })
  } catch (error) {
        console.log(`error on page rendering the cart${error}`)
        return res.render('404')
  }
}



const deleteWishlist = async (req,res) => {
    try {
        const wishlistID =req.query.wishlistId
        const productID=req.query.productId
        const wishlist = await Wishlist.findById(wishlistID)
        if(!wishlist){
            return res.status(404).json({success:false,message:"wishlsist is not founding"})
        }
        const updatedWishlist = await Wishlist.findByIdAndUpdate(
            wishlistID,
            { $pull: { products: { _id: productID } } }, 
            { new: true } 
        );
        if(updatedWishlist){
            return res.status(200).json({success:true,message:"sucessfully delected"})
        }

        else{
            return res.status(404).json({success:false,message:"not deleted founded"})
        }
    } catch (error) {
        console.error(`error occur on the server due to :${error}`)
        return res.status(500).json({success:false,message:"Server error occur"})
    }
    
}
export default {
      addWishlist,
      getWishlist,
      deleteWishlist
}
