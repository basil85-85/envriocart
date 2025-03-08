import express from 'express'
import env from 'dotenv/config'
import db from './config/db.js'
import path from 'path'
import session from 'express-session'
import errorMiddleware from './MiddleWare/ErrorHandlingMiddleWare.js'
import { passport } from './config/googleauth.js'
import errorHandling from './MiddleWare/errorHandling.js'
import { fileURLToPath } from 'url'
import userRoute from './routes/userRouter.js'
import adminRoute from './routes/adminRouter.js'
import nocache from 'nocache'
import auth from './MiddleWare/auth.js'
import morgan from 'morgan'
import fs from 'fs'


const app = express()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const accessLogStream = fs.createWriteStream(
      path.join(__dirname, 'access.log'),
      { flags: 'a' }
)

morgan.token(
      'custom-header',
      req => req.headers['user-agent'] || 'No User-Agent'
)

// app.use(
//       morgan(
//             ':method :url :status :response-time ms - :res[content-length] - :custom-header',
//             {
//                   stream: accessLogStream,
//             }
//       )
// )


app.use(morgan('dev'))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

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
app.use('/', express.static(path.join(__dirname, 'public')))
app.use('/admin', express.static(path.join(__dirname, 'public')))

app.use('/', express.static(path.join(__dirname, 'uploads')))

app.use('/admin', express.static(path.join(__dirname, 'uploads')))

app.use('/', userRoute)
app.use('/admin', adminRoute)
app.use(auth.checkBan)

db()

app.listen(process.env.PORT, () => {
      console.log(process.env.POST_LISTEN)
})
