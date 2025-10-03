const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usermongo',
        required: true,
    },
    products: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
            quantity: { type: Number, required: true, default: 1 },
        }
    ],
    address: {
    type: {
        name: String,
        phone: String,
        street: String,
        city: String,
        state: String,
        pincode: String,
        id: String,
        isDefault: Boolean
    },
    required: true
    },
    paymentMethod: {
        type: String,
        required: true,
    },
    fitcoinsUsed: {
        type: Number,
        default: 0,
    },
    totalAmount: {
        type: Number,
        required: true,
    },
    subtotal: {
        type: Number,
        required: true,
    },
    shipping: {
        type: Number,
        default: 0,
    },
    discount: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['Pending', 'Completed', 'Cancelled'],
        default: 'Pending',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Ordermongo', orderSchema);