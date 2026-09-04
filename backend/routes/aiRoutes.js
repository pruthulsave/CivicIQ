const express = require('express');
const router = express.Router();
const multer = require('multer');
const { detectIssue } = require('../controllers/aiController');

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

// POST /api/detect
router.post('/detect', upload.single('image'), detectIssue);

module.exports = router;
