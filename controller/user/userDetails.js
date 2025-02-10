import User from '../../models/userSchema.js'

import bcrypt from 'bcrypt'

import env from 'dotenv/config'


import Product from '../../models/productSchema.js'

import Category from '../../models/categorySchema.js'
import Address from '../../models/addressSchema.js'


const profile = async (req, res) => {
    try {
        let isLoggedIn=true
        const details = await User.findById(req.session.userId)
        const address=await Address.find({userId:req.session.userId})
        return res.render('profile', { isLoggedIn ,details,address})
    } catch (error) {
        console.error('Error rendering home page:', error)
        res.status(500).render("404");
    }
};

const editDetails =async (req,res) => {
    try {
       
    
        const { name, phone } = req.body; 
        const id = req.query.id;
    
        const user = await User.findById(id);
      
        if (!user) {
            return res.status(404).json({success:false, message: "User not found" });
        }
        user.name = name || user.name;
        user.phone = phone || user.phone;
        await user.save(); 
    
        return res.status(200).json({success:true, message: "User details updated successfully" });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).render(404);
    }
    
}

const changePassword =async (req,res) => {
    try {
    const {oldPassword,newPassword}=req.body
    const id =req.query.id
    const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Old password is incorrect." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();
 
        return res.status(200).json({ success: true, message: "Password changed successfully." });

    } catch (error) {
        console.log(`error occur on the chnageing password ${error}`)
        return res.render("404")
    }
}
const Addaddress = async (req, res) => {
    try {
        const { title, address, phone, country, state, city, pincode } = req.body;
        const userId = req.query.id; 
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found. Try logging in again." });
        }
        const newAddress = new Address({
            userId,
            title,
            address,
            phone,
            country,
            state,
            city,
            pincode,
        })
        const savedAddress = await newAddress.save();
        if (savedAddress) {
            return res.status(201).json({ success: true, message: "Address saved successfully", data: savedAddress });
        } else {
            return res.status(500).json({ success: false, message: "Failed to save address"});
        }
    } catch (error) {
        console.error(`Error occurred while adding address: ${error}`);
        return res.status(500).render(404)
    }
}
const deleteAddress =async (req,res) => {
    try {
        const id=req.query.id
        if(!id){
            return res.status(404).json({ success: false, message: "Address id is not founded"})
        }
        const deleteaddress=await Address.findByIdAndDelete(id)
        if(deleteaddress){
            return res.status(201).json({ success:true, message: "deleted sucessfully"})
        }
        else{
            return res.status(404).json({ success: false, message: "faild to delete"})
        }
    } catch (error) {
        console.log(`eror occur on the deleting the address due to ${error}`)
        return res.render("404")
    }
}
const editAddress= async (req,res) => {
 try {
   const Id =req.query.id
   const {title,address, city,  pincode, phone, state}=req.body
   const AddressId=await Address.findById(Id)
   if(!AddressId){
    return res.status(404).json({ success: false, message: "address id is not founded try again"})
   }
   const updatedAddress = await Address.findByIdAndUpdate(
    Id,
    { title, address, city, pincode, phone, state }, 
    { new: true }
    );
    if(updatedAddress){
        return res.status(201).json({ success:true, message: "Updated sucessfully"})
    }
  else{
    return res.status(404).json({ success: false, message: "Updating come failed"})
  }
 } catch (error) {
    console.log(`eror occur on the editting the address due to ${error}`)
    return res.render("404")
 }   
}
export default {
   profile,
   editDetails,
   changePassword,
    Addaddress,
    deleteAddress,
    editAddress
}
