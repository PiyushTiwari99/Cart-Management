const cartModel = require('../model/cartModel')
const orderModel = require('../model/orderModel')
const validate = require('../validator/validator')
const userModel = require('../model/userModel')



/*******create order************/
const createOrder = async function (req, res) {
    try {
        const userId = req.params.userId;
        if (!validate.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, msg: "Invalid userId" });
        }
        if (userId !== req.loggedInUser) {
            return res.status(403).send({ satus: false, message: `Unauthorized access! Owner info doesn't match` })
        }
        const user = await userModel.findOne({ _id: userId });
        if (!user) {
            return res.status(404).send({ status: false, msg: "user does not exists" });
        }
        const cartPresent = await cartModel.findOne({ userId: userId });
        if (!cartPresent) {
            return res.status(404).send({ status: false, msg: "cart not found" });
        }
        const data = req.body;
        const { cartId, cancellable, status } = data;
        if (Object.keys(data).includes(cartId)) {
            return res.status(404).send({ status: false, msg: "please give cartId" });
        }
        if (cartId != cartPresent._id) {
            return res.status(403).send({ satus: false, message: `Unauthorized access! Owner info doesn't match` })
        }

        if (Object.keys(data).includes('cancellable')) {
            if (!(cancellable == true || cancellable == false)) {
                return res.status(400).send({ status: false, message: 'cancellable should be true or false' })
            };
        }

        if (Object.keys(data).includes('status')) {
            if (!validate.isValid(status)) {
                return res.status(400).send({ status: false, msg: "enter the status" });
            }
            if (!validate.isValidStatus(status)) {
                return res.status(400).send({ status: false, msg: `enter valid status` });
            }
            if ((status == 'completed' || status == 'cancelled')) {
                return res.status(400).send({ status: false, message: 'order cannot be cancelled or completed at the time of creation' })
            };
        }

        let totalQuantity = 0
        for (let i = 0; i < cartPresent.items.length; i++) {
            totalQuantity = totalQuantity + cartPresent.items[i].quantity
        }

        const newOrder = {
            userId: cartPresent.userId,
            items: cartPresent.items,
            totalPrice: cartPresent.totalPrice,
            totalItems: cartPresent.totalItems,
            totalQuantity: totalQuantity,
            cancellable,
            status,
        };
        const createOrder = await orderModel.create(newOrder);

        res.status(201).send({ status: true, message: "successfully create order", data: createOrder });


    } catch (error) {
        console.log(error)
        return res.status(500).send({ Error: error.message })
    }
}





/*******update order************/


const updateOrder = async function (req, res) {
    try {
        let reqbody = req.body

        const userId = req.params.userId
        if (!validate.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, msg: "Invalid userId" });
        }
        if (userId !== req.loggedInUser) {
            return res.status(403).send({ satus: false, message: `Unauthorized access! Owner info doesn't match` })
        }
        const user = await userModel.findOne({ _id: userId });
        if (!user) {
            return res.status(404).send({ status: false, msg: "user does not exists" });
        }

        const { orderId, status } = reqbody

        if (!validate.isValidRequestBody(reqbody)) {
            return res.status(400).send({ status: false, message: "Please enter cart details" })
        }

        if (!validate.isValid(orderId)) {
            return res.status(400).send({ status: false, message: "Please enter order Id" })
        }

        if (!validate.isValidObjectId(orderId)) {
            return res.status(400).send({ status: false, message: "Please enter valid order Id" })
        }

        const checkOrder = await orderModel.findOne({ _id: orderId, isDeleted: false })
        if (!checkOrder) {
            return res.status(400).send({ status: false, message: "Order Id not found" })
        }

        if (!validate.isValid(status)) {
            return res.status(400).send({ status: false, msg: "enter the status" });
        }
        if (!validate.isValidStatus(status)) {
            return res.status(400).send({ status: false, msg: `enter valid status` });
        }

        if (checkOrder.cancellable == false && status == 'cancelled') {
            return res.status(400).send({ status: false, message: "Can't cancel the order" })
        }
        if (checkOrder.status == 'completed') {
            return res.status(400).send({ status: false, message: "order is already completed" })
        }

        if (checkOrder.userId != userId) {
            return res.status(400).send({ status: false, message: "User Id can't match with the order Id" })
        }

        const updtOrder = await orderModel.findOneAndUpdate({ _id: orderId }, { status: status }, { new: true })
        res.status(200).send({ status: true, msg: 'sucesfully updated', data: updtOrder })
    } catch (error) {
        console.log(error)
        return res.status(500).send({ Error: error.message })
    }
}


module.exports = { createOrder, updateOrder }