import User from '../../models/userSchema.js'

import bcrypt from 'bcrypt'

import env from 'dotenv/config'

import Product from '../../models/productSchema.js'
import Verient from '../../models/verientSchema.js'

import Category from '../../models/categorySchema.js'
import Address from '../../models/addressSchema.js'

import Cart from '../../models/cartSchema.js'

const AddCart = async (req, res) => {
      try {
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

            const samevariantId = await Cart.findOne({
                  'items.verientId': variantId,
            })
            if (samevariantId) {
                  return res.status(404).json({
                        success: false,
                        message: 'You are already added to your Cart.',
                  })
            }
            if (!userId) {
                  return res.status(401).json({
                        success: false,
                        message:
                              'User is not logged in. Please login to continue.',
                  })
            }
            const variant = await Verient.findById(variantId)
            if (!variant) {
                  return res.status(404).json({
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

            // Fetch updated cart with populated fields
            const updatedCart = await Cart.findById(userCart._id)
                  .populate('items.verientId')
                  .populate('userId')

            return res.status(200).json({
                  success: true,
                  message: 'Item added to cart successfully!',
                  cart: updatedCart,
            })
      } catch (error) {
            console.error('Error adding item to cart:', error)
            return res.status(500).render('404')
      }
}

const getCart = async (req, res) => {
      try {
            let isLoggedIn = true
            const userID = req.session.userId
            const cartItems = await Cart.findOne({ userId: userID })
            const countCart = res.locals.cartCount

            return res.render('cart', { isLoggedIn, cartItems, countCart })
      } catch (error) {
            console.log(`error on page rendering the cart${error}`)
            return res.render('404')
      }
}
const deleteCart = async (req, res) => {
      try {
            let id = req.query.id

            if (!id) {
                  return res.status(400).json({
                        success: false,
                        message: 'Cart ID is missing',
                  })
            }

            const cartItem = await Cart.findOne({ 'items._id': id })
            if (!cartItem) {
                  return res.status(404).json({
                        success: false,
                        message: 'Cart item not found',
                  })
            }
            await Cart.updateOne(
                  { 'items._id': id },
                  { $pull: { items: { _id: id } } }
            )
            return res.status(200).json({
                  success: true,
                  message: 'Cart item deleted successfully',
            })
      } catch (error) {
            console.error(`Error deleting cart item: ${error}`)
            return res.render('404')
      }
}
const quantityCart = async (req, res) => {
    try {
        const { productId, quantity, size } = req.body;
        const userID = req.session.userId;

        // Input validation
        if (!productId || !quantity || !size) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        // Validate quantity
        if (quantity < QUANTITY_LIMITS.MIN || quantity > QUANTITY_LIMITS.MAX) {
            return res.status(400).json({
                success: false,
                message: `Quantity must be between ${QUANTITY_LIMITS.MIN} and ${QUANTITY_LIMITS.MAX}`
            });
        }

        // Find user cart
        const cart = await Cart.findOne({ userId: userID });
        if (!cart?.items?.length) {
            return res.status(404).json({
                success: false,
                message: "User cart not found. Please add items to the cart first."
            });
        }

        // Find the product variant
        const variant = await Verient.findById(productId);
        if (!variant) {
            return res.status(404).json({
                success: false,
                message: "Product variant not found."
            });
        }

        // Validate size
        if (!(size in variant.size)) {
            return res.status(400).json({
                success: false,
                message: `Invalid size. Available sizes: ${Object.keys(variant.size).join(", ")}`
            });
        }

        // Check stock availability
        const availableStock = variant.size[size];
        if (availableStock < quantity) {
            return res.status(400).json({
                success: false,
                message: `Not enough stock available. Requested: ${quantity}, Available: ${availableStock}`,
                availableStock
            });
        }

        await cart.save();
        
        return res.status(200).json({
            success: true,
            status: true, // For frontend compatibility
            message: "Stock is available",
            availableStock,
            newTotal: cart.total // Assuming cart.total exists
        });
    } catch (error) {
        console.error('Quantity update error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


export default {
      AddCart,
      getCart,
      deleteCart,
      quantityCart,
}
