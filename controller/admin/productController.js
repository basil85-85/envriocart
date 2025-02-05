import Product from '../../models/productSchema.js'
import Category from '../../models/categorySchema.js'
import Variant from '../../models/verientSchema.js'

import path from 'path'
import fs from 'fs'
import sharp from 'sharp'
//for list of the product page
const productInfo = async (req, res) => {
      try {
            // Validate and parse pagination parameters
            const page = Math.max(1, parseInt(req.query.page) || 1)
            const limit = 6
            const skip = (page - 1) * limit

            const totalProducts = await Product.countDocuments({})
            const totalPages = Math.ceil(totalProducts / limit)

            if (page > totalPages && totalPages > 0) {
                  return res.redirect(`/product?page=${totalPages}`)
            }

            const products = await Product.find({})
                  .populate('variants')
                  .sort({ createdAt: -1 })
                  .skip(skip)
                  .limit(limit)
                  .lean()
            products.forEach(product => {
                  product.variantCount = product.variants.length
            })

            return res.render('product-list', {
                  products,
                  pagination: {
                        currentPage: page,
                        totalPages,
                        totalItems: totalProducts,
                        hasNextPage: page < totalPages,
                        hasPrevPage: page > 1,
                  },
            })
      } catch (error) {
            console.error(
                  `Error occurred while fetching products: ${error.message}`
            )
            return res.redirect('/admin/page-error')
      }
}

//only add prioding using post
const Addproduct = async (req, res) => {
      try {
            if (req.session.admin) {
                  const categories = await Category.find({ isListed: true })

                  return res.render('product-add', { categories })
            } else {
                  return res.redirect('/admin/login')
            }
      } catch (error) {
            console.log(
                  `Error occur on the rendering the create page due to: ${error.message}`
            )
            return res.redirect('/admin/page-error')
      }
}

//post method of the adding product
const Addingproduct = async (req, res) => {
      try {
            const {
                  productName,
                  categoryName,
                  regularPrice,
                  salePrice,
                  description,
            } = req.body

            // Check if product exists using findOne instead of find
            const exproduct = await Product.findOne({
                  productName: productName,
            })

            if (exproduct) {
                  return res.json({
                        success: false,
                        message: 'Product name already exists',
                  })
            }

            const newProduct = new Product({
                  productName,
                  categoryName,
                  regularPrice,
                  salePrice,
                  description,
            })

            await newProduct.save()

            return res.json({
                  success: true,
                  message: 'Successfully added product.', // Changed from 'category' to 'product'
            })
      } catch (error) {
            console.error(`Error occurred while adding the product: ${error}`)
            return res.json({
                  success: false,
                  message: 'Internal server error',
            })
      }
}
// for viweing the varients
const Addvariants = async (req, res) => {
      try {
            if (true) {
                  const id = req.query.id
                  const findproduct = await Product.findOne({ _id: id })
                  if (findproduct) {
                        return res.render('product-varient', { findproduct })
                  }
                  return res.json({
                        success: false,
                        message: "product coundn't finding ",
                  })
            } else {
                  return res.redirect('/admin/login')
            }
      } catch (error) {
            console.log(
                  `error occur on the rendeing the varinet due to :${error}  `
            )
            return res.redirect('/admin/page-error')
      }
}
//adding the varinets of the its
const Addingvariant = async (req, res) => {
      try {
            const { color, sq, mq, lq, xlq, xxlq } = req.body
            const productId = req.query.id
            const images = []
            const existingVariant = await Variant.findOne({
                  productId: productId,
                  productcolor: color,
            })
            if (!existingVariant) {
                  if (req.files && req.files.length > 0) {
                        console.log('Handling uploaded files')
                        const resizedDir = path.join('uploads', 'resized')
                        if (!fs.existsSync(resizedDir)) {
                              fs.mkdirSync(resizedDir, { recursive: true })
                        }

                        for (let i = 0; i < req.files.length; i++) {
                              const originalImagePath = req.files[i].path
                              const resizedImagePath = path.join(
                                    resizedDir,
                                    req.files[i].filename
                              )

                              await sharp(originalImagePath)
                                    .resize({ width: 440, height: 400 })
                                    .toFile(resizedImagePath)

                              images.push(
                                    path.join('resized', req.files[i].filename)
                              )
                        }
                  }
                  const newVariant = new Variant({
                        productId,
                        productcolor: color,
                        size: {
                              S: sq || 0,
                              M: mq || 0,
                              L: lq || 0,
                              XL: xlq || 0,
                              XXL: xxlq || 0,
                        },
                        productImg: images,
                  })

                  await newVariant.save()
                  if (productId) {
                        const product = await Product.findById(productId)

                        if (product) {
                              product.variants.push(newVariant._id)
                              await product.save()
                        } else {
                              return res.status(400).json({
                                    error: 'Product not found',
                              })
                              //   console.log('Product not found');
                        }
                  } else {
                        return res.status(400).json({
                              error: 'Product ID is missing',
                        })
                        // console.log('Product ID is missing');
                  }
                  return res.status(201).json({
                        message: 'Variant added successfully',
                        variant: newVariant,
                  })
            } else {
                  return res.status(400).json({
                        error:
                              'Variant with this color already exists for this product',
                  })
            }
      } catch (error) {
            console.error('Error adding variant:', error)
            res.status(500).json({ error: 'Internal server error' })
      }
}

//for the view the of all product
const Viewproduct = async (req, res) => {
      try {
            if (req.session.admin) {
                  const productId = req.query.id
                  const products = await Product.findOne({
                        _id: productId,
                  }).populate('variants')

                  return res.render('product-view', { products })
            } else {
                  return res.redirect('/admin/login')
            }
      } catch (error) {
            console.log(
                  `Error occur on the rendering the create page due to: ${error.message}`
            )
            return res.redirect('/admin/page-error')
      }
}

//editing the verients
const editvariants = async (req, res) => {
      try {
            if (req.session.admin) {
                  const verientsid = req.query.id
                  const verient = await Variant.findById(verientsid).populate(
                        'productId'
                  )

                  return res.render('product-editverients', { verient })
            } else {
                  return res.redirect('/admin/login')
            }
      } catch (error) {
            console.log(
                  `Error occur on the rendering the create page due to: ${error.message}`
            )
            return res.redirect('/admin/page-error')
      }
}
const editingvariant = async (req, res) => {
      try {
            const { color, sq, mq, lq, xlq, xxlq } = req.body
            console.log(req.body)
            const productId = req.query.id
            const images = []
            
            console.log(req.query.id)


      } catch (error) {
            console.error('Error adding variant:', error)
            res.status(500).json({ error: 'Internal server error' })
      }
}

export default {
      productInfo,
      Addproduct,
      Addingproduct,
      Addvariants,
      Addingvariant,
      Viewproduct,
      editvariants,
      editingvariant,
}
