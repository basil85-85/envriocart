import Order from "../../models/orderSchema.js";

const reasonCancel = async (req,res) => {
    try {
        const orderId = req.query.id
        const {reason }= req.body
        const order = await Order.findById(orderId)
        if(!order){
            return res.status(401).json({success:false,message:"order is not founding"})
        }
        const updated = await Order.findByIdAndUpdate(
            orderId, 
            { 
                returnReason: reason, 
                orderStatus: 'requested'
            }, 
            { new: true }
        );
        
        if(!updated){
            return res.status(401).json({success:false,message:"order is not update something error on updating"})
        }
        return res.status(200).json({success:true,message:"sucessfully updated"})

    } catch (error) {
        console.log(`error occur on the cancel reason for due to :${error}`)
        return res.status(500).json({success:false,message:"server error occur"})
    }
}

export default {
    reasonCancel
}