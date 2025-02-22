import User from '../../models/userSchema.js'

import bcrypt from 'bcrypt'

import env from 'dotenv/config'

import nodemailer from 'nodemailer'

import crypto from 'crypto'

import Product from '../../models/productSchema.js'
import Verient from '../../models/verientSchema.js'
import Category from '../../models/categorySchema.js'
import Offer from '../../models/offerSchema.js' 


// Create transporter
const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
            user: process.env.AUTH_EMAIL,
            pass: process.env.AUTH_PASS,
      },
})

//verification meassge
transporter.verify((error, success) => {
      if (error) {
            console.error(`error ocur in the transpoter ${error}`)
      } else {
            console.log(`your email is connected :${success}`)
      }
})

//gernating otp
const generateOTP = () => {
      return crypto.randomInt(100000, 999999).toString()
}

// 404 page
const pageNotfound = async (req, res) => {
      try {
            return res.render('404')
      } catch (error) {
            res.redirect('/pageNotfound')
      }
}

//loding the home dpage 
const loadLogHomepage = async (req, res) => {
      try {
          
          let userId 
          if(req.session.passport){
            req.session.userId=req.session.passport.user;
          } 
          userId=req.session.userId;
          const offerProducts = await Offer.find({ status: "active" })
                  .sort({discountType: -1,      
                        discountValue: -1    }) 
                  .populate({
                  path: "productIds",
                  model: "Product",
                  populate: {
                        path: "variants",
                        model: "Verient",
                  },
                  }).populate("categoryId")
                 
      //      console.log(offerProducts)
          let products = await Product.find({ isBlocked: false }).populate("variants");
          products = products.filter(product => product.variants.length > 0);
  
          const category = await Category.find({ isListed: true });
          const countCart =res.locals.cartCount
        
          let isLoggedIn = false;
          if (userId) {
              const userData = await User.findOne({ _id: userId, isBlocked: false });
  
              if (userData) {
                  isLoggedIn = true;
              }
          }
          return res.render('homei', { isLoggedIn, products:offerProducts, category ,countCart});
  
      } catch (error) {
          console.error('Error rendering home page:', error);
          res.status(500).render("404");
      }
  };
// lodaing signup page
const loadSignup = async (req, res) => {
      try {
            const userId = req.session.userId;
            console.log(userId)
            if (!userId) {
                  return res.render('register', { message: null })
            } else {
                  return res.redirect('/')
            }
      } catch (error) {
            console.log(`Register page not loaded: ${error}`)
            res.status(500).render("404")
      }
}

//old signup  using render
const signup = async (req, res) => {
      try {
            const { name, email, phone, password } = req.body

            // Check if user already exists
            const existingUser = await User.findOne({
                  $or: [{ email: email }, { phone: phone }],
            })

            if (existingUser) {
                  return res.json({
                        success: false,
                        message: 'User already exists',
                  })
            }

            // Generate OTP
            const otp = generateOTP()

            // Send OTP via email
            const mailOptions = {
                  from: process.env.AUTH_EMAIL,
                  to: email,
                  subject: 'Your OTP for Registration',
                  text: `Your OTP is: ${otp}. `,
            }
            req.session.EmailOPtion = mailOptions

            await transporter.sendMail(mailOptions)
            console.log('OTP sent successfully:', otp)
            req.session.otp = otp
            req.session.Email = email

            req.session.user = {
                  name,
                  email,
                  phone,
                  password,
            }

            return res.json({
                  success: true,
                  message:
                        'OTP sent to your email. Complete verification to finish registration.',
            })
      } catch (error) {
            console.error(`Error in signup: ${error}`)
            return res.status(500).json({
                  success: false,
                  message: 'An error occurred during signup.',
            })
      }
}

// get the page of loginpage
const Loadlogin = async (req, res) => {
      try {
            if (! req.session.userId) {
                  return res.render('login', {
                        message: null,
                        passwordError: null,
                  })
            } else {
                  return res.redirect('/')
            }
      } catch (error) {
            console.log(`Register page not loaded: ${error}`)
            res.status(500).render("404")
      }
}

