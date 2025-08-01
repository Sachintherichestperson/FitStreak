const express = require('express');
const router = express.Router();
const Usermongo = require('../models/User-mongo');
const Postmongo = require('../models/post-mongo');
const isloggedin = require('../middleware/isloggein');


router.get('/', isloggedin, async (req, res) => {
    const user = await Usermongo.findById(req.user.id).populate('Buddy.BuddyId').populate('Anonymous_Post').populate('CurrentBadge');
    const Level = user.CurrentBadge.name;
    
    const posts = user.Anonymous_Post;

    const Buddy = user.Buddy.BuddyId;
    console.log(posts);

    res.status(200).json({ user, posts, Level, Buddy });
});

router.post('/Create-Post', isloggedin, async (req, res) => {
    const { Content } = req.body;
    console.log(Content);
    const user = await Usermongo.findById(req.user.id);
    const post = new Postmongo({ Content, user: user._id, CreatedAt: new Date(), Biceps: 0, Fire: 0, Boring: 0 });
    user.Anonymous_Post.push(post._id);
    user.TotalPost += 1;
    await user.save();
    await post.save();
    console.log(Content);
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

module.exports = router;