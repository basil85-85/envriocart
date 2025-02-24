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

            // let category = await Category.findOne({categoryName});


            const exproduct = await Product.findOne({
                  productName: { $regex: new RegExp(productName, "i") }
              });

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
                  // category:category
            })

            await newProduct.save()

            return res.json({
                  success: true,
                  message: 'Successfully added product.',
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
            console.log("sdncjsbxvjbh dsbh")
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
                  }).populate('variants').populate('categoryName')

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
          const { color, sizes } = req.body;
          const variantId = req.query.id;
  
          console.log('Received data:', req.body);
  
          // Validate inputs
          if (!color || !sizes) {
              return res.status(400).json({
                  success: false,
                  message: "Color and sizes are required"
              });
          }
  
          // Get existing variant
          const existingVariant = await Variant.findById(variantId);
          if (!existingVariant) {
              return res.status(404).json({
                  success: false,
                  message: "Variant not found"
              });
          }
  
          // Initialize all required sizes with 0
          const processedSizes = {
              S: 0,
              M: 0,
              L: 0,
              XL: 0,
              XXL: 0
          };
  
          // Update with provided sizes
          Object.entries(sizes).forEach(([size, quantity]) => {
              // Convert size to uppercase to match schema
              const upperSize = size.toUpperCase();
              if (processedSizes.hasOwnProperty(upperSize)) {
                  processedSizes[upperSize] = Math.max(0, parseInt(quantity) || 0);
              }
          });
  
          // Validate that at least one size has quantity
          const totalQuantity = Object.values(processedSizes).reduce((sum, qty) => sum + qty, 0);
          if (totalQuantity === 0) {
              return res.status(400).json({
                  success: false,
                  message: "At least one size must have a quantity greater than 0"
              });
          }
  
          // Update variant with new data
          const updatedVariant = await Variant.findByIdAndUpdate(
              variantId,
              {
                  productcolor: color,
                  size: processedSizes
              },
              {
                  new: true,
                  runValidators: true
              }
          );
  
          if (!updatedVariant) {
              return res.status(500).json({
                  success: false,
                  message: "Failed to update variant"
              });
          }
  
          // Send success response
          res.status(200).json({
              success: true,
              message: "Variant updated successfully",
              variant: updatedVariant
          });
  
      } catch (error) {
          console.error("Error updating variant:", error);
          res.status(500).json({
              success: false,
              message: error.message || "Internal server error"
          });
      }
  };



//page rendering the page of verients
const editproduct = async (req, res) => {
      try {
            if (req.session.admin) {
                  const productId = req.query.id
                  const products = await Product.findById(productId).populate('variants')
                  const categories = await Category.find({isListed:true})
                 
                  return res.render('product-editp', { products,categories})
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
//editing the product the not veritend
const editingProduct = async (req, res) => {
    try {
        const productid  = req.query.id; 
        const { productName, categoryName, regularPrice, salePrice, description } = req.body;
        const existingProduct = await Product.findOne({ productName });

        if (existingProduct && existingProduct._id.toString() !==productid ) {
            return res.status(400).json({ message: "Product already exists with this name" });
        }
        
        const updatedProduct = await Product.findByIdAndUpdate(
            productid, 
            { productName, categoryName, regularPrice, salePrice, description },
            { new: true } // This returns the updated product
        );

        if (!updatedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.status(200).json({ message: "Product updated successfully", product: updatedProduct });

    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}
//is productblocking
const isblocked=async (req,res) => {
      try {
            const { productId, isBlocked } = req.body;
    
            if (!productId) {
                return res.status(400).json({
                    success: false,
                    message: 'Product ID is required'
                });
            }

      const product = await Product.findByIdAndUpdate(
            productId,
            { isBlocked: isBlocked },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.status(200).json({
            success: true,
            message: `Product ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
            product
        });

    } catch (error) {
        console.error('Error in toggleProductStatus:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}
const ImageUpdate = async (req, res) => {
      try {
          const productId = req.query.id;
          const index = req.query.index;
          const images = [];
  
          if (!productId || !index) {
              return res.status(400).json({
                  success: false,
                  message: "Missing product ID or index"
              });
          }
  
          if (req.files && req.files.length > 0) {
              console.log('Handling uploaded files');
              const resizedDir = path.join('uploads', 'resized');
              
              if (!fs.existsSync(resizedDir)) {
                  fs.mkdirSync(resizedDir, { recursive: true });
              }
  
              for (let i = 0; i < req.files.length; i++) {
                  const originalImagePath = req.files[i].path;
                  const resizedImagePath = path.join(
                      resizedDir,
                      req.files[i].filename
                  );
  
                  await sharp(originalImagePath)
                      .resize({ width: 440, height: 400 })
                      .toFile(resizedImagePath);

                  fs.unlink(originalImagePath, (err) => {
                      if (err) console.error('Error deleting original:', err);
                  });
  
                  images.push(
                      path.join('resized', req.files[i].filename)
                  );
              }
  
              const variant = await Variant.findById(productId);
              if (!variant) {
                  return res.status(400).json({
                      success: false,
                      message: "Variant not found"
                  });
              }

              if (variant.productImg[index]) {
                  const oldImagePath = path.join('uploads', variant.productImg[index]);
                  if (fs.existsSync(oldImagePath)) {
                      fs.unlink(oldImagePath, (err) => {
                          if (err) console.error('Error deleting old image:', err);
                      });
                  }
              }
  
              variant.productImg[index] = images[0]; 
              await variant.save();

              return res.json({
                  success: true,
                  message: "Image uploaded successfully",
                  imageUrl: `/${images[0]}`
              });
          } else {
              return res.status(400).json({
                  success: false,
                  message: "No files uploaded"
              });
          }
  
      } catch (error) {
          if (req.files) {
              req.files.forEach(file => {
                  if (file.path) {
                      fs.unlink(file.path, (err) => {
                          if (err) console.error('Error cleaning up:', err);
                      });
                  }
              });
          }
  
          return res.status(500).json({
              success: false,
              message: "Server error during upload"
          });
      }
  };

export default {
      productInfo,
      Addproduct,
      Addingproduct,
      Addvariants,
      Addingvariant,
      Viewproduct,
      editvariants,
      editingvariant,
      editproduct,
      editingProduct,
      isblocked,
      ImageUpdate

}
