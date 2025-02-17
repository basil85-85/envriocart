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
            if(updatedCart){
            return res.status(200).json({
                  success: true,
                  message: 'Item added to cart successfully!',
                  cart: updatedCart,
            })}
            else{
                return res.status(401).json({
                    success: false,
                    message: "something went wrong",
                    
            })
        }
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
        let id = req.query.id;
    
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Cart ID is missing",
            });
        }
    
        const cart = await Cart.findOne({ "items._id": id });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart item not found",
            });
        }

        const cartItem = cart.items.find(item => item._id.toString() === id);
        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: "Item not found in cart",
            });
        }
  
        cart.totalPrice -= cartItem.price * cartItem.quantity;

        cart.items = cart.items.filter(item => item._id.toString() !== id);

        await cart.save();
    
        return res.status(200).json({
            success: true,
            message: "Cart item deleted successfully",
            newTotal: cart.totalPrice,  
        });
    } catch (error) {
        console.error("Error deleting cart item:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
    
}
const quantityCart = async (req, res) => {
      try {
            const { productId, quantity, size } = req.body
            const userID = req.session.userId

            // Validation checks...

            const cart = await Cart.findOne({ userId: userID })
            const variant = await Verient.findById(productId)

            const itemIndex = cart.items.findIndex(
                  item =>
                        item.verientId.toString() === productId &&
                        item.size === size
            )
            let isVaild=true
            for (let [SIZE, QTY] of Object.entries(variant.size)) {
                if (SIZE === size) {  
                    if(QTY < quantity){
                         isVaild= false
                    }
                }
            }
            if(!isVaild){
                return res.status(401).json({success:false,message:"out of stock"})
            }
            if (itemIndex === -1) {
                  return res.status(404).json({
                        success: false,
                        message: 'Item not found in cart',
                  })
            }
            cart.items[itemIndex].quantity = quantity

        
            const newTotal = cart.items.reduce((total, item) => {
                  return total + item.price * item.quantity
            }, 0)

            cart.totalPrice = newTotal 
            
            
            await cart.save()
            let  subtotal = cart.items[itemIndex].total 
            return res.status(200).json({
                  success: true,
                  quantity: quantity,
                  availableStock: variant.size[size],
                  newTotal: newTotal,
                  subtotal :subtotal
            })
      } catch (error) {
            console.error('Quantity update error:', error)
            return res.status(500).json({
                  success: false,
                  message: 'Internal server error',
            })
      }
}

export default {
      AddCart,
      getCart,
      deleteCart,
      quantityCart,
}
