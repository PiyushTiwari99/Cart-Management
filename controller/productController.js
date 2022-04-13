const productModel = require('../model/productModel')
const validate = require('../validator/validator')
const { uploadFile } = require('./awsController')

const isValid = function (value) {
    if (typeof value === undefined || typeof value === null) return false
    if (typeof value === 'string' && value.trim().length > 0) return true
}

const createProduct = async function (req, res) {
    try {
        const data = req.body
        const files = req.files

        if (files.length == 0) { return res.status(400).send({ status: fale, message: "Please provide product's image" }) }

        const { title, description, price, style, availableSizes, installments } = data

        if (!isValid(title)) {
            return res.status(400).send({ status: false, message: "Please provide product's title" })
        }

        const alreadyTitle = await productModel.findOne({ title })
        if (alreadyTitle) {
            return res.status(400).send({ status: false, message: "Products title is already exists" })
        }

        if (!isValid(description)) {
            return res.status(400).send({ status: false, message: "Please provide product's description" })
        }


        if (!isValid(price)) {
            return res.status(400).send({ status: false, message: "Please provide product's price" })
        }

        if (!isValid(style)) {
            return res.status(400).send({ status: false, message: "Please provide product's style" })
        }

        if (!isValid(availableSizes)) {
            return res.status(400).send({ status: false, message: "please provide the product size" })
        }

        if (!isValid(installments)) {
            return res.status(400).send({ status: false, message: "Please provide product's installments" })
        }


        const newProductImage = await uploadFile(files[0])

        const productData = { title, description, price, productImage: newProductImage, style, availableSizes, installments }

        const newProduct = await productModel.create(productData)

        return res.status(201).send({ status: true, data: newProduct })

    } catch (error) {
        console.log(error)
        return res.status(500).send({ Error: error.message })
    }
}
const getProduct = async (req, res) => {
    try {
        let filterQuery = { isDeleted: false, deletedAt: null };
        let filter = req.query;
        let Sort;

        if (validate.isValidRequestBody(filter)) {
            let { name, size, priceSort, priceGreaterThan, priceLessThan } = filter;

            if (Object.keys(filter).includes('name')) {
                filterQuery.title = { $regex: `.*${name.trim()}.*` };
            }
            if (Object.keys(filter).includes('priceSort')) {
                if (priceSort == "ascending") {
                    Sort = 1;
                }
                if (priceSort == "decending") Sort = -1;
                // else {
                //     return res.status(400).send({ status: false, message: "Please give ascending or decending price sort" })
                // }
            }

            if (Object.keys(filter).includes('size')) {
                //size valid to be completed
                filterQuery.availableSizes = { size }
            }

            if (Object.keys(filter).includes('priceGreaterThan')) {
                //num validation
                if (Object.keys(filter).includes('priceLessThan')) {
                    filterQuery.price = { $gte: priceGreaterThan, $lte: priceLessThan };
                }
                filterQuery.price = { $gte: priceGreaterThan };
            }
            if (Object.keys(filter).includes('priceLessThan')) {
                if (Object.keys(filter).includes('priceGreaterThan')) {
                    filterQuery.price = { $gte: priceGreaterThan, $lte: priceLessThan };
                }
                filterQuery.price = { $lte: priceLessThan };
            }
            // if (Object.keys(filter).includes(('priceLessThan' && 'priceGreaterThan'))) {
            //     filterQuery.price = { $gte: priceGreaterThan, $lte: priceLessThan };
            // }
        }
        console.log(filterQuery)

        const product = await productModel.find(filterQuery).sort({ price: Sort });
        if (product.length == 0) {
            return res.status(400).send({ status: false, msg: "no product found" });
        }

        res.status(201).send({ status: true, data: product });
    } catch (error) {
        res.status(500).send({ status: false, msg: error.message });
    }
};


/// get Product by id ------------------------------------

const getProductbyid = async function (req, res) {

    try {
        const productId = req.params.productId
        if (!(isValid(productId))) { return res.status(400).send({ status: false, message: "productId is required" }) }
        if (!validate.isValidObjectId(productId)) { return res.status(400).send({ status: false, message: "Valid productId is required" }) }


        const product = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!product) { return res.status(400).send({ status: false, message: "No data found" }) }

        return res.status(200).send({ status: true, message: "Product Data", data: product })
    }
    catch (err) {
        console.log(err)
        res.status(500).send({ message: err.message })
    }
}



const Productupdate = async function (req, res) {
    try {
        let reqBody = req.body
        let id = req.params.productId
        if (Object.keys(reqBody).length == 0) {
            return res.status(400).send({ status: false, msg: "No data found" })
        }


        const { title, description, price, isFreeShipping, style, availableSizes, installments } = reqBody

        const findProduct = await productModel.findOne({ _id: id, isDeleted: false })
        if (!findProduct) {
            return res.status(404).send({ status: false, msg: "product id does not exists" })
        }

        const ProductData = {
            title: title, description: description, price: price, currencyId: "₹", currencyFormat: "INR",
            isFreeShipping: isFreeShipping,
            style: style, availableSizes: availableSizes, installments: installments
        }
        let updateProduct = await productModel.findOneAndUpdate({ _id: id },
            ProductData, { new: true })
        res.status(200).send({ status: true, msg: 'Success', data: { updateProduct } })


    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}


/****************************delete product******************************/


const deleteProductById = async function (req, res) {
    try {
        const productId = req.params.productId

        const searchProduct = await productModel.findOne({ _id: productId, isDeleted: false })

        if (!searchProduct) {
            return res.status(400).send({ status: false, message: "product does't exists" })
        }

        const deleteProduct = await productModel.findOneAndUpdate({ _id: productId, isDeleted: false }, { isDeleted: true, deletedAt: new Date() }, { new: true })

        res.status(200).send({ status: true, message: "successfully deleted", data: deleteProduct })
    } catch (error) {
        console.log(error)
        return res.status(500).send({ Error: error.message })
    }
}


module.exports = { createProduct, getProduct, getProductbyid, Productupdate, deleteProductById }
