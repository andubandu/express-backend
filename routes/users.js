import express from 'express';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload, handleFileUpload } from '../middleware/upload.js';

const router = express.Router();

const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.isAdmin()) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error checking admin status' });
  }
};

const isModeratorOrAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || (!user.isModerator() && !user.isAdmin())) {
      return res.status(403).json({ error: 'Moderator or admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error checking moderator status' });
  }
};



router.get('/by-user/:username', async (req, res) => {
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

router.get('/currentProfile', authenticateToken, async (req, res) => { 
  try {
    const user = await User.findById(req.user.id, { password: 0 });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user by ID' });
  }
});

router.put('/status/:id', authenticateToken, isModeratorOrAdmin, async (req, res) => {
  try {
    const { status, statusReason, statusExpiry } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (status === 'permaban') {
      const requestingUser = await User.findById(req.user.id);
      if (!requestingUser.isAdmin()) {
        return res.status(403).json({ error: 'Only admins can issue permanent bans' });
      }
    } 


    user.status = status;
    user.statusReason = statusReason;
    user.statusExpiry = statusExpiry;
    
    await user.save();
    res.json({ message: 'User status updated successfully', user });
  } catch (error) {
    res.status(500).json({ error: 'Error updating user status' });
  }
});

router.put('/roles/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { roles } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { roles },
      { new: true, select: '-password' }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User roles updated successfully', user });
  } catch (error) {
    res.status(500).json({ error: 'Error updating user roles' });
  }
});

router.delete('/del/:id', authenticateToken, async (req, res) => {
  try {
    const requestingUser = await User.findById(req.user.id);
    const targetUserId = req.params.id;

    if (req.user.id !== targetUserId && !requestingUser?.isAdmin?.()) {
      return res.status(403).json({ error: 'Forbidden: You cannot delete this user' });
    }

    const user = await User.findOneAndDelete({ _id: targetUserId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'User and associated posts deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
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
      const requestingUser = await User.findById(req.user.id);
      const targetUserId = req.params.id;

      if (req.user.id !== targetUserId && !requestingUser?.isAdmin?.()) {
        return res.status(403).json({ error: 'Forbidden: You cannot update this user' });
      }

      const updates = { ...req.body };
      if (req.fileUrl) {
        updates.avatar = req.fileUrl;
      }

      const user = await User.findByIdAndUpdate(targetUserId, updates, {
        new: true,
        select: '-password',
      });

      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Error updating user' });
    }
  }
);


export default router;