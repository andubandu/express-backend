import express from 'express';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload, handleFileUpload } from '../middleware/upload.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 });
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(users, null, 2));
  } catch (error) {
    res.status(500).json({ error: 'Error fetching users' });
  }
});

router.get('/:username', async (req, res) => {
  try {
    const user = await User.findOne(
      { username: req.params.username },
      { password: 0 }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(user, null, 2));
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user' });
  }
});

router.delete('/del/:id', authenticateToken, async (req, res) => {
  try {
    console.log('Deleting user with ID:', req.params.id); // Debug log

    const user = await User.findOneAndDelete({ _id: req.params.id });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'User and associated posts deleted' });
  } catch (error) {
    console.error('Error deleting user:', error); // Debug log
    res.status(500).json({ error: 'Error deleting user' });
  }
});

router.put(
  '/upd/:id',
  authenticateToken,
  upload.single('avatar'),
  handleFileUpload,
  async (req, res) => {
    try {
      const updates = { ...req.body };
      if (req.fileUrl) {
        updates.avatar = req.fileUrl;
      }
      const user = await User.findByIdAndUpdate(req.params.id, updates, {
        new: true,
        select: '-password',
      });
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Error updating user' });
    }
  }
);

export default router;
