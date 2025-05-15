import express from 'express';
import {authenticateToken} from '../middleware/auth.js';
import Follower from '../models/Follower.js';
import User from '../models/User.js';

const router = express.Router();

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const followerDoc = await Follower.findOne({ user: id }).populate('followers', '-password');
        if (!followerDoc) return res.status(404).json({ followers: [] });

        res.status(200).json(followerDoc.followers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to get followers' });
    }
});

router.post('/:id/follow', authenticateToken, async (req, res) => {
    try {
        const followedId = req.params.id;
        const followerId = req.user.id;

        if (followedId === followerId) return res.status(400).json({ error: "Cannot follow yourself" });

        let followerDoc = await Follower.findOne({ user: followedId });

        if (!followerDoc) {
            followerDoc = new Follower({
                user: followedId,
                followers: [followerId]
            });
            await followerDoc.save();
            return res.status(200).json({ message: "Followed" });
        }

        const alreadyFollowing = followerDoc.followers.includes(followerId);

        if (alreadyFollowing) {
            followerDoc.followers = followerDoc.followers.filter(id => id.toString() !== followerId);
            await followerDoc.save();
            return res.status(200).json({ message: "Unfollowed" });
        } else {
            followerDoc.followers.push(followerId);
            await followerDoc.save();
            return res.status(200).json({ message: "Followed" });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Follow toggle failed' });
    }
});

export default router;
