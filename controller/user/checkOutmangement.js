import Cart from '../../models/cartSchema.js'
import Address from '../../models/addressSchema.js'
import Order from '../../models/orderSchema.js'
import moment from 'moment'
import Verient from '../../models/verientSchema.js'
import Wallet from '../../models/walletSchema.js'
import Coupon from '../../models/couponSchema.js'
import User from '../../models/userSchema.js'
import nodemailer from 'nodemailer'
import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import axios from 'axios'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const getCheckout = async (req, res) => {
      try {
            let isLoggedIn = true
            const countCart = res.locals.cartCount

            const userID = req.session.userId
            const coupon = await Coupon.find({
                  status: 'active',
                  usageLimit: { $gt: 0 },
            })
            // console.log(coupon)
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
        //    console.log(req.body)
            if (
                  !userId ||
                  !address ||
                  !payment ||
                  !cartItems ||
                  cartItems.length === 0
            ) {
                  return res.status(400).json({
                        success: false,
                        message: 'Missing required fields',
                  })
            }

            if (req.session.couponID) {
                  const coupon = await Coupon.findById(req.session.couponID)

                  if (!coupon || coupon.status !== 'active') {
                        return res.status(401).json({
                              success: false,
                              message: 'Invalid coupon, try another coupon',
                        })
                  }

                  coupon.usedBy.push(userId)
                  coupon.usageLimit -= 1
                  await coupon.save()
            }
            
            let totalAmount = cartItems.reduce(
                  (sum, item) => sum + item.total,
                  0
            )
            discount = req.session.discountAmount
            let grandTotal =
                  totalAmount + (deliveryCharge || 0) - (discount || 0)

                  if(payment.method=== 'CASH ON DELIVERY' ){
                    if(grandTotal>1000){
                        return res.status(404).json({succes:false , message:"cash on deliviery for the below 1000"})
                    }
                  } 

            for (let item of cartItems) {
                  const variant = await Verient.findOne({ _id: item.verientId })

                  if (!variant) {
                        return res.status(404).json({
                              success: false,
                              message: `Variant for ${item.name} not found.`,
                        })
                  }

                  if (variant.size[item.size] < item.quantity) {
                        return res.status(400).json({
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
                  couponApplied: req.session.couponApplied || false,
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
            //   console.log(order)
            if (!order) {
                  return res.redirect('/profile')
            }
            const formattedOrder = {
                  OrderID: order._id,
                  userId:{
                    _id:order.userId._id   

                  },
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
                  return res.status(401).json({
                        success: false,
                        message: 'There is not founding the page of it',
                  })
            }
            const order = await Order.findOne({ orderId: OrderID })

            if (order.orderStatus === 'Delivered') {
                  return res.status(400).json({
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
                  return res.status(400).json({
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

const OrderRefund = async (req, res) => {
      try {
            const orderID = req.query.id
            const order = await Order.findOne({ orderId: orderID })

            if (!order) {
                  return res
                        .status(404)
                        .json({ success: false, message: 'Order not found' })
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
                  { new: true, upsert: true }
            )
            order.orderStatus = 'Cancelled'
            order.payment.status = 'refunded'
            await order.save()

            return res
                  .status(200)
                  .json({
                        success: true,
                        message:
                              'Successfully refunded & amount credited to wallet',
                  })
      } catch (error) {
            console.error(`Error in OrderRefund: ${error.message}`)
            return res
                  .status(500)
                  .json({ success: false, message: 'Internal Server Error' })
      }
}
const downloadInvoice = async (req, res, next) => {
      try {
            console.log(req.query)
            const orderId = req.query.id

            if (!orderId) {
                  return res
                        .status(400)
                        .json({
                              success: false,
                              message: 'Order ID is required',
                        })
            }

            const order = await Order.findOne({ orderId })
            if (!order)
                  return res
                        .status(404)
                        .json({ success: false, message: 'Order not found' })
            // console.log(order);

            const user = await User.findById(order.userId)
            if (!user)
                  return res
                        .status(404)
                        .json({ success: false, message: 'User not found' })

            const invoicesDir = path.join(__dirname, 'invoices')
            if (!fs.existsSync(invoicesDir)) {
                  fs.mkdirSync(invoicesDir, { recursive: true })
            }

            const invoicePath = path.join(invoicesDir, `invoice_${orderId}.pdf`)
            const doc = new PDFDocument({
                  margin: 50,
                  size: 'A4',
            })

            doc.pipe(fs.createWriteStream(invoicePath))

            doc.fontSize(20)
                  .font('Helvetica-Bold')
                  .text('INVOICE', { align: 'center' })
            doc.moveDown()

            doc.strokeColor('#999999')
                  .lineWidth(1)
                  .moveTo(50, doc.y)
                  .lineTo(550, doc.y)
                  .stroke()
            doc.moveDown()

            doc.font('Helvetica-Bold')
                  .fontSize(12)
                  .text('INVOICE DETAILS', { continued: true })
            doc.text('COMPANY DETAILS', { align: 'right' })
            doc.moveDown(0.5)

            doc.font('Helvetica')
                  .fontSize(10)
                  .text(`Invoice Number: INV-${orderId}`, { continued: false })
                  .text(`Order ID: ${orderId}`, { continued: false })
                  .text(
                        `Invoice Date: ${new Date(
                              order.invoiceDate
                        ).toLocaleDateString()}`,
                        { continued: false }
                  )
                  .text(
                        `Order Date: ${new Date(
                              order.createdAt
                        ).toLocaleDateString()}`,
                        { continued: false }
                  )

            const currentY = doc.y
            doc.font('Helvetica')
                  .fontSize(10)
                  .text('EnvrioCart', 350, currentY - 40, { continued: false })
                  .text('kolothumkadvu', { continued: false })
                  .text('vazhakkad,malappuram,kerla', { continued: false })
                  .text('Phone: +91 9995839147', { continued: false })
                  .text('Email: envrioCart@gmail.com', { continued: false })

            doc.moveDown()

            doc.strokeColor('#999999')
                  .lineWidth(1)
                  .moveTo(50, doc.y)
                  .lineTo(550, doc.y)
                  .stroke()
            doc.moveDown()

            doc.font('Helvetica-Bold')
                  .fontSize(12)
                  .text('CUSTOMER INFORMATION')
            doc.moveDown(0.5)
            doc.font('Helvetica')
                  .fontSize(10)
                  .text(`Name: ${user.name || 'Customer'}`, {
                        continued: false,
                  })
                  .text(`Email: ${user.email}`, { continued: false })
                  .text(`Phone: ${order.address?.phone || 'N/A'}`, {
                        continued: false,
                  })

            doc.moveDown()
            doc.font('Helvetica-Bold')
                  .fontSize(12)
                  .text('SHIPPING ADDRESS')
            doc.moveDown(0.5)
            doc.font('Helvetica')
                  .fontSize(10)
                  .text(`${order.address?.name || 'Home'}`, {
                        continued: false,
                  })
                  .text(`${order.address?.address || 'N/A'}`, {
                        continued: false,
                  })
                  .text(`Pincode: ${order.address?.pincode || 'N/A'}`, {
                        continued: false,
                  })

            doc.moveDown()
            doc.strokeColor('#999999')
                  .lineWidth(1)
                  .moveTo(50, doc.y)
                  .lineTo(550, doc.y)
                  .stroke()
            doc.moveDown()
            doc.font('Helvetica-Bold')
                  .fontSize(12)
                  .text('ORDER DETAILS')
            doc.moveDown()

            const tableTop = doc.y
            const tableHeaders = [
                  'Item',
                  'Color',
                  'Size',
                  'Qty',
                  'Price (Rs)',
                  'Total (Rs)',
            ]
            const columnWidths = [200, 60, 60, 60, 60, 60]

            let xPosition = 50
            doc.font('Helvetica-Bold').fontSize(10)

            tableHeaders.forEach((header, i) => {
                  doc.text(header, xPosition, tableTop, {
                        width: columnWidths[i],
                        align: 'left',
                  })
                  xPosition += columnWidths[i]
            })

            doc.strokeColor('#cccccc')
                  .lineWidth(1)
                  .moveTo(50, tableTop + 15)
                  .lineTo(550, tableTop + 15)
                  .stroke()

            doc.font('Helvetica').fontSize(10)
            let tableRowY = tableTop + 25

            // Add items
            for (const item of order.cartItems) {
                  xPosition = 50

                  if (item.image && item.image.includes('http')) {
                        try {
                              const imageResponse = await axios.get(
                                    item.image,
                                    { responseType: 'arraybuffer' }
                              )
                              const imagePath = path.join(
                                    invoicesDir,
                                    `temp_${orderId}_${item._id}.jpg`
                              )
                              fs.writeFileSync(
                                    imagePath,
                                    Buffer.from(imageResponse.data)
                              )
                              doc.image(imagePath, xPosition, tableRowY, {
                                    width: 30,
                                    height: 30,
                              })
                              fs.unlinkSync(imagePath) // Clean up temp file
                        } catch (err) {
                              console.error('Error adding product image:', err)
                        }
                  }

                  // Product details
                  doc.text(item.name, xPosition + 35, tableRowY, {
                        width: columnWidths[0] - 35,
                  })
                  xPosition += columnWidths[0]

                  doc.rect(xPosition + 10, tableRowY + 5, 10, 10).fill(
                        item.color || '#000000'
                  )
                  doc.text('', xPosition, tableRowY, { width: columnWidths[1] })
                  xPosition += columnWidths[1]

                  doc.text(item.size || 'N/A', xPosition, tableRowY, {
                        width: columnWidths[2],
                  })
                  xPosition += columnWidths[2]

                  doc.text(item.quantity.toString(), xPosition, tableRowY, {
                        width: columnWidths[3],
                  })
                  xPosition += columnWidths[3]

                  doc.text(item.price.toFixed(2), xPosition, tableRowY, {
                        width: columnWidths[4],
                  })
                  xPosition += columnWidths[4]

                  doc.text(item.total.toFixed(2), xPosition, tableRowY, {
                        width: columnWidths[5],
                  })

                  tableRowY += 40 // Increase for next row
            }

            // Line after items
            doc.strokeColor('#cccccc')
                  .lineWidth(1)
                  .moveTo(50, tableRowY - 10)
                  .lineTo(550, tableRowY - 10)
                  .stroke()

            // Totals section
            let totalsY = tableRowY + 10
            doc.font('Helvetica').fontSize(10)

            doc.text('Subtotal:', 380, totalsY)
            doc.text(`Rs:${order.totalAmount.toFixed(2)}`, 480, totalsY, {
                  align: 'right',
            })
            totalsY += 20

            if (order.discount > 0) {
                  doc.text('Discount:', 380, totalsY)
                  doc.text(`Rs:${order.discount.toFixed(2)}`, 480, totalsY, {
                        align: 'right',
                  })
                  totalsY += 20
            }

            doc.text('Delivery Charge:', 380, totalsY)
            doc.text(`Rs:${order.deliveryCharge.toFixed(2)}`, 480, totalsY, {
                  align: 'right',
            })
            totalsY += 20

            // Total row
            doc.font('Helvetica-Bold')
            doc.text('Grand Total:', 380, totalsY)
            doc.text(`Rs:${order.grandTotal.toFixed(2)}`, 480, totalsY, {
                  align: 'right',
            })
            totalsY += 30

            // Add a horizontal line
            doc.strokeColor('#999999')
                  .lineWidth(1)
                  .moveTo(50, totalsY - 10)
                  .lineTo(550, totalsY - 10)
                  .stroke()

            // Payment information
            doc.font('Helvetica-Bold')
                  .fontSize(12)
                  .text('PAYMENT INFORMATION', 50, totalsY)
            doc.moveDown(0.5)
            doc.font('Helvetica')
                  .fontSize(10)
                  .text(`Method: ${order.payment?.method || 'N/A'}`, {
                        continued: false,
                  })
                  .text(`Status: ${order.payment?.status || 'N/A'}`, {
                        continued: false,
                  })
                  .text(`Transaction ID: ${order.payment?.id || 'N/A'}`, {
                        continued: false,
                  })

            // Footer
            const pageHeight = doc.page.height
            doc.fontSize(8).text(
                  'Thank you for shopping with us!',
                  50,
                  pageHeight - 100,
                  { align: 'center' }
            )
            doc.text(
                  'For any inquiries, please contact our customer support.',
                  50,
                  pageHeight - 80,
                  { align: 'center' }
            )

            doc.end()
            await new Promise(resolve => setTimeout(resolve, 1500)) // Increased timeout to ensure PDF is fully written

            const transporter = nodemailer.createTransport({
                  service: 'gmail',
                  auth: {
                        user: process.env.AUTH_EMAIL,
                        pass: process.env.AUTH_PASS,
                  },
            })
            const mailOptions = {
                  from: process.env.AUTH_EMAIL,
                  to: user.email,
                  subject: `Invoice for Order #${orderId}`,
                  text: `Dear ${user.name ||
                        'Customer'},\n\nThank you for shopping with us! Please find attached the invoice for your order #${orderId}.\n\nOrder Date: ${new Date(
                        order.createdAt
                  ).toLocaleDateString()}\nOrder Total: ₹${
                        order.grandTotal
                  }\n\nIf you have any questions about your order, please don't hesitate to contact our customer support team.\n\nThank you for your business!`,
                  attachments: [
                        {
                              filename: `Invoice_${orderId}.pdf`,
                              path: invoicePath,
                        },
                  ],
            }
            await transporter.sendMail(mailOptions)
            fs.unlinkSync(invoicePath)

            return res
                  .status(200)
                  .json({ success: true, message: 'Invoice sent successfully' })
      } catch (error) {
            console.error(`Error while sending invoice email: ${error.message}`)
            next(error)
      }
}
export default {
      getCheckout,
      placeOrder,
      getOrderSuccess,
      ViewOrder,
      cancelOrder,
      ReOrder,
      OrderRefund,
      downloadInvoice,
}
