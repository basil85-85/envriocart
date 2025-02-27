import Product from '../../models/productSchema.js'
import Category from '../../models/categorySchema.js'
import Offer from '../../models/offerSchema.js'
import moment from 'moment'
import fs from "fs" 
import path from "path"
import sharp from 'sharp'
import cron from "node-cron"



const getOffer = async (req, res) => {
      try {
            const page = Math.max(1, parseInt(req.query.page) || 1)
            const limit = 6
            const skip = (page - 1) * limit

            const totalOffer = await Offer.countDocuments({})
            const totalPages = Math.ceil(totalOffer / limit)

            if (page > totalPages && totalPages > 0) {
                  return res.redirect(`/offer?page=${totalPages}`)
            }

            const offer = await Offer.find({})
                  .populate('productIds')
                  .populate('categoryId')
                  .sort({ createdAt: -1 })
                  .skip(skip)
                  .limit(limit)
                  .lean()
            return res.render('offer-list', {
                  offer,
                  moment,
                  pagination: {
                        currentPage: page,
                        totalPages,
                        totalItems: totalOffer,
                        hasNextPage: page < totalPages,
                        hasPrevPage: page > 1,
                  },
            })
      } catch (error) {
            console.error(
                  `Error occurred while fetching Offer: ${error.message}`
            )
            return res.render('pages-404')
      }
}

const addOfferpage = async (req, res) => {
      try {
            const product = await Product.find({ isBlocked: false })
            const category = await Category.find({ isListed: true })

            return res.render('offer-Add', { product, category })
      } catch (error) {
            console.error(`error occur on the offer adding ${error}`)
            return res.render('pages-404')
      }
}

const createOffer = async (req, res) => {
      try {
            // console.log(req.body)
            let {
                  status,
                  startDate,
                  endDate,
                  offerName,
                  description,
                  offerType,
                  productIds, // Array of product IDs for multiple selection
                  categoryId,
                  discountType,
                  discountValue,
            } = req.body

            // Parse dates from dd-mm-yyyy format
            const [startDay, startMonth, startYear] = startDate
                  .split('-')
                  .map(Number)
            const [endDay, endMonth, endYear] = endDate.split('-').map(Number)

            const start = new Date(startYear, startMonth - 1, startDay)
            const end = new Date(endYear, endMonth - 1, endDay)
            const currentDate = new Date()
            // console.log(start)
            // console.log(end)
            // console.log(currentDate)
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                  return res
                        .status(400)
                        .json({ message: 'Invalid date format' })
            }
            
            if (start > currentDate) {
                  status = "upcoming"; 
              } else if (end < currentDate) {
                  status = "expired"; 
              } else {
                  status = "active"; 
              }
            if (end <= start) {
                  return res.status(400).json({
                        message: 'End date must be after the start date',
                  })
            }

            if (
                  offerType === 'product' &&
                  (!productIds || productIds.length === 0)
            ) {
                  return res
                        .status(400)
                        .json({
                              message:
                                    'At least one product must be selected for product offers',
                        })
            }

            if (offerType === 'category' && !categoryId) {
                  return res
                        .status(400)
                        .json({
                              message:
                                    'Category must be selected for category offers',
                        })
            }

            // Validate discount value
            if (
                  !discountValue ||
                  isNaN(parseFloat(discountValue)) ||
                  parseFloat(discountValue) <= 0
            ) {
                  return res
                        .status(400)
                        .json({ message: 'Valid discount value is required' })
            }

            // Additional validation for percentage discount
            if (
                  discountType === 'percentage' &&
                  parseFloat(discountValue) > 100
            ) {
                  return res
                        .status(400)
                        .json({
                              message: 'Percentage discount cannot exceed 100%',
                        })
            }
            const existingName = await Offer.findOne({offerName:{ $regex: new RegExp(`^${offerName}$`, 'i')} })
             if(existingName){
                  return res.status(400).json({success:false,message:"name already added in it"})
             }
            
            if (offerType === 'product') {
                  const existingOffers = await Offer.find({
                      status: "active",
                      productIds: { $in: productIds }, // Check if any product is already in an active offer
                      endDate: { $gte: currentDate } // Check if the offer is still active
                  });
      
                  if (existingOffers.length > 0) {
                      return res.status(400).json({
                          message: 'One or more selected products are already in an active offer',
                      });
                  }
              }
      

              if (offerType === 'category') {
                  const existingCategoryOffer = await Offer.findOne({
                      status: "active",
                      categoryId: categoryId,
                      endDate: { $gte: currentDate }
                  });
      
                  if (existingCategoryOffer) {
                      return res.status(400).json({
                          message: 'An active offer already exists for this category',
                      });
                  }
              }
              
            const newOffer = new Offer({
                  status,
                  offerName,
                  description,
                  startDate: start,
                  endDate: end,
                  offerType,
                  productIds: offerType === 'product' ? productIds : [], // Store array of product IDs
                  categoryId: offerType === 'category' ? categoryId : null,
                  discountType,
                  discountValue: parseFloat(discountValue), // Convert to number
            })

            await newOffer.save()
            res.status(201).json({
                  message: 'Offer created successfully',
                  offer: newOffer,
            })
      } catch (error) {
            console.error(
                  `Error occurred on the create offer page due to: ${error}`
            )
            return res.render('pages-404')
      }
}

