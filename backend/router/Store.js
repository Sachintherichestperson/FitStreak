const express = require('express');
const router = express.Router();
const Cartmongo = require('../models/Cartmongo');
const Usermongo = require('../models/User-mongo');
const Storemongo = require('../models/Product-mongo');
const isloggedin = require('../middleware/isloggein');



router.get('/', isloggedin, async (req, res) => {
    const user = await Usermongo.findById(req.user.id);
    // const FitCoins = user.FitCoins;
    const store = await Storemongo.find();
    const FitCoinsValue = 3.33

    res.json({ FitCoins: 653, store, FitCoinsValue });
});

router.get('/Cart', isloggedin, async (req, res) => {
    try {
        const cart = await Cartmongo.findOne({ user: req.user.id })
            .populate({
                path: 'products.product',
                model: 'Products' // Must match your Product model name exactly
            })
            .exec();

        if (!cart) {
            return res.status(200).json({ 
                cart: {
                    products: [] // Return empty array if no cart exists
                } 
            });
        }

        // Transform the data for frontend
        const responseData = {
            _id: cart._id,
            user: cart.user,
            products: cart.products.map(item => ({
                _id: item._id,
                quantity: item.quantity,
                product: {
                    _id: item.product._id,
                    name: item.product.Name,
                    price: item.product.SellingPrice,
                    image: item.product.Image,
                    MaxDiscount: item.product.MaxDiscount
                }
            }))
        };

        console.log(responseData.products);

        res.status(200).json({ cart: responseData });
    } catch (error) {
        console.error('Cart fetch error:', error);
        res.status(500).json({ message: 'Error fetching cart' });
    }
});

router.put('/Cart/:itemId', isloggedin, async (req, res) => {
    try {
        const { quantity } = req.body;
        const { itemId } = req.params;

        // Validate quantity
        if (!quantity || isNaN(quantity)) {
            return res.status(400).json({ message: 'Valid quantity required' });
        }

        const cart = await Cartmongo.findOne({ user: req.user.id });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Find the item in cart
        const itemIndex = cart.products.findIndex(
            item => item._id.toString() === itemId
        );

        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        // Update quantity
        cart.products[itemIndex].quantity = quantity;

        // Save the updated cart
        const updatedCart = await cart.save();

        // Populate before sending response
        await updatedCart.populate({
            path: 'products.product',
            model: 'Products'
        });

        res.status(200).json({ 
            message: 'Quantity updated',
            updatedItem: updatedCart.products[itemIndex]
        });
    } catch (error) {
        console.error('Update quantity error:', error);
        res.status(500).json({ message: 'Error updating quantity' });
    }
});

router.delete('/Cart/:itemId', isloggedin, async (req, res) => {
    try {
        const { itemId } = req.params;

        const cart = await Cartmongo.findOne({ user: req.user.id });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Filter out the item to remove
        const initialLength = cart.products.length;
        cart.products = cart.products.filter(
            item => item._id.toString() !== itemId
        );

        // If nothing was removed
        if (initialLength === cart.products.length) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        // Save the updated cart
        const updatedCart = await cart.save();

        // Populate before sending response
        await updatedCart.populate({
            path: 'products.product',
            model: 'Products'
        });

        res.status(200).json({ 
            message: 'Item removed from cart',
            updatedCart
        });
    } catch (error) {
        console.error('Remove item error:', error);
        res.status(500).json({ message: 'Error removing item' });
    }
});

router.post('/Cart', isloggedin, async (req, res) => {
    const { productId, quantity } = req.body;

    const user = await Usermongo.findById(req.user.id);

    if (!productId || !quantity) {
        return res.status(400).json({ message: 'Product ID and quantity are required' });
    }

    try {
        let cart = await Cartmongo.findOne({ user: req.user.id });

        if (!cart) {
            cart = new Cartmongo({
                user: req.user.id,
                products: [{ product: productId, quantity }],
            });

            user.cart.push(cart._id);
            await user.save();
        } else {
            const existingProduct = cart.products.find(p => p.product.toString() === productId);

            if (existingProduct) {
                // If product already in cart, update quantity
                existingProduct.quantity += quantity;
            } else {
                // Else, push new product into cart
                cart.products.push({ product: productId, quantity });
            }
        }

        await cart.save();
        res.status(201).json({ message: 'Item added to cart', cart });
    } catch (error) {
        console.error("Error adding to cart:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;