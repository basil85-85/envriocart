import User from '../../models/userSchema.js'

import bcrypt from 'bcrypt'

import env from 'dotenv/config'


import Product from '../../models/productSchema.js'

import Category from '../../models/categorySchema.js'


const profile = async (req, res) => {
    try {
      let isLoggedIn=true
      const details = await User.findById(req.session.userId)

        return res.render('profile', { isLoggedIn ,details});

    } catch (error) {
        console.error('Error rendering home page:', error);
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
        res.status(500).json({success:false, message: "Internal server error" });
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

export default {
   profile,
   editDetails,
   changePassword

}