//post of the login
const login = async (req, res) => {
      try {
            const { emailOrPhone, password } = req.body
            

            // Find user with email or phone, and make sure the user isn't blocked
            const Finduser = await User.findOne({
                  $or: [{ email: emailOrPhone }, { phone: emailOrPhone }]
                
            })

            if (!Finduser) {
                  return res.json({
                        success: false,
                        message:
                              'User not found. Please check your credentials.',
                  })
            }
            if (Finduser.isBlocked) {
                  return res.json({ success: false, message: "Your account is blocked. Please contact support." });
              }

            // Check if the provided password matches the stored hash
            const isPasswordValid = await bcrypt.compare(
                  password,
                  Finduser.password
            )

            if (!isPasswordValid) {
                  return res.json({
                        success: false,
                        message: 'Incorrect password. Please try again.',
                  })
            }

            req.session.userId = Finduser._id
            req.session.isLogged = true
            return res.json({
                  success: true,
                  message: 'Successfully logged in.',
            })
      } catch (error) {
            console.error('Error during login:', error)
            return res.status(500).json({
                  success: false,
                  message: 'An error occurred during login. Please try again.',
            })
      }
}

//loading page verify page
const Loadverify = async (req, res) => {
      try {
            const userId = req.session.userId;
            if (!userId) {
                  if (req.session.user) {
                        return res.render('verify')
                  }
                  return res.redirect('/signup')
            } else {
                  return res.redirect('/')
            }
      } catch (error) {
            console.log(`Register page not loaded: ${error}`)
            res.status(500).render("404")
      }
}

//verify on resend and all the posting things
const Verify = async (req, res) => {
      try {
            const { action, code } = req.body
            if (!req.session || !req.session.Email) {
                  return res.status(400).json({
                        success: false,
                        message: 'Session expired. Please try again.',
                  })
            }

            if (action === 'resend') {
                  // Generate a new OTP
                  const newOtp = generateOTP()
                  req.session.otp = newOtp.toString() 
                  console.log(`new Otp generated sucessfully:  ${newOtp}`)
                  const mailOptions = {
                        from: process.env.AUTH_EMAIL,
                        to: req.session.Email,
                        subject: 'Your OTP for Registration',
                        text: `Your OTP is: ${newOtp}.`,
                  }

                  await transporter.sendMail(mailOptions)
                  return res.status(200).json({
                        success: true,
                        message: 'New OTP has been sent successfully',
                  })
            } else if (action === 'verify') {
            
                  const sessionOtp = req.session.otp
                        ? req.session.otp.toString().trim()
                        : ''
                  const submittedCode = code ? code.toString().trim() : ''

                  if (
                        !sessionOtp ||
                        !submittedCode ||
                        sessionOtp !== submittedCode
                  ) {
                        return res.status(400).json({
                              success: false,
                              message: 'Invalid or expired OTP',
                        })
                  }

                  const { name, email, phone, password } = req.session.user
                  // Hash the password
                  const hashedPassword = await bcrypt.hash(password, 10)
                  const user = new User({
                        name,
                        email,
                        phone,
                        password: hashedPassword,
                  })

                  const savedUser = await user.save()
                  req.session.userId = savedUser._id
                  req.session.isLogged = true
                  delete req.session.otp

                  return res.status(200).json({
                        success: true,
                        message: 'User verified successfully',
                  })
            } else {
                  return res.status(400).json({
                        success: false,
                        message: 'Invalid action provided',
                  })
            }
      } catch (error) {
            console.error(`Error in OTP verification/resend:`, error)
            return res.status(500).json({
                  success: false,
                  message: 'An error occurred during the process.',
            })
      }
}

//logout the user
const logout = (req, res) => {
      try {
            req.session.destroy(err => {
                  if (err) {
                        console.error('Logout error:', err)
                        return res.status(500).send('Error during logout')
                  }
                  res.redirect('/')
            })
      } catch (error) {
            console.error(`logout error${error}`)
            res.redirect('/pageNotFound')
      }
}
const forgotLoad = async (req,res) => {
      try {
            const userId = req.session.userId;
            console.log(userId)
            if (!userId) {
                  return res.render('forgot')
            } else {
                  return res.redirect('/')
            }
      } catch (error) {
            console.log(`forgot page not loaded: ${error}`)
            res.status(500).render("404")
      }    
}

