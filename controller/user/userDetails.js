import User from '../../models/userSchema.js'
import Order from '../../models/orderSchema.js'
import bcrypt from 'bcrypt'
import env from 'dotenv/config'
import Product from '../../models/productSchema.js'
import Category from '../../models/categorySchema.js'
import Address from '../../models/addressSchema.js'
import moment from 'moment'
import Wallet from '../../models/walletSchema.js'
const profile = async (req, res) => {
      try {
            let isLoggedIn = true

            const page = Math.max(1, parseInt(req.query.page) || 1)
            const limit = 10
            const skip = (page - 1) * limit

            const result = await Order.aggregate([
                  {
                        $group: {
                              _id: null,
                              totalRevenue: { $sum: '$grandTotal' },
                        },
                  },
            ])
            const wallet = await Wallet.findOne({ userId: req.session.userId })
            const totalTransactions = wallet ? wallet.transactions.length : 0
            const totalWalletPages = Math.ceil(totalTransactions / limit)
            const transactions = wallet
                  ? wallet.transactions.slice(skip, skip + limit)
                  : []

            const totalPrice = result.length > 0 ? result[0].totalRevenue : 0
            const totalOrder = await Order.countDocuments({
                  userId: req.session.userId,
            })
            const totalPages = Math.ceil(totalOrder / limit)

            if (page > totalPages && totalPages > 0) {
                  return res.redirect(`/profile?page=${totalPages}`)
            }

            // Fetch paginated orders
            const orders = await Order.find({ userId: req.session.userId })
                  .sort({ createdAt: -1 })
                  .skip(skip)
                  .limit(limit)
                  .lean()

            const details = await User.findById(req.session.userId)
            const address = await Address.find({ userId: req.session.userId })
            const countCart = res.locals.cartCount

            return res.render('profile', {
                  isLoggedIn,
                  wallet,
                  details,
                  address,
                  countCart,
                  orders,
                  moment,
                  totalPrice,
                  pagination: {
                        currentPage: page,
                        totalPages,
                        totalItems: totalOrder,
                        hasNextPage: page < totalPages,
                        hasPrevPage: page > 1,
                        startPage: Math.max(1, page - 2),
                        endPage: Math.min(totalPages, page + 2),
                        previousPage: page - 1,
                        nextPage: page + 1,
                  },
                  walletPagination: {
                        currentPage: page,
                        totalPages: totalWalletPages,
                        totalItems: totalTransactions,
                        hasNextPage: page < totalWalletPages,
                        hasPrevPage: page > 1,
                        startPage: Math.max(1, page - 2),
                        endPage: Math.min(totalWalletPages, page + 2),
                        previousPage: page - 1,
                        nextPage: page + 1,
                  },
            
            });
      } catch (error) {
            console.error('Error rendering profile page:', error)
            res.status(500).render('404')
      }
}

const editDetails = async (req, res) => {
      try {
            const { name, phone } = req.body
            const id = req.query.id

            const user = await User.findById(id)

            if (!user) {
                  return res
                        .status(404)
                        .json({ success: false, message: 'User not found' })
            }
            user.name = name || user.name
            user.phone = phone || user.phone
            await user.save()

            return res.status(200).json({
                  success: true,
                  message: 'User details updated successfully',
            })
      } catch (error) {
            console.error('Error updating user:', error)
            res.status(500).render(404)
      }
}

const changePassword = async (req, res) => {
      try {
            const { oldPassword, newPassword } = req.body
            const id = req.query.id
            const user = await User.findById(id)
            if (!user) {
                  return res
                        .status(404)
                        .json({ success: false, message: 'User not found.' })
            }

            const isMatch = await bcrypt.compare(oldPassword, user.password)
            if (!isMatch) {
                  return res.status(400).json({
                        success: false,
                        message: 'Old password is incorrect.',
                  })
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10)
            user.password = hashedPassword
            await user.save()

            return res.status(200).json({
                  success: true,
                  message: 'Password changed successfully.',
            })
      } catch (error) {
            console.log(`error occur on the chnageing password ${error}`)
            return res.render('404')
      }
}
const Addaddress = async (req, res) => {
      try {
            const {
                  title,
                  address,
                  phone,
                  country,
                  state,
                  city,
                  pincode,
            } = req.body
            const userId = req.query.id
            const user = await User.findById(userId)
            if (!user) {
                  return res.status(404).json({
                        success: false,
                        message: 'User not found. Try logging in again.',
                  })
            }
            console.log(req.body)

            const newAddress = new Address({
                  userId,
                  title,
                  address,
                  phone,
                  country,
                  state,
                  city,
                  pincode,
            })
            const savedAddress = await newAddress.save()
            if (savedAddress) {
                  return res.status(201).json({
                        success: true,
                        message: 'Address saved successfully',
                        data: savedAddress,
                  })
            } else {
                  return res.status(500).json({
                        success: false,
                        message: 'Failed to save address',
                  })
            }
      } catch (error) {
            console.error(`Error occurred while adding address: ${error}`)
            return res.status(500).render(404)
      }
}
const deleteAddress = async (req, res) => {
      try {
            const id = req.query.id
            if (!id) {
                  return res.status(404).json({
                        success: false,
                        message: 'Address id is not founded',
                  })
            }
            const deleteaddress = await Address.findByIdAndDelete(id)
            if (deleteaddress) {
                  return res
                        .status(201)
                        .json({ success: true, message: 'deleted sucessfully' })
            } else {
                  return res
                        .status(404)
                        .json({ success: false, message: 'faild to delete' })
            }
      } catch (error) {
            console.log(
                  `eror occur on the deleting the address due to ${error}`
            )
            return res.render('404')
      }
}
const editAddress = async (req, res) => {
      try {
            const Id = req.query.id
            const { title, address, city, pincode, phone, state } = req.body
            const AddressId = await Address.findById(Id)
            if (!AddressId) {
                  return res.status(404).json({
                        success: false,
                        message: 'address id is not founded try again',
                  })
            }
            const updatedAddress = await Address.findByIdAndUpdate(
                  Id,
                  { title, address, city, pincode, phone, state },
                  { new: true }
            )
            if (updatedAddress) {
                  return res
                        .status(201)
                        .json({ success: true, message: 'Updated sucessfully' })
            } else {
                  return res.status(404).json({
                        success: false,
                        message: 'Updating come failed',
                  })
            }
      } catch (error) {
            console.log(
                  `eror occur on the editting the address due to ${error}`
            )
            return res.render('404')
      }
}
export default {
      profile,
      editDetails,
      changePassword,
      Addaddress,
      deleteAddress,
      editAddress,
}
