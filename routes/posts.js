import express from 'express';
import Post from '../models/Post.js';
import { authenticateToken } from '../middleware/auth.js';
import cloudinary from '../config/cloudinary.js';
import multer from 'multer';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().populate('author', '-password');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(posts, null, 2));
  } catch (error) {
    console.error('Error fetching posts:', error); 
    res.status(500).json({ error: 'Error fetching posts' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', '-password');
    if (!post) return res.status(404).json({ error: 'Post not found' });

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(post, null, 2));
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Error fetching post' });
  }
});

router.post('/new', authenticateToken, upload.single('media'), async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    let mediaUrl = null;

    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.buffer, {
          resource_type: 'auto', 
        });
        console.log('Cloudinary upload result:', result);
        mediaUrl = result.secure_url;
      } catch (cloudinaryError) {
        console.error('Cloudinary upload error:', cloudinaryError);
        return res.status(500).json({ error: 'Error uploading media to Cloudinary' });
      }
    }

    const post = new Post({
      title,
      content,
      media: mediaUrl,
      author: req.user.id,
    });

    await post.save();

    res.status(201).json({ message: 'Post created successfully', post });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Error creating post' });
  }
});

router.delete('/del/:id', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({
      _id: req.params.id,
      author: req.user.id,
    });
    if (!post)
      return res.status(404).json({ error: 'Post not found or unauthorized' });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Error deleting post' });
  }
});

router.put('/upd/:id', authenticateToken, upload.single('media'), async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.buffer, {
          resource_type: 'auto',
        });

        console.log('Cloudinary update result:', result);

        updates.media = result.secure_url;
      } catch (cloudinaryError) {
        console.error('Cloudinary update error:', cloudinaryError);
        return res.status(500).json({ error: 'Error uploading media to Cloudinary' });
      }
    }
    updates.updatedAt = new Date();

    const post = await Post.findOneAndUpdate(
      { _id: req.params.id, author: req.user.id },
      updates,
      { new: true }
    ).populate('author', '-password');

    if (!post)
      return res.status(404).json({ error: 'Post not found or unauthorized' });
    res.json(post);
  } catch (error) {
    console.error('Error updating post:', error); 
    res.status(500).json({ error: 'Error updating post' });
  }
});

export default router;
