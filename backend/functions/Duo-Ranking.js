const User = require('../models/User-mongo'); // Adjust path to your User model

async function getDuosRanking() {
    try {
        // Fetch all users who have a buddy
        const usersWithBuddies = await User.find({
            'Buddy.BuddyId': { $exists: true, $ne: null }
        }).populate([
            { path: 'Buddy.BuddyId', select: 'username email Points Streak FitCoins challengeWins CurrentBadge' },
            { path: 'challengeWins.challengeId', select: 'name points' },
            { path: 'CurrentBadge', select: 'name icon' }
        ]);

        if (!usersWithBuddies.length) {
            return { success: true, message: 'No users with buddies found', data: [] };
        }

        // Create a map to track processed pairs
        const processedPairs = new Set();
        const duoRankings = [];

        for (const user of usersWithBuddies) {
            const buddyId = user.Buddy.BuddyId._id.toString();

            // Skip if we've already processed this pair
            if (processedPairs.has(user._id.toString())) continue;

            // Mark both users as processed
            processedPairs.add(user._id.toString());
            processedPairs.add(buddyId);

            // Find the buddy's data (should be populated)
            const buddy = user.Buddy.BuddyId;

            // Calculate scores for both users
            const userChallengePoints = user.challengeWins.reduce((sum, win) => {
                return sum + (win.challengeId?.points || 0);
            }, 0);

            const buddyChallengePoints = buddy.challengeWins.reduce((sum, win) => {
                return sum + (win.challengeId?.points || 0);
            }, 0);

            const userScore = 
                (user.Points || 0) * 0.5 + 
                (user.Streak.Scan || 0) * 2 + 
                (user.FitCoins || 0) * 0.1 + 
                userChallengePoints * 0.8;

            const buddyScore = 
                (buddy.Points || 0) * 0.5 + 
                (buddy.Streak?.Scan || 0) * 2 + 
                (buddy.FitCoins || 0) * 0.1 + 
                buddyChallengePoints * 0.8;

            // Combined score for the duo
            const duoScore = parseFloat((userScore + buddyScore).toFixed(2));

            duoRankings.push({
                userId1: user._id,
                username1: user.username,
                email1: user.email,
                userId2: buddy._id,
                username2: buddy.username,
                email2: buddy.email,
                points1: user.Points,
                points2: buddy.Points,
                streak1: user.Streak.Scan,
                streak2: buddy.Streak?.Scan || 0,
                fitCoins1: user.FitCoins,
                fitCoins2: buddy.FitCoins,
                challengesWon1: user.challengeWins.length,
                challengesWon2: buddy.challengeWins.length,
                currentBadge1: user.CurrentBadge,
                currentBadge2: buddy.CurrentBadge,
                totalScore: duoScore
            });
        }

        // Sort by totalScore in descending order
        duoRankings.sort((a, b) => b.totalScore - a.totalScore);

        // Add ranking position
        const rankedDuos = duoRankings.map((duo, index) => ({
            rank: index + 1,
            ...duo
        }));

        return {
            success: true,
            count: rankedDuos.length,
            data: rankedDuos
        };

    } catch (error) {
        console.error('Error in getDuosRanking:', error);
        return {
            success: false,
            message: 'Failed to fetch duos ranking',
            error: error.message
        };
    }
}

module.exports = getDuosRanking;