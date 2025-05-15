import mongoose from 'mongoose';
import Post from './Post.js'; 

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  avatar: { type: String },
  status: { type: String, enum: ['active', 'permaban', 'suspended'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
});

userSchema.pre('findOneAndDelete', async function (next) {
  try {
    const userId = this.getQuery()._id;
    console.log('Deleting posts for deleted user ID:', userId);
    await Post.deleteMany({ author: userId });
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.pre('findOneAndUpdate', async function (next) {
  try {
    const update = this.getUpdate();

    if (update.status === 'permaban') {
      const userId = this.getQuery()._id;
      console.log('Deleting posts for permabanned user ID:', userId);
      await Post.deleteMany({ author: userId });
    }

    next();
  } catch (error) {
    next(error);
  }
});

export default mongoose.model('User', userSchema);
