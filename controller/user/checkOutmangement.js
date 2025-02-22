import Cart from '../../models/cartSchema.js'
import Address from '../../models/addressSchema.js'
import Order from '../../models/orderSchema.js'
import moment from 'moment'
import Verient from '../../models/verientSchema.js'
import Wallet from '../../models/walletSchema.js'
import Coupon from '../../models/couponSchema.js'

const getCheckout = async (req, res) => {
      try {
            let isLoggedIn = true
            const countCart = res.locals.cartCount

            const userID = req.session.userId
            const coupon = await Coupon.find({ status:'active', usageLimit : { $gt:0  } })
            console.log(coupon)
            const cart = await Cart.findOne({ userId: userID })
            const details = await Address.find({ userId: userID })
            if (cart) {
                  return res.render('checkout', {
                        isLoggedIn,
                        countCart,
                        coupon,
                        cart,
                        details,
                  })
            } else {
                  return res.redirect('/cart')
            }
      } catch (error) {
            console.log(`error occur on the check out page due to :${error}`)
            return res.render('404')
      }
}

const placeOrder = async (req, res) => {
      try {
            let userId = req.query.id
            let {
                  address,
                  payment,
                  cartItems,
                  discount,
                  deliveryCharge,
            } = req.body

            if (
                  !userId ||
                  !address ||
                  !payment ||
                  !cartItems ||
                  cartItems.length === 0
            ) {
                  return res
                        .status(400)
                        .json({
                              success: false,
                              message: 'Missing required fields',
                        })
            }
            
          
            if (req.session.couponID) {
                const coupon = await Coupon.findById(req.session.couponID);

                if (!coupon || coupon.status !== "active") {
                      return res.status(401).json({
                            success: false,
                            message: "Invalid coupon, try another coupon",
                      });
                }

                coupon.usedBy.push(userId);
                coupon.usageLimit -= 1;
                await coupon.save();
          }

            let totalAmount = cartItems.reduce(
                  (sum, item) => sum + item.total,
                  0
            )
            discount=req.session.discountAmount
            let grandTotal =  totalAmount + (deliveryCharge || 0) - (discount || 0)
                
            for (let item of cartItems) {
                  const variant = await Verient.findOne({ _id: item.verientId })

                  if (!variant) {
                        return res
                              .status(404)
                              .json({
                                    success: false,
                                    message: `Variant for ${item.name} not found.`,
                              })
                  }

                  if (variant.size[item.size] < item.quantity) {
                        return res
                              .status(400)
                              .json({
                                    success: false,
                                    message: `${item.name} (Size: ${item.size}) is out of stock!`,
                              })
                  }

                  variant.size[item.size] -= item.quantity
                  await variant.save()
            }
              delete req.session.discountAmount
                
            const newOrder = new Order({
                  userId,
                  address,
                  payment,
                  cartItems,
                  couponApplied:req.session.couponApplied ||false ,
                  discount: discount || 0,
                  deliveryCharge: deliveryCharge || 0,
                  totalAmount,
                  grandTotal,
            })

            await newOrder.save()
            await Cart.deleteOne({ userId })

            res.status(201).json({
                  success: true,
                  message: 'Order placed successfully',
                  order: newOrder,
            })
      } catch (error) {
            console.error('Error placing order:', error)
            res.status(500).json({
                  success: false,
                  message: 'Internal server error',
            })
      }
}

//render the order sucess page for oder render this page
// const getOrderSuccess = async (req, res) => {
//     try {
//         if (!req.session || !req.session.userId) {
//             return res.redirect("/login");
//         }

//         const countCart = res.locals.cartCount || 0;
//         const userID = req.session.userId;
//         const orders = await Order.findOne({ userId: userID }).sort({ createdAt: -1 });
//       console.log(orders)
//         if (orders) {
//             return res.render("order-success", {
//                 isLoggedIn: true,
//                 countCart,
//                 orders
//             });
//         } else {
//             return res.redirect("/");
//         }

