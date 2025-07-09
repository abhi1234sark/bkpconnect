require('dotenv').config({ path: './config.env' });
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary'); // Use destructuring import
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uploads',
    allowed_formats: [
      'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', // images
      'mp4', 'mov', 'avi', 'wmv', 'flv', 'webm', 'mkv', // videos
      'mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac',        // audio
      'txt', 'pdf', 'doc', 'docx', 'csv', 'json'        // text/docs
    ],
  },
});

const upload = multer({ storage: storage });

module.exports = { upload, cloudinary }; 