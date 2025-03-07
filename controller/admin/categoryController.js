import Category from '../../models/categorySchema.js'
import Product from '../../models/productSchema.js'
const categoryInfo = async (req, res) => {
      try {
            const page = Math.max(1, parseInt(req.query.page) || 1)
            const limit = 4
            const skip = (page - 1) * limit

            const totalCategories = await Category.countDocuments({})
            const totalPages = Math.ceil(totalCategories / limit)

            if (page > totalPages && totalPages > 0) {
                  return res.redirect(`/categories?page=${totalPages}`)
            }

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
            console.error('Error in categoryInfo:', error)
            return res.status(500).render('error', {
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
      // console.log(name, description)
      try {
            const existingCategory = await Category.findOne({
                  name: { $regex: new RegExp(name, 'i') },
            })

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

const categoryislisted = async (req, res) => {
      try {
            const { categoryId } = req.params

            if (!categoryId) {
                  return res.status(400).json({
                        success: false,
                        message: 'Category ID is required',
                  })
            }

            const existingCategory = await Category.findById(categoryId)

            if (!existingCategory) {
                  return res.status(404).json({
                        success: false,
                        message: 'Category not found',
                  })
            }

            const newListingStatus = !existingCategory.isListed

            const updatedCategory = await Category.findByIdAndUpdate(
                  categoryId,
                  { $set: { isListed: newListingStatus } },
                  { new: true }
            )

            await Product.updateMany(
                  { categoryName: categoryId },
                  { $set: { isBlocked: !newListingStatus } }
            )

            return res.status(200).json({
                  success: true,
                  message: `Category ${
                        newListingStatus ? 'listed' : 'unlisted'
                  } successfully`,
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
            if (req.session.admin) {
                  const categoryId = req.query.id
                  const findCategory = await Category.findOne({
                        _id: categoryId,
                  })

                  return res.render('category-edit', { findCategory })
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
            const categoryId = req.query.id
            const { name, description } = req.body

            const existingCategory = await Category.findOne({ name })
            if (existingCategory) {
                  return res.json({
                        success: false,
                        message: "It's an existing category",
                  })
            }

            const category = await Category.findById(categoryId)
            if (!category) {
                  return res.json({
                        success: false,
                        message: 'Category not found',
                  })
            }

            const updatedCategory = await Category.findByIdAndUpdate(
                  categoryId,
                  { name, description },
                  { new: true }
            )

            if (updatedCategory) {
                  return res.json({
                        success: true,
                        message: 'Category has been updated',
                        category: updatedCategory,
                  })
            }

            res.json({ success: false, message: 'Failed to update category' })
      } catch (error) {
            console.error('Error:', error)
            res.status(500).json({
                  success: false,
                  message: 'Internal Server Error',
            })
      }
}

export default {
      categoryInfo,
      loadAddCategory,
      AddCategory,
      categoryislisted,
      EditCategory,
      EditingCategory,
}
