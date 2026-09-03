const express = require('express');
const router = express.Router();
const multer = require('multer');
const { detectPothole } = require('../controllers/aiController');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = file.originalname.split('.').pop() || 'jpg'
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + ext)
  }
})
const upload = multer({ storage: storage });

// POST /api/detect-pothole
router.post('/detect-pothole', upload.single('image'), detectPothole);

module.exports = router;
