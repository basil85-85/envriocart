import Wishlist from '../../models/wislistSchema.js'
import Verient from '../../models/verientSchema.js'
import Cart from '../../models/cartSchema.js'

const addWishlist = async (req, res, next) => {
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
                  return res.status(401).json({
                        success: false,
                        message: "You're logged out. Please log in again.",
                  })
            }

            const variant = await Verient.findById(variantId)
            if (!variant) {
                  return res.status(404).json({
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
                  return res.status(400).json({
                        success: false,
                        message: 'Product already exists in wishlist.',
                  })
            }

            wishlist.products.push({
                  verientId: variantId,
                  productName,
                  size,
                  color,
                  price,
                  image,
            })

            await wishlist.save()

            return res.status(200).json({
                  success: true,
                  message: 'Product added to wishlist successfully!',
                  wishlist,
            })
      } catch (error) {
            console.error(`Error occurred: ${error}`)
            next(error)
      }
}

const getWishlist = async (req, res, next) => {
      try {
            let isLoggedIn = true
            const userID = req.session.userId
            const wishlist = await Wishlist.findOne({
                  userId: userID,
            }).populate({
                  path: 'products.verientId',
                  select: 'productId',
            })
            const countCart = res.locals.cartCount
            return res.render('wishlist', { isLoggedIn, wishlist, countCart })
      } catch (error) {
            console.log(`error on page rendering the cart${error}`)
            next(error)
      }
}

const deleteWishlist = async (req, res, next) => {
      try {
            const wishlistID = req.query.wishlistId
            const productID = req.query.productId
            const wishlist = await Wishlist.findById(wishlistID)
            if (!wishlist) {
                  return res.status(404).json({
                        success: false,
                        message: 'wishlsist is not founding',
                  })
            }
            const updatedWishlist = await Wishlist.findByIdAndUpdate(
                  wishlistID,
                  { $pull: { products: { _id: productID } } },
                  { new: true }
            )
            if (updatedWishlist) {
                  return res.status(200).json({
                        success: true,
                        message: 'sucessfully delected',
                  })
            } else {
                  return res.status(404).json({
                        success: false,
                        message: 'not deleted founded',
                  })
            }
      } catch (error) {
            console.error(`error occur on the server due to :${error}`)
            next(error)
      }
}

const AddCartWislist = async (req, res, next) => {
      try {
            const wishlistID = req.query.wishlistId
            const productID = req.query.productId
            const {
                  variantId,
                  productName,
                  size,
                  color,
                  price,
                  image,
                  quantity,
            } = req.body
            const userId = req.session.userId

            if (!userId) {
                  return res.status(401).json({
                        success: false,
                        message:
                              'User is not logged in. Please login to continue.',
                  })
            }
            const variant = await Verient.findById(variantId)
            if (!variant) {
                  return res.status(401).json({
                        success: false,
                        message: 'Variant not found. Please try again.',
                  })
            }
            let userCart = await Cart.findOne({ userId })

            if (userCart) {
                  const existingItemIndex = userCart.items.findIndex(
                        item =>
                              item.verientId.toString() === variantId &&
                              item.size === size
                  )

                  if (existingItemIndex > -1) {
                        userCart.items[existingItemIndex].quantity += quantity
                        userCart.items[existingItemIndex].total =
                              userCart.items[existingItemIndex].quantity *
                              userCart.items[existingItemIndex].price

                        return res.status(401).json({
                              success: false,
                              message: 'Variant is already added.',
                        })
                  } else {
                        userCart.items.push({
                              verientId: variantId,
                              productName,
                              size,
                              color,
                              price,
                              image,
                              quantity,
                              total: price * quantity,
                        })
                  }
                  await userCart.save()
            } else {
                  // Create new cart
                  userCart = new Cart({
                        userId,
                        items: [
                              {
                                    verientId: variantId,
                                    productName,
                                    size,
                                    color,
                                    price,
                                    image,
                                    quantity,
                                    total: price * quantity,
                              },
                        ],
                        totalPrice: price * quantity,
                  })

                  await userCart.save()
            }

            const updatedCart = await Cart.findById(userCart._id)
                  .populate('items.verientId')
                  .populate('userId')
            if (updatedCart) {
                  const updatedWishlist = await Wishlist.findByIdAndUpdate(
                        wishlistID,
                        { $pull: { products: { _id: productID } } },
                        { new: true }
                  )
                  if (updatedWishlist) {
                        return res.status(200).json({
                              success: true,
                              message: 'Item added to cart successfully!',
                              cart: updatedCart,
                        })
                  } else {
                        return res.status(401).json({
                              success: false,
                              message: 'something went wrong',
                        })
                  }
            } else {
                  return res.status(401).json({
                        success: false,
                        message: 'something went wrong',
                  })
            }
      } catch (error) {
            console.error('Error adding item to cart:', error)
            next(error)
      }
}
export default {
      addWishlist,
      getWishlist,
      deleteWishlist,
      AddCartWislist,
}
