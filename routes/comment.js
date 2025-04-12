import express from 'express';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js'; // Import User model
import { authenticateToken } from '../middleware/auth.js';
import { upload, handleFileUpload } from '../middleware/upload.js';
import fs from 'fs';
import path from 'path';
import cloudinary from 'cloudinary';

// Configure Cloudinary
cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = express.Router();

router.get('/:postId', async (req, res) => {
    try {
        const { postId } = req.params;
        const { number } = req.query; 

        if (!postId) {
            return res.status(400).json({ error: 'Post ID is required' });
        }

        if (number) {
            const commentCount = await Comment.countDocuments({ postId });
            return res.json({ count: commentCount });
        }

        const comments = await Comment.find({ postId }).populate('author', '-password');
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(comments, null, 2));

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching comments' });
    }
});


router.post('/:postId', authenticateToken, async (req, res) => {
    try {
        const { postId } = req.params;
        const { content } = req.body; 

        if (!postId) {
            return res.status(400).json({ error: 'Post ID is required' });
        }
        if (!content) {
            return res.status(400).json({ error: 'Content is required for the comment' });
        }
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const newComment = new Comment({
            content,
            postId,
            author: req.user.id, 
        });

        const savedComment = await newComment.save();

        res.status(201).json(savedComment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating comment' });
    }
});


export default router;
