import User from '../../models/userSchema.js'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import {promisify} from "util"

//404
 const pageNotfound =async (req,res) => {
      try {
            return res.render("pages-404")
      } catch (error) {
            console.log(`error ocur on the page not found on it ${error}`)
            return res.status(500).json("internal server error")
      }
 }

 //rendering login page
const loadlogin = (req, res) => {
      try {
            // Check if admin session exists
            if (req.session.admin) {
                  return res.redirect('/admin/dashboard') // Redirect to admin dashboard if logged in
            } else {
                  return res.render('auth-signin', { message: null }) // Render the admin login page
            }
      } catch (error) {
            console.error('Error in loadlogin:', error) // Log errors for debugging
            res.status(500).send('Something went wrong') // Send a 500 status if an error occurs
      }
}                        
// in the post of login page
const login = async (req, res) => {
      try {
            const { email, password } = req.body
            console.log(req.body)
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

            req.session.admin =admin._id
          
            

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
// rendering dashboard after the login
const dashboard=async (req,res) => {
      try {
            // Check if admin session exists
            if (req.session.admin) {
                  return res.render('index') // Redirect to admin dashboard if logged in
            } else {
                  return res.render('auth-signin', { message: null }) // Render the admin login page
            }
      } catch (error) {
            console.error('Error in loadlogin:', error) // Log errors for debugging
            res.status(500).send('Something went wrong') // Send a 500 status if an error occurs
      }
}   

// for logout
const logout = async (req, res) => {
      try {
          req.session.destroy((err)=>{
            if(err){
                  console.log(`session errror due to ${err}`)
                  return res.redirect("/page-error")
            }
            res.redirect("/admin/login")
          })
     

          
          
      } catch (error) {
          console.log(`Error occurred during logout: ${error}`);
          return res.redirect("/page-error");
      }
  };

export default { loadlogin, login ,dashboard,pageNotfound,logout}