const checkingEmail = async (req,res) => {
      try {
            const { email } = req.body
            const user = await User.findOne({email:email})
            if(!user){
                  return res.status(401).json({success:false,message:"User is not founding"})
            }
             // Generate OTP
             const otp = generateOTP()

             // Send OTP via email
             const mailOptions = {
                   from: process.env.AUTH_EMAIL,
                   to: email,
                   subject: 'Your OTP for Forgot password',
                   text: `Your OTP is: ${otp}. `,
             }
             req.session.EmailOPtion = mailOptions
 
             await transporter.sendMail(mailOptions)
             console.log('OTP sent successfully:', otp)
             req.session.otp = otp
             req.session.Email = email
            return res.status(201).json({success:true,message:"Otp is sending sucessfulyy"})
      } catch (error) {
            console.log(`forgot page not posting email: ${error}`)
            res.status(500).render("404")
      }
}
const OtpFogot = async (req,res) => {
      try {
            const userId = req.session.userId;
            console.log(userId)
            if (!userId && req.session.otp) {
                  return res.render('Otpforgot')
            } else {
                  return res.redirect('/')
            }
      } catch (error) {
            console.log(`forgot page not loaded: ${error}`)
            res.status(500).render("404")
      }  
}
const checkingOtp = async (req,res) => {
      try {
            const { action, code } = req.body
            if (!req.session || !req.session.Email) {
                  return res.status(400).json({
                        success: false,
                        message: 'Session expired. Please try again.',
                  })
            }

            if (action === 'resend') {
                  // Generate a new OTP
                  const newOtp = generateOTP()
                  req.session.otp = newOtp.toString() 
                  console.log(`new Otp generated sucessfully:  ${newOtp}`)
                  const mailOptions = {
                        from: process.env.AUTH_EMAIL,
                        to: req.session.Email,
                        subject: 'Your OTP for Registration',
                        text: `Your OTP is: ${newOtp}.`,
                  }

                  await transporter.sendMail(mailOptions)
                  return res.status(200).json({
                        success: true,
                        message: 'New OTP has been sent successfully',
                  })
            } else if (action === 'verify') {
            
                  const sessionOtp = req.session.otp
                        ? req.session.otp.toString().trim()
                        : ''
                  const submittedCode = code ? code.toString().trim() : ''

                  if (
                        !sessionOtp ||
                        !submittedCode ||
                        sessionOtp !== submittedCode
                  ) {
                        return res.status(400).json({
                              success: false,
                              message: 'Invalid or expired OTP',
                        })
                  }
                  
                  
                  delete req.session.otp

                  return res.status(200).json({
                        success: true,
                        message: 'User verified successfully',
                  })
            } else {
                  return res.status(400).json({
                        success: false,
                        message: 'Invalid action provided',
                  })
            }
      } catch (error) {
            console.log(`forgot page not checking otp: ${error}`)
            res.status(500).render("404")
      }
}
const forgotPassword = async (req,res) => {
 try {
      const { password } = req.body;
      const email = req.session.Email;

      if (!email) {
          return res.status(400).json({ success: false, message: "Session expired. Please request OTP again." });
      }
      const user = await User.findOne({ email });

      if (!user) {
          return res.status(404).json({ success: false, message: "User not found." });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      user.password = hashedPassword;
      await user.save();

      return res.status(200).json({ success: true, message: "Password updated successfully." });

 } catch (error) {
      console.log(`error occur on the Pasward saving du to:${error}`)
      return res.render("404")
 }      
}
export default {
      loadLogHomepage,
      pageNotfound,
      loadSignup,
      signup,
      Loadlogin,
      login,
      Loadverify,
      Verify,
      logout,
      forgotLoad,
      checkingEmail,
      OtpFogot,
      checkingOtp,
      forgotPassword
}
