
const jwt = require('jsonwebtoken');
const User = require('../models/User-mongo');

module.exports = async function (req, res, next) {
    // Check both cookie and Authorization header
    const token = req.cookies.username || req.headers.authorization?.split(' ')[1];
    // console.log('Token', token);
    
    if (!token) {
        console.log(token);
        return res.status(401).json({ message: 'Token not found' });
    }

    try {
        const decoded = jwt.verify(token, 'ewyfif8787347ry378');
        const user = await User.findOne({ email: decoded.email }).select('-password');

        if (!user) {
            return res.status(401).json({ message: 'User not found 7' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.log(error);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};