const changeState = async (req, res) => {
      try {
            let offerId = req.query.id
            if (!offerId) {
                  return res
                        .status(401)
                        .json({
                              success: false,
                              message: 'Offer id is not founding',
                        })
            }
            const offer = await Offer.findById(offerId)
            if (!offer) {
                  return res
                        .status(401)
                        .json({
                              success: false,
                              message: 'Not Founding to Offer in it try again',
                        })
            }
            let newOfferStatus = ''
            if (offer.status === 'active') {
                  newOfferStatus = 'inactive'
            } else if (offer.status === 'inactive') {
                  newOfferStatus = 'active'
            } else {
                  return res
                        .status(401)
                        .json({
                              success: false,
                              message: "Experive state can't be change",
                        })
            }
            offer.status = newOfferStatus
            const updateOffer = await Offer.findByIdAndUpdate(
                  offerId,
                  { status: newOfferStatus },
                  { new: true }
            )
            if (!updateOffer) {
                  return res
                        .status(401)
                        .json({
                              success: false,
                              message: 'Not updated the state',
                        })
            }
            return res
                  .status(200)
                  .json({
                        success: true,
                        message: 'Changeing State sucessfully',
                        offer,
                  })
      } catch (error) {
            console.log(
                  `error occur on the changeing the state due to :${error}`
            )
            return res
                  .status(500)
                  .json({ success: false, message: 'sever error occur' })
      }
}

const getofferphoto = async (req, res) => {
      try {
            const offerId = req.query.id
            const offer = await Offer.findById(offerId)
            if(!offer){
                  return res.status(401).render("pages-404")
            }
            return res.render("offer-photo",{offer})
      } catch (error) {
            console.log(`error occur on the photo of the offerpage to due:${error}`)
            return res.render("pages-404")
      }
}


const photo = async (req, res) => {
      try {
          const offerId = req.query.id;
  
          if (!offerId) {
              return res.status(400).json({ 
                  success: false, 
                  message: "Offer ID is required" 
              });
          }
  
          if (!req.file) {
              return res.status(400).json({ 
                  success: false, 
                  message: "No file uploaded" 
              });
          }
  
          const PUBLIC_DIR = 'public';
          const IMAGES_DIR = path.join(PUBLIC_DIR, 'images', 'offers');
  

          if (!fs.existsSync(IMAGES_DIR)) {
              fs.mkdirSync(IMAGES_DIR, { recursive: true });
          }
  
          const uniqueFilename = `${Date.now()}-${req.file.originalname}`;
          const imagePath = path.join(IMAGES_DIR, uniqueFilename);
          

          await sharp(req.file.path)
              .resize({ width:1700, height: 500, fit: 'cover' })
              .toFile(imagePath);
  

          const existingOffer = await Offer.findById(offerId);
          if (!existingOffer) {
   
              if (fs.existsSync(imagePath)) {
                  fs.unlinkSync(imagePath);
              }
              return res.status(404).json({ 
                  success: false, 
                  message: "Offer not found" 
              });
          }
  
          if (existingOffer.image) {
              try {
                  const oldImagePath = path.join(process.cwd(), 'public', existingOffer.image);
                  if (fs.existsSync(oldImagePath)) {
                      fs.unlinkSync(oldImagePath);
                  }
              } catch (error) {
                  console.warn('Could not delete old image:', error.message);
              }
          }
  
          // Store the public URL path in the database
          const publicPath = `/images/offers/${uniqueFilename}`;
          existingOffer.image = publicPath;
          await existingOffer.save();
  
          // Clean up original uploaded file
          try {
              fs.unlinkSync(req.file.path);
          } catch (error) {
              console.warn('Could not delete temporary file:', error.message);
          }
  
          return res.status(200).json({
              success: true,
              message: "Image saved successfully",
              image: existingOffer.image
          });
  
      } catch (error) {
          console.error('Error in photo upload:', error);
          return res.status(500).json({ 
              success: false, 
              message: "Server error", 
              error: error.message 
          });
      }
  };


  const updateExpiredCoupon = async () => {
      try {
          const today = new Date();
          today.setHours(0, 0, 0, 0); 
  
          await Offer.updateMany(
              { endDate: { $lte: today }, status: "active" },
              { $set: { status: "expired" } }
          );
  
  
          await Offer.updateMany(      
              { startDate: { $lte: today }, status: "upcoming" },
              { $set: { status: "active" } }
          );
       
        
      } catch (error) {
          console.error(` Error updating coupon statuses: ${error.message}`);
      }
  };
                    
  
  cron.schedule("0 0 * * *", updateExpiredCoupon);
      
  updateExpiredCoupon();

export default {
      getOffer,
      addOfferpage,
      createOffer,
      changeState,
      getofferphoto,
      photo
}
