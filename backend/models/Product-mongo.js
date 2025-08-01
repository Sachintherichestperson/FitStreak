const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    Name: { type: String, required: true },
    Description: { type: String, required: true },
    SellingPrice: { type: Number, required: true },
    CostPrice: { type: Number, required: true },
    MaxDiscount: { type: Number, required: true },
    Image: { type: String, required: true },
    Sold: { type: Number, default: 0 },
    Category: { type: String, required: true },
    Stock: { type: Number, required: true },
    CreatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Products', ProductSchema);