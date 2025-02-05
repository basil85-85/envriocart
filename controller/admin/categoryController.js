import Category from '../../models/categorySchema.js'
const categoryInfo = async (req, res) => {
      try {
            // Parse query parameters with validation
            const page = Math.max(1, parseInt(req.query.page) || 1) // Ensure page is at least 1
            const limit = 4 // Consider making this configurable
            const skip = (page - 1) * limit

            // Get total count first to validate pagination
            const totalCategories = await Category.countDocuments({})
            const totalPages = Math.ceil(totalCategories / limit)

            // Validate requested page number
            if (page > totalPages && totalPages > 0) {
                  return res.redirect(`/categories?page=${totalPages}`) // Redirect to last valid page
            }

            // Fetch categories with error handling
            const categoryData = await Category.find({})
                  .sort({ createdAt: -1 })
                  .skip(skip)
                  .limit(limit)
                  .lean()

            res.render('category-list', {
                  categories: categoryData,
                  pagination: {
                        currentPage: page,
                        totalPages,
                        totalItems: totalCategories,
                        hasNextPage: page < totalPages,
                        hasPrevPage: page > 1,
                  },
            })
      } catch (error) {
            console.error('Error in categoryInfo:', error) // More detailed error logging
            return res.status(500).render('error', {
                  // Better error handling
                  message: 'Unable to load categories. Please try again later.',
            })
      }
}
const loadAddCategory = async (req, res) => {
      try {
            if (req.session.admin) {
                  return res.render('category-add')
            }
            return res.redirect('/login')
      } catch (error) {
            console.log(`error on the catergory in adding${error}`)
            return res.json({
                  sucess: false,
                  message: 'error on due to rendering adding catergoy',
            })
      }
}

//category adding and saveing
const AddCategory = async (req, res) => {
      const { name, description } = req.body
      console.log(name, description)
      try {
            const existingCategory = await Category.findOne({ name })

            if (existingCategory) {
                  return res.json({
                        success: false,
                        message: 'Category already exists.',
                  })
            }

            const newCategory = new Category({
                  name,
                  description,
            })

            await newCategory.save()

            return res.json({
                  success: true,
                  message: 'Successfully added category.',
            })
      } catch (error) {
            console.error(`Error while adding category: ${error}`)
            return res.json({
                  success: false,
                  message: 'An error occurred while adding the category.',
            })
      }
}

//patch the true or false for category catedorgy list
const categoryislisted = async (req, res) => {
      try {
            const { categoryId } = req.params

            // Validate categoryId
            if (!categoryId) {
                  return res.status(400).json({
                        success: false,
                        message: 'Category ID is required',
                  })
            }

            // First find the category to check if it exists
            const existingCategory = await Category.findById(categoryId)

            if (!existingCategory) {
                  return res.status(404).json({
                        success: false,
                        message: 'Category not found',
                  })
            }

            // Update the category with the opposite of current isListed status
            const updatedCategory = await Category.findByIdAndUpdate(
                  categoryId,
                  { $set: { isListed: !existingCategory.isListed } },
                  { new: true }
            )

            // Log the updated category for debugging

            return res.status(200).json({
                  success: true,
                  message: 'Category updated successfully',
                  category: updatedCategory,
            })
      } catch (error) {
            console.error('Error occurred while updating the category:', error)
            return res.status(500).json({
                  success: false,
                  message: error.message || 'An error occurred',
            })
      }
}

const EditCategory = async (req, res) => {
      try {
            if(req.session.admin) {
                  const  categoryId =req.query.id
                  const findCategory = await Category.findOne({ _id: categoryId })

               
                  return res.render('category-edit',{findCategory})
            } else {

                  return res.redirect('/admin/category')
            }
      } catch (error) {
            console.log(
                  `error occur on the rendering the edit category${error}`
            )
            return res.redirect('/page-error')
      }
}
const EditingCategory = async (req, res) => {
      try {
        const categoryId = req.query.id; // Get category ID from query parameters
        const { name, description } = req.body; // Get name and description from request body
    
        // Check if a category with the same name already exists
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
          return res.json({ success: false, message: "It's an existing category" });
        }
    
        // Find the category to update by ID
        const category = await Category.findById(categoryId);
        if (!category) {
          return res.json({ success: false, message: "Category not found" });
        }
    
        // Update the category details
        const updatedCategory = await Category.findByIdAndUpdate(
          categoryId,
          { name, description }, // Update both name and description
          { new: true } // Return the updated document
        );
    
        // Check if the update was successful
        if (updatedCategory) {
          return res.json({ success: true, message: "Category has been updated", category: updatedCategory });
        }
    
        // If update failed
        res.json({ success: false, message: "Failed to update category" });
      } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
      }
    };
    

export default {
      categoryInfo,
      loadAddCategory,
      AddCategory,
      categoryislisted,
      EditCategory,
      EditingCategory
     
      
}
