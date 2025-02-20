import Coupon from '../../models/couponSchema.js'

const getCoupon = async (req, res) => {
      try {
            // Validate and parse pagination parameters
            const page = Math.max(1, parseInt(req.query.page) || 1)
            const limit = 6
            const skip = (page - 1) * limit

            const totalCoupon = await Coupon.countDocuments({})
            const totalPages = Math.ceil(totalCoupon / limit)

            if (page > totalPages && totalPages > 0) {
                  return res.redirect(`/product?page=${totalPages}`)
            }

            const coupons = await Coupon.find({})
                  .sort({ createdAt: -1 })
                  .skip(skip)
                  .limit(limit)
                  .lean()
            if (coupons) {
                  return res.render('coupons-list', {
                        coupons,
                        pagination: {
                              currentPage: page,
                              totalPages,
                              totalItems: totalCoupon,
                              hasNextPage: page < totalPages,
                              hasPrevPage: page > 1,
                        },
                  })
            }
            return res.redirect('/dasboard')
      } catch (error) {
            console.log(`error occur on the coupon rendering due to : ${error}`)
            return res.render('pages-404')
      }
}

const getAddcoupon = async (req, res) => {
      try {
            return res.render('coupons-add')
      } catch (error) {
            console.log(
                  `error occur on the Addcoupon rendering due to : ${error}`
            )
            return res.render('pages-404')
      }
}

const addingCoupon = async (req, res) => {
      try {
            console.log(req.body)

            const {
                  status,
                  startDate,
                  endDate,
                  code,
                  minCartValue,
                  couponLimits,
                  discountType,
                  discountValue,
            } = req.body

            const formattedStartDate = new Date(
                  startDate
                        .split('-')
                        .reverse()
                        .join('-')
            )
            const formattedEndDate = new Date(
                  endDate
                        .split('-')
                        .reverse()
                        .join('-')
            )
            if (formattedStartDate > formattedEndDate) {
                  return res.status(400).json({
                        success: false,
                        message: 'start date greater than end date ',
                  })
            }

            if (
                  isNaN(formattedStartDate.getTime()) ||
                  isNaN(formattedEndDate.getTime())
            ) {
                  return res.status(400).json({
                        success: false,
                        message: "Invalid date format. Use 'YYYY-MM-DD'",
                  })
            }

            const existingCoupon = await Coupon.findOne({
                  code: { $regex: new RegExp(`^${code}$`, 'i') },
            })

            if (existingCoupon) {
                  return res.status(400).json({
                        success: false,
                        message: 'Coupon code already exists',
                  })
            }

            const newCoupon = new Coupon({
                  status,
                  startDate: formattedStartDate,
                  endDate: formattedEndDate,
                  code,
                  minCartValue,
                  couponLimits,
                  discountType,
                  discountValue,
            })

            const saved = await newCoupon.save()

            if (saved) {
                  return res.status(201).json({
                        success: true,
                        message: 'Coupon added successfully',
                  })
            } else {
                  return res.status(500).json({
                        success: false,
                        message: 'Failed to add coupon',
                  })
            }
      } catch (error) {
            console.error(`Error occurred while adding coup`)
            return res.status(500).json({success:false,messgae:`server error${error} `})
      }
}

const changeSate = async (req,res) => {
    try {
        let couponId =req.query.id 
        const coupon =await Coupon.findById(couponId)
        if(!coupon){
            return res.status(401).json({success:true,message:"coupon is not founding"})
        }
        let newSate =""
        if(coupon.status==="active"){
            newSate="inactive"
        }
        else if(coupon.status==="inactive"){
            newSate="active"
        }
        else{
            return res.status(401).json({success:false,message:"U can't chaneg the state"})
        }
        const updateState = await Coupon.findByIdAndUpdate(couponId,{status:newSate},{new:true})
        if(!updateState){
            return res.status(401).json({success:false,messgae:"not updated the state"})
        }
       
        return res.status(200).json({success:true,message:"sucessfully chanegd the state",coupon})


    } catch (error) {
        console.log(`error occur on the change the state due to :${error} `)
        return res.status(500).json({success:false,messgae:"server error occur"})
    }
}

const deleteCoupon= async (req,res) => {
    try {
         const couponId =req.query.id
        const coupon =await Coupon.findById(couponId)
        if(!coupon){
            return res.status(401).json({success:false,message:"coupon is not founding"})
        }
        const deleteCoupon = await Coupon.findByIdAndDelete(couponId)
        if(!deleteCoupon){
            return res.status(401).json({success:false,message:"coupon is not deleted "})
        }
        return res.status(200).json({success:true,message:"coupon is delected sucessfully"})

    } catch (error) {
        console.log(`error occur on the delete the due to :${error} `)
        return res.status(500).json({success:false,messgae:"server error occur"})
    }
}
export default {
      getCoupon,
      getAddcoupon,
      addingCoupon,
      changeSate,
      deleteCoupon
}
