import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';
import os from 'os';

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith('image/') ||
    file.mimetype.startsWith('video/')
  ) {
    cb(null, true);
  } else {
    cb(
      new Error('Invalid file type. Only images and videos are allowed.'),
      false
    );
  }
};

export const upload = multer({
  dest: os.tmpdir(), // Use system temp directory instead of uploads/
  limits: {
    fileSize: 15 * 1024 * 1024,
  },
  fileFilter,
});

export const handleFileUpload = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const isVideo = req.file.mimetype.startsWith('video/');
    const uploadOptions = {
      resource_type: isVideo ? 'video' : 'image',
      ...(isVideo && {
        eager: [{ width: 720, crop: 'scale' }],
      }),
    };

    const result = await cloudinary.uploader.upload(
      req.file.path,
      uploadOptions
    );
    req.fileUrl = result.secure_url;
    req.fileType = isVideo ? 'video' : 'image';

    fs.unlinkSync(req.file.path);
    next();
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Error uploading file' });
  }
};