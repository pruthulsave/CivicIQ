const fs = require('fs');
const Complaint = require('../models/Complaint');

const detectIssue = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  const imagePath = req.file.path;
  const { latitude, longitude, target_image } = req.body;
  
  try {
    let nearby_images = [];
    
    // If coords provided, find nearby complaints
    if (latitude && longitude && target_image) {
      const lat = Number(latitude);
      const lng = Number(longitude);
      
      const nearbyComplaints = await Complaint.find({
        latitude: { $gte: lat - 0.00025, $lte: lat + 0.00025 },
        longitude: { $gte: lng - 0.00025, $lte: lng + 0.00025 },
        image: { $ne: null }
      });
      
      nearby_images = nearbyComplaints.map(c => ({
        id: c._id.toString(),
        image: c.image
      }));
    }

    const payload = {
      image_path: imagePath,
      target_image: target_image || null,
      nearby_images: nearby_images
    };

    const response = await fetch('http://127.0.0.1:5001/detect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`AI Server responded with ${response.status}`);
    }

    const data = await response.json();

    // Clean up temp file
    fs.unlink(imagePath, (err) => {
      if (err) console.error('Error deleting temp image:', err);
    });

    res.status(200).json(data);
  } catch (error) {
    console.error('Error in detectIssue:', error.message);
    // Cleanup
    fs.unlink(imagePath, () => {});
    res.status(500).json({ error: 'Failed to process image detection' });
  }
};

module.exports = {
  detectIssue
};
