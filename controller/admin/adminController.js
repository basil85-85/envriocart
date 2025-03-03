import User from '../../models/userSchema.js'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import { promisify } from 'util'
import Verient from '../../models/verientSchema.js'
import Order from '../../models/orderSchema.js'
import Product from '../../models/productSchema.js'
import Category from '../../models/categorySchema.js'

//404
const pageNotfound = async (req, res) => {
      try {
            return res.render('pages-404')
      } catch (error) {
            console.log(`error ocur on the page not found on it ${error}`)
            return res.status(500).json('internal server error')
      }
}

//rendering login page
const loadlogin = (req, res) => {
      try {
            if (req.session.admin) {
                  return res.redirect('/admin/dashboard')
            } else {
                  return res.render('auth-signin', { message: null })
            }
      } catch (error) {
            console.error('Error in loadlogin:', error)
            res.status(500).send('Something went wrong')
      }
}
// in the post of login page
const login = async (req, res) => {
      try {
            const { email, password } = req.body

            const admin = await User.findOne({
                  email: email,
                  isAdmin: true,
            })

            if (!admin) {
                  return res.json({
                        success: false,
                        message: 'Invalid email or password.',
                  })
            }

            const passwordMatch = await bcrypt.compare(password, admin.password)
            if (!passwordMatch) {
                  return res.json({
                        success: false,
                        message: 'Invalid email or password.',
                  })
            }

            req.session.admin = admin._id

            return res.json({
                  success: true,
                  message: 'Login successful',
                  adminId: admin._id,
                  email: admin.email,
            })
      } catch (error) {
            console.error('Login error:', { error, email: req.body.email })
            return res.json({
                  success: false,
                  message: 'An error occurred during login.',
            })
      }
}

// Dashboard Controller
const dashboard = async (req, res, next) => {
      try {
            const range = parseInt(req.query.range) || 30
            const startDate = new Date()

            startDate.setDate(startDate.getDate() - range)

            const orders = await Order.find({
                  createdAt: { $gte: startDate },
            }).sort({ createdAt: 1 })

            const statusCounts = {
                  Pending: 0,
                  Processing: 0,
                  Shipped: 0,
                  Delivered: 0,
                  Cancelled: 0,
                  Requested: 0,
                  Approved: 0,
                  Rejected: 0,
            }

            const paymentCounts = {
                  'CASH ON DELIVERY': 0,
                  'RAZOR PAY': 0,
                  Wallet: 0,
            }

            const dailyData = {}
            const dates = []

            for (let i = range; i >= 0; i--) {
                  const date = new Date()
                  date.setDate(date.getDate() - range + i)
                  const dateString = date.toISOString().split('T')[0]
                  dates.push(dateString)
                  dailyData[dateString] = { orders: 0, revenue: 0 }
            }

            let totalRevenue = 0

            orders.forEach(order => {
                  if (statusCounts.hasOwnProperty(order.orderStatus)) {
                        statusCounts[order.orderStatus]++
                  }
                  if (
                        order.payment &&
                        paymentCounts.hasOwnProperty(order.payment.method)
                  ) {
                        paymentCounts[order.payment.method]++
                  }

                  const dateString = new Date(order.createdAt)
                        .toISOString()
                        .split('T')[0]
                  if (dailyData[dateString]) {
                        dailyData[dateString].orders++
                        dailyData[dateString].revenue += order.grandTotal || 0
                  }
                  totalRevenue += order.grandTotal || 0
            })

            const avgOrderValue =
                  orders.length > 0 ? totalRevenue / orders.length : 0
            const stageDurations = [1, 2, 3, 1]

            const salesData = await Order.aggregate([
                  { $match: { createdAt: { $gte: startDate } } },
                  {
                        $group: {
                              _id: {
                                    year: { $year: '$createdAt' },
                                    month: { $month: '$createdAt' },
                                    day: { $dayOfMonth: '$createdAt' },
                              },
                              salesCount: { $sum: 1 },
                              salesRevenue: { $sum: '$grandTotal' },
                        },
                  },
                  { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
            ])

            const formattedSalesData = Object.fromEntries(
                  salesData.map(({ _id, salesCount, salesRevenue }) => [
                        `${_id.year}-${_id.month}-${_id.day}`,
                        { orders: salesCount, revenue: salesRevenue },
                  ])
            )
            const topProducts = await Order.aggregate([
                  { $unwind: "$cartItems" }, 
                  {
                        $group: {
                              _id: "$cartItems.verientId", 
                              totalSold: { $sum: "$cartItems.quantity" },
                              productDetails: { $first: "$cartItems" }
                        }
                  },
                  { $sort: { totalSold: -1 } },
                  { $limit: 10 },
                  {
                        $lookup: {
                              from: "verients", 
                              localField: "_id",
                              foreignField: "_id",
                              as: "productInfo"
                        }
                  },
                  { $unwind: "$productInfo" }, 
                  {
                        $project: {
                              _id: 0, 
                              productId: "$_id",
                              totalSold: 1,
                              name: "$productDetails.name",
                              color: "$productDetails.color",
                              size: "$productDetails.size",
                              price: "$productDetails.price",
                              image: "$productDetails.image",
                              categoryId: "$productInfo.categoryName", 
                              productInfo: 1, 
                        }
                  }
            ]);
            const topCategories = await Product.aggregate([
                  {
                        $group: {
                              _id: "$categoryName",
                              productCount: { $sum: 1 }
                        }
                  },
                  { $sort: { productCount: -1 } },
                  { $limit: 10 },
                  {
                        $lookup: {
                              from: "categories",
                              localField: "_id",
                              foreignField: "_id",
                              as: "categoryDetails"
                        }
                  },
                  { $unwind: "$categoryDetails" },
                  {
                        $project: {
                              _id: 0,
                              categoryId: "$_id",
                              categoryName: "$categoryDetails.name",
                              productCount: 1
                        }
                  }
            ]);
            
            console.log(topCategories);
           
            const dashboardData = {
                  summary: {
                        totalOrders: orders.length,
                        totalRevenue,
                        avgOrderValue,
                        pendingOrders: statusCounts['Pending'],
                  },
                  statusCounts,
                  paymentCounts,
                  dailyData,
                  dates,
                  stageDurations,
                  salesData: formattedSalesData,
            }

            if (
                  req.headers.accept &&
                  req.headers.accept.includes('application/json')
            ) {
                  return res.json(dashboardData,topProducts,topCategories)
            }
            //      console.log("top product",topProducts)
                 console.log("top category",topCategories)
            res.render('index', { dashboardData,topProducts,topCategories})
      } catch (error) {
            console.error('Error generating dashboard data:', error)
            next(error)
      }
}

// for logout
const logout = async (req, res) => {
      try {
            req.session.destroy(err => {
                  if (err) {
                        console.log(`session errror due to ${err}`)
                        return res.redirect('/page-error')
                  }
                  res.redirect('/admin/login')
            })
      } catch (error) {
            console.log(`Error occurred during logout: ${error}`)
            return res.redirect('/page-error')
      }
}

export default { loadlogin, login, dashboard, pageNotfound, logout }
