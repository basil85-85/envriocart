import express from 'express'
import userController from '../controller/user/userController.js'
const router = express.Router()
import passport from 'passport'
import shopController from '../controller/user/shopController.js'

import userDetails from '../controller/user/userDetails.js'

import auth from '../MiddleWare/auth.js'



router.get('/', userController.loadLogHomepage)
router.get('/signup', userController.loadSignup)
router.post('/signup', userController.signup)
router.get('/login', userController.Loadlogin)
router.post('/login', userController.login)
router.get('/verify', userController.Loadverify)
router.post('/verify', userController.Verify)
router.get('/pageNotfound', userController.pageNotfound)
router.get('/auth/google', passport.authenticate('google', {scope: ['email', 'profile'] }));
router.get('/auth/google/callback', passport.authenticate('google', { successRedirect:"/", failureRedirect: '/login'  }) )
router.get("/logout",userController.logout)
                          

// shopController
router.get("/shop",shopController.shoppage)
router.get("/details",shopController.details)


//details
router.get("/profile",auth.userAuth,userDetails.profile)
router.put("/profile",auth.userAuth,userDetails.editDetails)
router.put("/changePassword",auth.userAuth,userDetails.changePassword)
router.post("/address",auth.userAuth,userDetails.Addaddress)
router.delete("/deleteAddress",auth.userAuth,userDetails.deleteAddress)
router.put("/editAddress",auth.userAuth,userDetails.editAddress)

       
export default router
 