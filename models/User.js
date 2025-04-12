import mongoose from 'mongoose';
import Post from './Post.js'; 

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  avatar: { type: String },
  createdAt: { type: Date, default: Date.now },
});

userSchema.pre('findOneAndDelete', async function (next) {
  try {
    const userId = this.getQuery()._id;
    console.log('Deleting posts for user ID:', userId); // Debug log
    await Post.deleteMany({ author: userId }); // Delete associated posts
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.pre('remove', async function (next) {
  try {
    await Post.deleteMany({ userId: this._id });
    next();
  } catch (error) {
    next(error);
  }
});

export default mongoose.model('User', userSchema);
