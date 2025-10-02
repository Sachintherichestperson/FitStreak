const express = require('express');
const router = express.Router();
const Usermongo = require('../models/User-mongo');
const Postmongo = require('../models/post-mongo');
const isloggedin = require('../middleware/isloggein');
const Badgesfunc = require('../functions/Badges-func');


router.get('/', async (req, res) => {
    const posts = await Postmongo.find();

    const now = new Date();

    const postsWithTimeAgo = posts.map(post => {
        const createdAt = new Date(post.CreatedAt);
        const diffMs = now - createdAt;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        let timeAgo;
        if (diffHours < 24) {
            timeAgo = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        } else {
            timeAgo = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        }

        return {
            ...post._doc, 
            timeAgo       
        };
    });

    res.status(200).json({ posts: postsWithTimeAgo });
});

async function LeaderBoard() {
  try {
    const topUsers = await Usermongo.find()
      .sort({ Points: -1, 'Streak.Scan': -1 })
      .limit(10)
      .populate('CurrentBadge', 'emoji name');

        const leaderboard = topUsers.map((user, index) => {
          const badgeInfo = Badgesfunc.getStreakBadge(user.Streak?.Scan || 0);
          
          return {
            rank: index + 1,
            name: user.username,
            streak: user.Streak?.Scan || 0,
            points: user.Points || 0,
            badge: user.CurrentBadge?.name || badgeInfo.currentBadge.name,
            emoji: user.CurrentBadge?.emoji || badgeInfo.currentBadge.icon,
          };
        });


    return leaderboard;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
}

router.get('/Leaderboard', isloggedin, async (req, res) => {
  try {
    const leaderboard = await LeaderBoard();
    
    const currentUser = await Usermongo.findById(req.user._id).populate('CurrentBadge');

    if (!currentUser) {
      return res.status(200).json({ leaderboard, currentUserRank: null });
    }

    const badgeInfo = Badgesfunc.getStreakBadge(currentUser.Streak.Scan);
    
    const userRank = await Usermongo.countDocuments({
      $or: [
        { Points: { $gt: currentUser.Points } },
        { 
          Points: currentUser.Points,
          'Streak.Scan': { $gt: currentUser.Streak?.Scan || 0 }
        }
      ]
    }) + 1;

    res.status(200).json({ 
      leaderboard,
      currentUserRank: {
        rank: userRank,
        name: currentUser.username,
        streak: currentUser.Streak?.Scan || 0,
        points: currentUser.Points || 0,
        badge: currentUser.CurrentBadge?.name || badgeInfo.currentBadge.name,
        emoji: currentUser.CurrentBadge?.emoji ||  badgeInfo.currentBadge.emoji,
      }
    });
  } catch (error) {
    console.error('Error in leaderboard route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/Reaction/:postId', isloggedin, async (req, res) => {
  const { postId } = req.params;
  const { type } = req.query;
  const userId = req.user._id;
  const user = await Usermongo.findById(userId);

  const validReactions = ['Biceps', 'Fire', 'Boring'];
  if (!validReactions.includes(type)) {
    return res.status(400).json({ message: 'Invalid reaction type' });
  }

  const post = await Postmongo.findById(postId);
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  let alreadyReactedType = null;
  for (let reaction of validReactions) {
    if (post[reaction].some((id) => id.toString() === userId.toString())) {
      alreadyReactedType = reaction;
      break;
    }
  }

  if (alreadyReactedType === type) {
    return res.status(400).json({ message: 'You have already voted with this reaction.' });
  }

  if (alreadyReactedType) {
    post[alreadyReactedType] = post[alreadyReactedType].filter(
      (id) => id.toString() !== userId.toString()
    );
  }

  post[type].push(userId);
  user.Reactions += 1; 
  
  await user.save();
  await post.save();

  return res.status(200).json(post);

});

router.post('/Comment/:id', isloggedin, async (req, res) => {
  try {
    console.log("H");
    const postId = req.params.id;
    const userId = req.user._id;
    const { Content } = req.body;

    if (!Content || Content.trim() === "") {
      return res.status(400).json({ success: false, message: "Comment cannot be empty" });
    }

    const post = await Postmongo.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    post.Comment.push({ UserId: userId, Comment: Content.trim() });

    await post.save();

    return res.status(200).json({ success: true, message: "Comment added successfully", post });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;