//     } catch (error) {
//         console.error(`Error fetching order success page: ${error.message}`);
//         return res.render("404");
//     }
// };
const getOrderSuccess = async (req, res) => {
      try {
            if (!req.session || !req.session.userId) {
                  return res.redirect('/login')
            }

            const countCart = res.locals.cartCount || 0
            const userID = req.session.userId

            const orders = await Order.findOne({ userId: userID }).sort({
                  createdAt: -1,
            })
            //  console.log(orders)
            if (orders) {
                  return res.render('order-success', {
                        isLoggedIn: true,
                        countCart,
                        orders,
                        moment,
                  })
            } else {
                  return res.redirect('/')
            }
      } catch (error) {
            console.error(`Error fetching order success page: ${error.message}`)
            return res.render('404')
      }
}

const ViewOrder = async (req, res) => {
      try {
            const orderId = Number(req.query.id) // Convert to Number
            if (isNaN(orderId)) {
                  return res
                        .status(400)
                        .json({ status: false, message: 'Invalid order ID' })
            }

            const order = await Order.findOne({ orderId })
                  .populate('userId', 'name email')
                  .lean()

            if (!order) {
                  return res.redirect('/profile')
            }
            const formattedOrder = {
                  OrderID: order._id,
                  orderId: order.orderId,
                  orderDate: order.createdAt,
                  status: order.orderStatus,
                  payment: {
                        method: order.payment?.method || 'N/A',
                        status: order.payment?.status || 'N/A',
                  },
                  address: {
                        name: order.address?.name || 'N/A',
                        address: order.address?.address || 'N/A',
                        pincode: order.address?.pincode || 'N/A',
                        phone: order.address?.phone || 'N/A',
                  },
                  items: (order.cartItems || []).map(item => ({
                        name: item.name,
                        price: item.price,
                        color: item.color || 'null',
                        size: item.size,
                        quantity: item.quantity,
                        total: item.total,
                        image: item.image,
                  })),
                  summary: {
                        subtotal: order.totalAmount || 0,
                        discount: order.discount || 0,
                        deliveryCharge: order.deliveryCharge || 0,
                        grandTotal: order.grandTotal || 0,
                  },
                  customer: {
                        name: order.userId?.name || 'Unknown',
                        email: order.userId?.email || 'Unknown',
                  },
            }
            console.log(formattedOrder)
            return res.render('viewOrder', { formattedOrder, moment })
      } catch (error) {
            console.error('Error viewing order:', error)
            return res.render('404')
      }
}
const cancelOrder = async (req, res) => {
      try {
            const OrderID = req.query.id
            if (!OrderID) {
                  return res
                        .status(401)
                        .json({
                              success: false,
                              message: 'There is not founding the page of it',
                        })
            }
            const order = await Order.findOne({ orderId: OrderID })

            if (order.orderStatus === 'Delivered') {
                  return res
                        .status(400)
                        .json({
                              success: false,
                              message: 'Delivered orders cannot be cancelled',
                        })
            }
            // console.log(order)
            order.orderStatus = 'Cancelled'
            await order.save()

            return res.json({
                  success: true,
                  message: 'Order has been cancelled',
                  order,
            })
      } catch (error) {
            console.log(`error occur due to ${error}`)
            return res.render('404')
      }
}
const ReOrder = async (req, res) => {
      try {
            const orderId = req.query.id
            if (!orderId) {
                  return res
                        .status(400)
                        .json({ success: false, message: 'Invalid order ID' })
            }

            const order = await Order.findOne({ orderId: orderId })
            if (!order) {
                  return res
                        .status(404)
                        .json({ success: false, message: 'Order not found' })
            }

            if (order.orderStatus !== 'Cancelled') {
                  return res
                        .status(400)
                        .json({
                              success: false,
                              message: 'Only cancelled orders can be reordered',
                        })
            }

            order.orderStatus = 'Pending'
            await order.save()

            return res.json({
                  success: true,
                  message: 'Order placed again successfully',
            })
      } catch (error) {
            console.error(`Error: ${error}`)
            return res
                  .status(500)
                  .json({ success: false, message: 'Internal server error' })
      }
}




export default {
      getCheckout,
      placeOrder,
      getOrderSuccess,
      ViewOrder,
      cancelOrder,
      ReOrder,
      
}
