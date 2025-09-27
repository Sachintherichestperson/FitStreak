const express = require('express');
const router = express.Router();
const Usermongo = require('../models/User-mongo');
const Postmongo = require('../models/post-mongo');
const isloggedin = require('../middleware/isloggein');
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const Badgesfunc = require('../functions/Badges-func');

cloudinary.config({
    cloud_name: "deb6oiddj",
    api_key: "154685345461446",
    api_secret: "TSCdCqGFzoblknGCffFTtYcyE8Y",
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        // Ensure only image files are uploaded
        if (!file.mimetype.startsWith("image/")) {
            throw new Error("Only image files are allowed!");
        }
        return {
            folder: "uploads",
            format: file.mimetype.split("/")[1],
            public_id: file.originalname.split(".")[0],
        };
    },
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only images are allowed"), false);
        }
    },
});

router.get('/', isloggedin, async (req, res) => {
    const user = await Usermongo.findById(req.user.id).populate('Buddy.BuddyId').populate('Anonymous_Post').populate('CurrentBadge');
    const badgeInfo = Badgesfunc.getStreakBadge(user.Streak.Scan);

    const Level = user.CurrentBadge?.name || badgeInfo.currentBadge.name;
    const Badge = user.CurrentBadge?.emoji || badgeInfo.currentBadge.icon;

    const posts = user.Anonymous_Post;
    const Coins = user.FitCoins;

    const Buddy = user.Buddy.BuddyId;

    res.status(200).json({ user, posts, Level, Buddy, Badge, Coins });
});

router.post('/Create-Post', isloggedin, async (req, res) => {
    const { Content } = req.body;
    const user = await Usermongo.findById(req.user.id);
    const post = new Postmongo({ Content, user: user._id, CreatedAt: new Date(), Biceps: [], Fire: [], Boring: [] });
    user.Anonymous_Post.push(post._id);
    user.TotalPost += 1;
    await user.save();
    await post.save();
    res.status(201).json({ message: 'Post created successfully' });
});

router.post('/update-buddy', isloggedin, async (req, res) => {
  try {
    const { buddyId } = req.body;

    if (!buddyId) {
      return res.status(400).json({ message: 'Buddy code is required' });
    }

    const Buddy = await Usermongo.findOne({ BuddyCode: buddyId });
    if (!Buddy) {
      return res.status(404).json({ message: 'Buddy not found' });
    }

    const user = await Usermongo.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent self-buddying
    if (user._id.equals(Buddy._id)) {
      return res.status(400).json({ message: 'You cannot set yourself as your buddy' });
    }

    const now = new Date();

    // ✅ Set buddy relation both sides
    user.set('Buddy.BuddyId', Buddy._id);
    user.set('Buddy.Date', now);

    Buddy.set('Buddy.BuddyId', user._id);
    Buddy.set('Buddy.Date', now);

    await Promise.all([user.save(), Buddy.save()]);

    res.status(200).json({ message: 'Buddy updated successfully' });
  } catch (error) {
    console.error('Error updating buddy:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/Profile-Edit', isloggedin, upload.single('avatar'), async (req, res) => {
  try {
    const { username } = req.body;
    const userId = req.user._id;

    if (!username || username.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long' });
    }

    const avatar = req.file.path;

    const updatedUser = await Usermongo.findByIdAndUpdate(
      userId,
      username,
      avatar,
      { new: true }
    ).select('-password');


    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Server error while updating profile' });
  }
});

router.post('/remove-buddy', isloggedin, async function (req, res) {
  try {
    // Get the current user
    const currentUser = await Usermongo.findById(req.user.id);

    // Check if the user even has a buddy
    if (!currentUser.Buddy || !currentUser.Buddy.BuddyId) {
      return res.status(400).json({ message: "No buddy to remove." });
    }

    // Get the buddy user
    const buddyUser = await Usermongo.findById(currentUser.Buddy.BuddyId);

    if (!buddyUser) {
      return res.status(404).json({ message: "Buddy not found." });
    }

    // Remove buddy fields for current user
    currentUser.Buddy = {};

    // Remove buddy fields for the buddy user
    buddyUser.Buddy = {};

    // Save both users
    await currentUser.save();
    await buddyUser.save();

    return res.status(200).json({ message: "Buddy removed successfully." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;