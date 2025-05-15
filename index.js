import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import userRoutes from './routes/users.js';
import postRoutes from './routes/posts.js';
import authRoutes from './routes/auth.js';
import likeRoutes from './routes/like.js';
import commentRoutes from './routes/comment.js'; 
import followersRoutes from './routes/followers.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(express.json()); 

connectDB();

app.get('/', (req, res) => {
  res.send('hi')
});

app.use('/users', userRoutes);
app.use('/posts', postRoutes);
app.use('/auth', authRoutes);
app.use('/likes', likeRoutes);
app.use('/comments', commentRoutes); 
app.use('/followers', followersRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
