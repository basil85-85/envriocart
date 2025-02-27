import Order from '../../models/orderSchema.js'
import moment from 'moment'
import Wallet from '../../models/walletSchema.js'

const getOrders = async (req, res) => {
      try {
            // Uncomment this section when you want to use session authentication
            // if (!req.session.admin) {
            //     return res.redirect("/login");
            // }

            // Pagination setup

            const page = Math.max(1, parseInt(req.query.page) || 1)
            const limit = 10
            const skip = (page - 1) * limit

            // Get total number of orders for pagination
            const totalOrders = await Order.countDocuments({})
            const totalPages = Math.ceil(totalOrders / limit)

            // Get orders with pagination
            const orders = await Order.find({})
                  .populate('userId')
                  .sort({ createdAt: -1 })
                  .skip(skip)
                  .limit(limit)

            return res.render('orders-list', {
                  orders,
                  moment,
                  pagination: {
                        currentPage: page,
                        totalPages,
                        totalItems: totalOrders,
                        hasNextPage: page < totalPages,
                        hasPrevPage: page > 1,
                  },
            })
      } catch (error) {
            console.log(
                  `Error occurred while rendering the orders page: ${error}`
            )
            return res.render('404')
      }
}
const ViewOrders = async (req, res) => {
      try {
            let id = req.query.id
            // console.log(id)
            const order = await Order.findById(id)
            // console.log(order)
            return res.render('order-detail', { order, moment })
      } catch (error) {
            console.log(
                  `error occur on the rendering the view page due to:${error}`
            )
            return res.render('pages-404')
      }
}
const changeStatus = async (req, res) => {
      try {
            let orderId = req.query.id
            if (!orderId) {
                  return res
                        .status(401)
                        .json({ success: false, message: 'Order not found' })
            }

            const order = await Order.findById(orderId)
            if (!order) {
                  return res.status(404).json({
                        success: false,
                        message: 'Order does not exist',
                  })
            }

            let newStatus = ''
            let newSate = 'Unpaid'
            if (order.orderStatus === 'Pending') {
                  newStatus = 'Processing'
            } else if (order.orderStatus === 'Processing') {
                  newStatus = 'Shipped'
            } else if (order.orderStatus === 'Shipped') {
                  newStatus = 'Delivered'
                  newSate = 'Paid'
            } else {
                  return res.status(400).json({
                        success: false,
                        message: 'Order is already Delivered or Cancelled',
                  })
            }

            const updatedOrder = await Order.findByIdAndUpdate(
                  orderId,
                  { orderStatus: newStatus, 'payment.status': newSate },
                  { new: true }
            )

            res.json({
                  success: true,
                  message: 'Order status updated',
                  order: updatedOrder,
            })
      } catch (error) {
            console.error(`Error occurred while changing status: ${error}`)
            return res.render('pages-404')
      }
}
const cancelOrder = async (req, res) => {
      try {
            const OrderID = req.query.id
            if (!OrderID) {
                  return res.status(401).json({
                        success: false,
                        message: 'There is not founding the page of it',
                  })
            }
            const order = await Order.findById(OrderID)

            if (order.orderStatus === 'Delivered') {
                  return res.status(400).json({
                        success: false,
                        message: 'Delivered orders cannot be cancelled',
                  })
            }
            order.orderStatus = 'Cancelled'

            await order.save()

            return res.status(200).json({
                  success: true,
                  message: 'Order has been cancelled',
                  order,
            })
      } catch (error) {
            console.log(
                  `error occur on the updating the order to cancel the orderr due to :${error}`
            )
      }
}

const reasonCancel = async (req, res) => {
      try {
            const orderId = req.query.id
            // console.log(orderId)
            const { reason } = req.body
            const order = await Order.findById(orderId)
            if (!order) {
                  return res
                        .status(401)
                        .json({
                              success: false,
                              message: 'order is not founding',
                        })
            }
            const updated = await Order.findByIdAndUpdate(
                  orderId,
                  {
                        cancelReason: reason,
                        orderStatus: 'rejected',
                  },
                  { new: true }
            )

            if (!updated) {
                  return res
                        .status(401)
                        .json({
                              success: false,
                              message:
                                    'order is not update something error on updating',
                        })
            }
            return res
                  .status(200)
                  .json({ success: true, message: 'sucessfully updated' })
      } catch (error) {
            console.log(`error occur on the cancel reason for due to :${error}`)
            return res
                  .status(500)
                  .json({ success: false, message: 'server error occur' })
      }
}
const approvel = async (req, res) => {
      try {
            const orderId = req.query.id
            const order = await Order.findById(orderId)

            if (!order) {
                  return res
                        .status(401)
                        .json({ success: false, message: 'Order not found' })
            }
            const paymentStatus = 'refunded'
            // Update order status to 'approved'
            const updatedOrder = await Order.findByIdAndUpdate(
                  orderId,
                  { orderStatus: 'approved', 'payment.status': paymentStatus },
                  { new: true }
            )

            if (!updatedOrder) {
                  return res
                        .status(401)
                        .json({
                              success: false,
                              message: 'Error updating order',
                        })
            }

            const wallet = await Wallet.findOneAndUpdate(
                  { userId: order.userId },
                  {
                        $inc: { wallet: order.grandTotal },
                        $push: {
                              transactions: {
                                    transactionType: 'credit',
                                    amount: order.grandTotal,
                                    description: `Refund for Order ID: ${order.orderId}`,
                              },
                        },
                  },
                  { new: true }
            )

            if (!wallet) {
                  const newWallet = new Wallet({
                        userId: order.userId,
                        wallet: order.grandTotal,
                        transactions: [
                              {
                                    transactionType: 'credit',
                                    amount: order.grandTotal,
                                    description: `Refund for Order ID: ${order.orderId}`,
                              },
                        ],
                  })

                  await newWallet.save()
            }

            return res
                  .status(200)
                  .json({
                        success: true,
                        message:
                              'Successfully updated & amount credited to wallet',
                  })
      } catch (error) {
            console.log(`Error in approval process: ${error}`)
            return res
                  .status(500)
                  .json({ success: false, message: 'Server error occurred' })
      }
}

export default {
      getOrders,
      ViewOrders,
      changeStatus,
      cancelOrder,
      reasonCancel,
      approvel,
}
