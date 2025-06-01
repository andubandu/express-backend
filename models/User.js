import mongoose from 'mongoose';
import Post from './Post.js'; 

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  avatar: { type: String },
  roles: {
    type: [String],
    enum: ['user', 'moderator', 'admin'],
    default: ['user']
  },
  status: {   
    type: String, 
    enum: ['active', 'permaban', 'suspended', 'verified'],
    default: 'active' 
  },
  statusReason: { type: String },
  statusExpiry: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

userSchema.methods.isBanned = function() {
  return this.status === 'permaban' || 
         (this.status === 'suspended' && this.statusExpiry && this.statusExpiry > new Date());
};

userSchema.methods.isRestricted = function() {
  return this.status === 'restricted' && 
         (!this.statusExpiry || this.statusExpiry > new Date());
};

userSchema.methods.hasRole = function(role) {
  return this.roles.includes(role);
};

userSchema.methods.isAdmin = function() {
  return this.roles.includes('admin');
};

userSchema.methods.isModerator = function() {
  return this.roles.includes('moderator');
};

userSchema.pre('save', async function(next) {
  if (this.isModified('status')) {
    if (this.status === 'active') {
      this.statusReason = null;
      this.statusExpiry = null;
    }
    
    if (this.status === 'permaban') {
      await Post.deleteMany({ author: this._id });
    }
  }
  next();
});

userSchema.pre('findOneAndDelete', async function(next) {
  try {
    const userId = this.getQuery()._id;
    console.log('Deleting posts for deleted user ID:', userId);
    await Post.deleteMany({ author: userId });
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.pre('findOneAndUpdate', async function(next) {
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
