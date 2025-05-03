import express from 'express';
import Post from '../models/Post.js';
import { authenticateToken } from '../middleware/auth.js';
import cloudinary from '../config/cloudinary.js';
import multer from 'multer';
import { Readable } from 'stream';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

function uploadToCloudinary(fileBuffer) {
  return new Promise((resolve, reject) => {
    const stream = Readable.from(fileBuffer);
    
    const uploadStream = cloudinary.uploader.upload_stream(
      { 
        resource_type: 'auto',
        folder: 'posts' 
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return reject(error);
        }
        resolve(result);
      }
    );

    stream.pipe(uploadStream);
  });
}

router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().populate('author', '-password');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(posts, null, 2));
  } catch (error) {
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
        console.log('Uploading file:', {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        });

        const result = await uploadToCloudinary(req.file.buffer);
        console.log('Cloudinary upload successful:', result.secure_url);
        mediaUrl = result.secure_url;
      } catch (err) {
        console.error('Error uploading to Cloudinary:', err);
        return res.status(500).json({ 
          error: 'Error uploading media to Cloudinary',
          details: err.message 
        });
      }
    }

    const post = new Post({
      title,
      content,
      media: mediaUrl,
      author: req.user.id,
    });
    
    await post.save();
    const populatedPost = await post.populate('author', '-password');

    res.status(201).json({ 
      message: 'Post created successfully', 
      post: populatedPost 
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Error creating post', details: error.message });
  }
});

router.delete('/del/:id', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({ _id: req.params.id, author: req.user.id });
    if (!post) return res.status(404).json({ error: 'Post not found or unauthorized' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting post' });
  }
});

router.put('/upd/:id', authenticateToken, upload.single('media'), async (req, res) => {
  try {
    const updates = { ...req.body };

    if (req.file) {
      try {
        console.log('Updating file:', {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        });

        const result = await uploadToCloudinary(req.file.buffer);
        console.log('Cloudinary update successful:', result.secure_url);
        updates.media = result.secure_url;
      } catch (err) {
        console.error('Error uploading to Cloudinary:', err);
        return res.status(500).json({ 
          error: 'Error uploading media to Cloudinary',
          details: err.message 
        });
      }
    }

    updates.updatedAt = new Date();

    const post = await Post.findOneAndUpdate(
      { _id: req.params.id, author: req.user.id },
      updates,
      { new: true }
    ).populate('author', '-password');

    if (!post) return res.status(404).json({ error: 'Post not found or unauthorized' });

    res.json(post);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Error updating post', details: error.message });
  }
});

export default router;
