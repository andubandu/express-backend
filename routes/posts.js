import express from 'express';
import Post from '../models/Post.js';
import { authenticateToken } from '../middleware/auth.js';
import cloudinary from '../config/cloudinary.js';
import multer from 'multer';
import { Readable } from 'stream';
import { generateBunnyPlaybackUrl, isValidBunnyVideoId } from '../utils/bunny.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

async function uploadToCloudinary(file) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder: 'posts',
      },
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
    const { title, content, bunnyVideoId } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    let mediaData = null;
    let postData = {
      title,
      content,
      author: req.user.id
    };

    if (bunnyVideoId) {
      try {
        if (!isValidBunnyVideoId(bunnyVideoId)) {
          return res.status(400).json({ error: 'Invalid Bunny video ID format' });
        }

        const libraryId = process.env.BUNNY_LIBRARY_ID;
        if (!libraryId) {
          return res.status(500).json({ error: 'Bunny library ID not configured' });
        }

        const playbackUrl = generateBunnyPlaybackUrl(bunnyVideoId, libraryId);
        mediaData = {
          url: playbackUrl,
          type: 'video'
        };
        postData.bunnyVideoId = bunnyVideoId;
      } catch (error) {
        console.error('Error processing Bunny video:', error);
        return res.status(500).json({ error: 'Error processing Bunny video' });
      }
    }
    else if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file);
        mediaData = {
          url: result.secure_url,
          type: result.resource_type
        };
      } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        return res.status(500).json({ error: 'Error uploading media' });
      }
    }

    if (mediaData) {
      postData.media = mediaData;
    }

    const post = new Post(postData);
    await post.save();
    const populatedPost = await post.populate('author', '-password');

    res.status(201).json({
      message: 'Post created successfully',
      post: populatedPost
    });
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
    if (!post) return res.status(404).json({ error: 'Post not found or unauthorized' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting post' });
  }
});

router.put('/upd/:id', authenticateToken, upload.single('media'), async (req, res) => {
  try {
    const updates = { ...req.body };
    const { bunnyVideoId } = req.body;

    // Handle Bunny.net video update
    if (bunnyVideoId) {
      try {
        if (!isValidBunnyVideoId(bunnyVideoId)) {
          return res.status(400).json({ error: 'Invalid Bunny video ID format' });
        }

        const libraryId = process.env.BUNNY_LIBRARY_ID;
        if (!libraryId) {
          return res.status(500).json({ error: 'Bunny library ID not configured' });
        }

        const playbackUrl = generateBunnyPlaybackUrl(bunnyVideoId, libraryId);
        updates.media = {
          url: playbackUrl,
          type: 'video'
        };
        updates.bunnyVideoId = bunnyVideoId;
      } catch (error) {
        console.error('Error processing Bunny video:', error);
        return res.status(500).json({ error: 'Error processing Bunny video' });
      }
    }
    else if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file);
        updates.media = {
          url: result.secure_url,
          type: result.resource_type
        };
        updates.bunnyVideoId = null;
      } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        return res.status(500).json({ error: 'Error uploading media' });
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
    res.status(500).json({ error: 'Error updating post' });
  }
});

export default router;