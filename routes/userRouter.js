import express from 'express'
import userController from '../controller/user/userController.js'
const router = express.Router()
import passport from 'passport'
import shopController from '../controller/user/shopController.js'
import userDetails from '../controller/user/userDetails.js'
import cartMangement from '../controller/user/cartMangement.js'
import razorpay from "../controller/user/rozarpay.js"
import auth from '../MiddleWare/auth.js'
import cancelresaon from "../controller/user/orderReasonmangement.js"
import CheckOutmangement from '../controller/user/checkOutmangement.js'
import wislistMangement from '../controller/user/wislistMangement.js'
import walletController from '../controller/user/walletController.js'
import couponController from '../controller/user/couponController.js'
import offerController from '../controller/user/offerController.js'
import checkOutmangement from '../controller/user/checkOutmangement.js'


router.get('/', auth.cartCountMiddleware,userController.loadLogHomepage)
router.get('/signup',auth.cartCountMiddleware, userController.loadSignup)
router.post('/signup', userController.signup)
router.get('/login', auth.cartCountMiddleware,userController.Loadlogin)
router.post('/login', userController.login)
router.get('/verify',auth.cartCountMiddleware, userController.Loadverify)
router.post('/verify', userController.Verify)
router.get('/pageNotfound',auth.cartCountMiddleware, userController.pageNotfound)
router.get('/auth/google', passport.authenticate('google', {scope: ['email', 'profile'] }));
router.get('/auth/google/callback', passport.authenticate('google', { successRedirect:"envriocart.shop/", failureRedirect: '/login'  }) )
router.get("/logout",userController.logout)
router.get("/forgot",userController.forgotLoad)
router.post("/forgot",userController.checkingEmail)
router.get("/otpforgot",userController.OtpFogot)
router.post("/Otpforgot",userController.checkingOtp)
router.put("/forgotPassword",userController.forgotPassword)                                   

// shopController
router.get("/shop",auth.cartCountMiddleware,shopController.shoppage)
router.get("/details",auth.cartCountMiddleware,shopController.details)
// filteringbased the category
router.get("/filtering",auth.cartCountMiddleware,shopController.filterCategory)


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
router.put("/order/OrderRefund",auth.userAuth,checkOutmangement.OrderRefund)
router.post("/order/downloadInvoice",auth.userAuth,checkOutmangement.downloadInvoice)
//applied coupon
router.post("/checkout/applyCoupon",auth.cartCountMiddleware,auth.userAuth,couponController.applyedCoupon) 
router.delete("/checkout/removeCoupon",auth.cartCountMiddleware,auth.userAuth,couponController.removeCoupon) 


router.post("/create-order",auth.userAuth,razorpay.createOrder)
router.post('/verify-payment',auth.userAuth,razorpay.verifyPayment);
router.post('/repayment-razerPay',auth.userAuth,razorpay.RePayment)
router.post("/wallet",auth.cartCountMiddleware,auth.userAuth,walletController.createOrderWallet)
router.post("/VerifyRepayment",auth.userAuth,razorpay.RepaymentverifyPayment)    

// cancel order the reson
router.post("/profile/requestreturn",auth.userAuth,cancelresaon.reasonCancel)

//wislist 
router.post("/addWishlist",auth.userAuth,wislistMangement.addWishlist)
router.get("/wishlist",auth.userAuth,wislistMangement.getWishlist)
router.delete("/deleteWishlist",auth.userAuth,wislistMangement.deleteWishlist)
router.post("/AddCartWislist",auth.userAuth,wislistMangement.AddCartWislist)

//offer 
router.get("/offers",offerController.getOffer)
export default router
            