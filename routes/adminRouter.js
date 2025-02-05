import express from 'express'
const router = express.Router()
import adminController from '../controller/admin/adminController.js'
import  auth from '../MiddleWare/auth.js'
import customerController from "../controller/admin/customerController.js"
import categoryController from "../controller/admin/categoryController.js"
import productController from "../controller/admin/productController.js"
// import multer from '../config/multer.js'
import multer from 'multer'
import path from 'path'

// Multer storage configuration
const storage = multer.diskStorage({
      destination: (req, file, cb) => {
            cb(null, 'uploads/') // Folder to store files
      },
      filename: (req, file, cb) => {
         cb(null, `${Date.now()}-${file.originalname}`);
      },
})

// Multer upload configuration for multiple files
const upload = multer({
      storage:storage,
      limits: { fileSize: 2 * 1024 * 1024 }, // Set size limit to 5MB per file
      fileFilter: (req, file, cb) => {
            const fileTypes = /jpeg|jpg|png|gif/
            const extName = fileTypes.test(
                  path.extname(file.originalname).toLowerCase()
            )
            const mimeType = fileTypes.test(file.mimetype)

            if (extName && mimeType) {
                  return cb(null, true)
            } else {
                  cb(new Error('Only image files are allowed!'))
            }
      }
})


router.get('/login', adminController.loadlogin)
router.post('/login', adminController.login)
router.get('/dashboard',auth.adminAuth,adminController.dashboard)
router.get("/page-error",adminController.pageNotfound)
router.get("/logout",adminController.logout)

// usermangement
router.get("/users",auth.adminAuth,customerController.customerInfo)
router.get("/blockCustomer",auth.adminAuth,customerController.customerBlocked)
router.get("/unblockCustomer",auth.adminAuth,customerController.customerUnblocked)

//category mangement
router.get("/category",auth.adminAuth,categoryController.categoryInfo)
router.get("/AddCategory",auth.adminAuth,categoryController.loadAddCategory)
router.post("/AddCategory",auth.adminAuth,categoryController.AddCategory)
router.patch("/category/islisted/:categoryId",auth.adminAuth,categoryController.categoryislisted)
router.get("/category/edit",auth.adminAuth,categoryController.EditCategory)
router.put("/categoryedit",auth.adminAuth,categoryController.EditingCategory)

//product mangement
router.get("/product",productController.productInfo)
router.get("/addproduct",productController.Addproduct)
router.post("/product/addproduct",productController.Addingproduct)
router.get("/product/variants",productController.Addvariants)
router.post("/product/addverient", upload.array('image', 3) ,productController.Addingvariant)
router.get("/product/view",productController.Viewproduct)
router.get("/product/editVarient",productController.editvariants)
router.put("/product/verient",upload.array('image', 3),productController.editingvariant)
export default router
