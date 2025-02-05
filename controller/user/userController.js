import User from '../../models/userSchema.js'

import bcrypt from 'bcrypt'

import env from 'dotenv/config'

import nodemailer from 'nodemailer'

import crypto from 'crypto'

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
      return crypto.randomInt(100000, 999999).toString() // Secure 6-digit OTP
}

// 404 page
const pageNotfound = async (req, res) => {
      try {
            return res.render('404')
      } catch (error) {
            res.redirect('/pageNotfound')
      }
}

const loadLogHomepage = async (req, res) => {
      const userId = req.session.userId
      

      try {
            if (userId) {
                  const userData = await User.findOne({ _id: userId })

                  if (userData) {
                        return res.render('homei', {
                              isLoggedIn: true,
                        })
                  } else {
                        return res.render('homei', {
                              isLoggedIn: false,
                        })
                  } 
            } else {
                  return res.render('homei', {
                        isLoggedIn: false,
                  })
            }
      } catch (error) {
            console.error('Error rendering home page:', error)
            res.status(500).send('Server Error')
      }
}
// lodaing signup page

const loadSignup = async (req, res) => {
      try {
            return res.render('register', { message: null })
      } catch (error) {
            console.log(`Register page not loaded: ${error}`)
            res.status(500).send('Server Error')
      }
}

//old signup  using render
const signup = async (req, res) => {
      try {
            const { name, email, phone, password } = req.body

            // Check if user already exists
            const existingUser = await User.findOne({ 
                  $or: [
                      { email: email },
                      { phone: phone }
                  ] 
              });
              
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
            // Temporarily store user data with OTP (not yet saved)
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
            return res.render('login', { message: null, passwordError: null })
      } catch (error) {
            console.log(`Register page not loaded: ${error}`)
            res.status(500).send('Server Error')
      }
}

//post of the login
const login = async (req, res) => {
      try {
            const { emailOrPhone, password } = req.body
            console.log(req.body)

            // Find user with email or phone, and make sure the user isn't blocked
            const Finduser = await User.findOne({
                  $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
                  isBlocked: false
            })

            if (!Finduser) {
                  return res.json({
                        success: false,
                        message: 'User not found. Please check your credentials.',
                  })
            }

            // Check if the provided password matches the stored hash
            const isPasswordValid = await bcrypt.compare(password, Finduser.password)

            if (!isPasswordValid) {
                  return res.json({
                        success: false,
                        message: 'Incorrect password. Please try again.',
                  })
            }

            // Store user session details
            req.session.userId = Finduser._id
            req.session.isLogged = true

            // Send success response
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
            return res.render('verify')
      } catch (error) {
            console.log(`Register page not loaded: ${error}`)
            res.status(500).send('Server Error')
      }
}

//verify on resend and all the posting things
const Verify = async (req, res) => {
      try {
            const { action, code } = req.body

            // Check if session and OTP exist
            if (!req.session || !req.session.Email) {
                  return res.status(400).json({
                        success: false,
                        message: 'Session expired. Please try again.',
                  })
            }

            if (action === 'resend') {
                  // Generate a new OTP
                  const newOtp = generateOTP() // Generate 6-digit OTP

                  // Save new OTP in session
                  req.session.otp = newOtp.toString() // Convert to string for consistent comparison
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
                  // Convert both to strings and trim for comparison
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

                  // Create a new user and save to the database
                  const user = new User({
                        name,
                        email,
                        phone,
                        password: hashedPassword,
                  })

                  const savedUser = await user.save()
                  req.session.userId = savedUser._id
                  req.session.isLogged = true

                  // Clear the OTP after successful verification
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
      req.session.destroy((err) => {
            if (err) {
                console.error('Logout error:', err);
                return res.status(500).send('Error during logout');
            }
            res.redirect('/login');
        });
   } catch (error) {
       console.error(`logout error${error}`)
       res.redirect("/pageNotFound")
   }
      
  };
export default {
      loadLogHomepage,
      pageNotfound,
      loadSignup,
      signup,
      Loadlogin,
      login,
      Loadverify,
      Verify,
      logout
}
