import express from 'express'
import userController from '../controller/user/userController.js'
const router = express.Router()
import passport from 'passport'
import shopController from '../controller/user/shopController.js'

import userDetails from '../controller/user/userDetails.js'
import cartMangement from '../controller/user/cartMangement.js'

import auth from '../MiddleWare/auth.js'

import CheckOutmangement from '../controller/user/checkOutmangement.js'



router.get('/', auth.cartCountMiddleware,userController.loadLogHomepage)
router.get('/signup',auth.cartCountMiddleware, userController.loadSignup)
router.post('/signup', userController.signup)
router.get('/login', auth.cartCountMiddleware,userController.Loadlogin)
router.post('/login', userController.login)
router.get('/verify',auth.cartCountMiddleware, userController.Loadverify)
router.post('/verify', userController.Verify)
router.get('/pageNotfound',auth.cartCountMiddleware, userController.pageNotfound)
router.get('/auth/google', passport.authenticate('google', {scope: ['email', 'profile'] }));
router.get('/auth/google/callback', passport.authenticate('google', { successRedirect:"/", failureRedirect: '/login'  }) )
router.get("/logout",userController.logout)
router.get("/forgot",userController.forgotLoad)
router.post("/forgot",userController.checkingEmail)
router.get("/otpforgot",userController.OtpFogot)
router.post("/Otpforgot",userController.checkingOtp)
router.put("/forgotPassword",userController.forgotPassword)                                   

// shopController
router.get("/shop",auth.cartCountMiddleware,shopController.shoppage)
router.get("/details",auth.cartCountMiddleware,shopController.details)


//details
router.get("/profile",auth.cartCountMiddleware,auth.userAuth,userDetails.profile)
router.put("/profile",auth.userAuth,userDetails.editDetails)
router.put("/changePassword",auth.userAuth,userDetails.changePassword)
router.post("/address",auth.userAuth,userDetails.Addaddress)
router.delete("/deleteAddress",auth.userAuth,userDetails.deleteAddress)
router.put("/editAddress",auth.userAuth,userDetails.editAddress)

//cartMangement
router.post("/addCart",auth.userAuth,cartMangement.AddCart)
router.get("/cart",auth.cartCountMiddleware,auth.userAuth,cartMangement.getCart)
router.delete("/deleteCart",auth.userAuth,cartMangement.deleteCart)
router.put("/updateCartQuantity",auth.userAuth,cartMangement.quantityCart)


// checkout
router.get("/checkout",auth.cartCountMiddleware,auth.userAuth,CheckOutmangement. getCheckout)
router.post('/placeOrder',auth.cartCountMiddleware,auth.userAuth,CheckOutmangement.placeOrder)
router.get("/order-success",auth.cartCountMiddleware,auth.userAuth,CheckOutmangement.getOrderSuccess)
router.get("/viewsorders",auth.cartCountMiddleware,auth.userAuth,CheckOutmangement.ViewOrder)
router.put("/cancelorder",auth.cartCountMiddleware,auth.userAuth,CheckOutmangement.cancelOrder)
router.put("/reorder",auth.cartCountMiddleware,auth.userAuth,CheckOutmangement.ReOrder)

export default router
            