import express from 'express'
import env from 'dotenv/config'
import db from './config/db.js'
import path from 'path'
import session from 'express-session'

import { passport } from './config/googleauth.js'

import { fileURLToPath } from 'url'
import userRoute from './routes/userRouter.js'
import adminRoute from "./routes/adminRouter.js"
import nocache from 'nocache'
import auth from "./MiddleWare/auth.js"


const app = express()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


app.use(express.json({limit: '50mb'})) 
app.use(express.urlencoded({ limit: '50mb',extended: true }))

app.use( 
      session({
            secret: 'your-secret-key',
            resave: true,
            saveUninitialized: false,
            cookie: {
                  maxAge: 24 * 60 * 60 * 1000,
            },
      })
)         


                                                
app.use(passport.initialize())
app.use(passport.session())

// Setting up the view engine

app.use(nocache())                     
app.set('view engine', 'ejs')   
app.set('views', [
      path.join(__dirname, 'views/user'),
      path.join(__dirname, 'views/admin'),
])
   
// Serving static files
app.use("/",express.static(path.join(__dirname, 'public')))
app.use("/admin",express.static(path.join(__dirname, 'public')))

app.use('/',express.static(path.join(__dirname, 'uploads')));

app.use('/admin',express.static(path.join(__dirname, 'uploads')));


app.use('/', userRoute)
app.use("/admin",adminRoute)
app.use( auth.checkBan)

           
db()

app.listen(process.env.PORT, () => {
      console.log(process.env.POST_LISTEN)
})
 