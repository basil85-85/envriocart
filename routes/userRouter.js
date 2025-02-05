import express from 'express'
import userController from '../controller/user/userController.js'
const router = express.Router()
import passport from 'passport'



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

export default router
 