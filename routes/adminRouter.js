import express from 'express'
const router = express.Router()
import adminController from '../controller/admin/adminController.js'
import  auth from '../MiddleWare/auth.js'
import customerController from "../controller/admin/customerController.js"
import categoryController from "../controller/admin/categoryController.js"
import productController from "../controller/admin/productController.js"
import offerController from '../controller/admin/offerController.js'
import couponController from '../controller/admin/couponController.js'
import orderController from '../controller/admin/orderController.js'
import saleController from '../controller/admin/saleController.js'

// import multer from '../config/multer.js'
import multer from 'multer'
import path from 'path'


const storage = multer.diskStorage({
      destination: (req, file, cb) => {
            cb(null, 'uploads/') // Folder to store files
      },
      filename: (req, file, cb) => {
         cb(null, `${Date.now()}-${file.originalname}`);
      },
})

const upload = multer({
      storage:storage,
      limits: { fileSize: 2 * 1024 * 1024 }, 
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
router.get('/dashboard',adminController.dashboard)
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
router.get("/product",auth.adminAuth,productController.productInfo)
router.get("/addproduct",auth.adminAuth,productController.Addproduct)
router.post("/product/addproduct",auth.adminAuth,productController.Addingproduct)
router.get("/product/variants",auth.adminAuth,productController.Addvariants)
router.post("/product/addverient",auth.adminAuth, upload.array('image', 3) ,productController.Addingvariant)
router.get("/product/view",auth.adminAuth,productController.Viewproduct)
router.get("/product/editVarient",auth.adminAuth,productController.editvariants)
router.put("/product/verient",auth.adminAuth,productController.editingvariant)
router.get("/product/edit",auth.adminAuth,productController.editproduct)
router.put("/product/editproduct",auth.adminAuth,productController.editingProduct)
router.patch("/product/isblock",auth.adminAuth,productController.isblocked)
router.put("/product/image-upload",auth.adminAuth,upload.array('image', 3),productController.ImageUpdate)

//order mangement controller
router.get("/order",auth.adminAuth,orderController.getOrders)
router.get("/order/view",auth.adminAuth,orderController.ViewOrders)
router.put("/order/changestatus",auth.adminAuth,orderController.changeStatus)
router.put("/order/cancel",auth.adminAuth,orderController.cancelOrder)
router.post("/order/requestreturn",auth.adminAuth,orderController.reasonCancel)
router.put("/order/approvel",auth.adminAuth,orderController.approvel)


//offer mangement controller
router.get("/offer",auth.adminAuth,offerController.getOffer)
router.get("/offer/add",auth.adminAuth,offerController.addOfferpage)
router.post("/offer/create",auth.adminAuth,offerController.createOffer)
router.put("/offer/changeState",auth.adminAuth,offerController.changeState)
router.get("/offer/addphoto",auth.adminAuth,offerController.getofferphoto)
router.post("/offer/addphoto",auth.adminAuth,upload.single('image'), offerController.photo);

//coupon mangement controller
router.get("/coupon",auth.adminAuth,couponController.getCoupon)
router.get("/coupon/add",auth.adminAuth,couponController.getAddcoupon)
router.post("/coupon/add",auth.adminAuth,couponController.addingCoupon)
router.put("/coupon/changeState",auth.adminAuth,couponController.changeSate)
router.delete("/coupon/delect",auth.adminAuth,couponController.deleteCoupon)


// sale report
router.get("/sale-Report",auth.adminAuth,saleController.getSalereport)
router.post("/sale-report/filter",saleController.getSaleReportFiltering)
router.get('/sale-report/download',auth.adminAuth,saleController.downloadReport);





export default router              
