import express from 'express';
import Like from '../models/Like.js';  
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();


router.get('/', async (req, res) => {
  try {
    const { postId, userId, number = false } = req.query;

    let filter = {};
    if (postId) {
      filter.postId = postId;
    }
    if (userId) {
      filter.userId = userId;
    }

    if (postId && number) {
      const count = await Like.countDocuments({ postId });
      return res.status(200).json({ count }); 
    }
    if (userId && number) {
      const count = await Like.countDocuments({ userId });
      return res.status(200).json({ count }); 
    }

    if (!userId && !number && !postId) {
      return res.status(400).json({ error: 'At least ONE query param (postId, userId, or number) is required!' }); // Add return
    }

    const likes = await Like.find(filter);
    res.status(200).json({ likes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching likes' });
  }
});

router.post('/:postId', authenticateToken, async (req, res) => {
    try {
        const existingLike = await Like.findOne({
            userId: req.user.id,
            postId: req.params.postId,
        });

        if (existingLike) {
            await existingLike.deleteOne(); 
            return res.status(200).json({ message: 'Post unliked successfully' });
        }

        const newLike = new Like({
            userId: req.user.id,
            postId: req.params.postId,
        });

        await newLike.save();

        res.status(201).json({
            message: 'Liked post successfully',
            like: newLike
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Error toggling like' });
    }
});



export default router;
