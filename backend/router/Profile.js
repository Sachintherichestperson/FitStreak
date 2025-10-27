const express = require('express');
const router = express.Router();
const Usermongo = require('../models/User-mongo');
const Postmongo = require('../models/post-mongo');
const isloggedin = require('../middleware/isloggein');
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const Badgesfunc = require('../functions/Badges-func');

require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.cloud_name,
    api_key: process.env.api_key,
    api_secret: process.env.api_secret,
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        const allowedTypes = ["image", "video"];
        const fileType = file.mimetype.split("/")[0];
        if (!allowedTypes.includes(fileType)) {
            throw new Error("Only image and video files are allowed!");
        }

        return {
            folder: "uploads",
            format: file.mimetype.split("/")[1],
            public_id: file.originalname.split(".")[0],
            resource_type: fileType,
        };
    },
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const fileType = file.mimetype.split("/")[0];
        if (fileType === "image" || fileType === "video") {
            cb(null, true);
        } else {
            cb(new Error("Only images and videos are allowed"), false);
        }
    },
});

router.get('/', isloggedin, async (req, res) => {
    const user = await Usermongo.findById(req.user.id).populate('Anonymous_Post').populate('CurrentBadge');
    const badgeInfo = Badgesfunc.getStreakBadge(user.Streak?.Track);

    const Level = user.CurrentBadge?.name || badgeInfo.currentBadge.name;
    const Badge = user.CurrentBadge?.emoji || badgeInfo.currentBadge.icon;

    const posts = user.Anonymous_Post;
    const Coins = user.FitCoins;

    res.status(200).json({ user, posts, Level, Badge, Coins });
});

router.post('/Create-Post',upload.single("image"), isloggedin, async (req, res) => {
    const { Content } = req.body;
    const user = await Usermongo.findById(req.user.id);

    const post = new Postmongo({ 
      Content,
      User: user._id, 
      CreatedAt: new Date(), 
      Biceps: [], 
      Fire: [],
    });

    if (req.file) {
      post.Image = req.file.path; // store path or URL
    }


    user.Anonymous_Post.push(post._id);
    user.TotalPost += 1;
    await user.save();
    await post.save();
    res.status(201).json({ message: 'Post created successfully' });
});



module.exports = router;