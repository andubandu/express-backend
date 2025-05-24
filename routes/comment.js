import express from 'express';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import cloudinary from '../config/cloudinary.js';
import multer from 'multer';
import { Readable } from 'stream';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

async function uploadToCloudinary(file) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'auto', folder: 'comments' },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
          return;
        }
        resolve(result);
      }
    );
    const stream = Readable.from(file.buffer);
    stream.pipe(uploadStream);
  });
}

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
router.post('/:postId', authenticateToken, upload.single('media'), async (req, res) => {
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

    let mediaData = null;
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file);
        mediaData = { url: result.secure_url, type: result.resource_type };
      } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        return res.status(500).json({ error: 'Error uploading media' });
      }
    }

    const newComment = new Comment({
      content,
      postId,
      author: req.user.id,
      media: mediaData,
    });

    const savedComment = await newComment.save();
    const populatedComment = await savedComment.populate('author', '-password');

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creating comment' });
  }
});

router.put('/:postId/:commentId', authenticateToken, async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to edit this comment' });
    }

    comment.content = content;
    await comment.save();

    res.json({ message: 'Comment updated successfully', comment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error updating comment' });
  }
});

router.delete('/:postId/:commentId', authenticateToken, async (req, res) => {
  try {
    const { postId, commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to delete this comment' });
    }

    await Comment.findByIdAndDelete(commentId);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error deleting comment' });
  }
});

export default router;
