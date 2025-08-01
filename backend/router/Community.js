const express = require('express');
const router = express.Router();
const Usermongo = require('../models/User-mongo');
const Postmongo = require('../models/post-mongo');
const isloggedin = require('../middleware/isloggein');


router.get('/', async (req, res) => {
    const posts = await Postmongo.find();

    const now = new Date();

    // Add a timeAgo field to each post
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
            ...post._doc, // spread original post fields
            timeAgo       // add new field
        };
    });

    console.log(postsWithTimeAgo);


    res.status(200).json({ posts: postsWithTimeAgo });
});

async function LeaderBoard() {
  try {
    // Get top 10 users sorted by Points and Streak
    const topUsers = await Usermongo.find()
      .sort({ Points: -1, 'Streak.Scan': -1 })
      .limit(10)
      .populate('CurrentBadge', 'emoji name'); // Populate badge info

    // Format the leaderboard data
    const leaderboard = topUsers.map((user, index) => ({
      rank: index + 1,
      name: user.username,
      streak: user.Streak?.Scan || 0,
      points: user.Points || 0,
      badge: user.CurrentBadge?.name || 'Newbie',
      emoji: user.CurrentBadge?.emoji || '🌟'
    }));

    return leaderboard;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
}

router.get('/Leaderboard', isloggedin, async (req, res) => {
  try {
    const leaderboard = await LeaderBoard();
    
    // Get current user's rank
    const currentUser = await Usermongo.findById(req.user._id).populate('CurrentBadge');
    if (!currentUser) {
      return res.status(200).json({ leaderboard, currentUserRank: null });
    }

    // Count users with higher points to determine rank
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
        badge: currentUser.CurrentBadge?.name || 'Newbie',
        emoji: currentUser.CurrentBadge?.emoji || '🌟'
      }
    });
  } catch (error) {
    console.error('Error in leaderboard route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;