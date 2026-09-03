const Complaint = require('../models/Complaint');
const mongoose = require('mongoose');
const { spawn } = require('child_process');
const path = require('path');
const { getCategorySuggestion } = require('../utils/gemini');

const computePriority = async (issueType, description, latitude, longitude, image) => {
  let score = 0;
  const desc = (description || '').toLowerCase();
  const type = (issueType || '').toLowerCase();
  
  if (type.includes('pothole') && (desc.includes('school') || desc.includes('hospital'))) {
    score += 90;
  } else if (type.includes('water') || type.includes('drainage')) {
    score += 75;
  } else if (type.includes('streetlight') || type.includes('waste') || type.includes('garbage')) {
    score += 50;
  } else {
    score += 30;
  }
  
  if (image) score += 10;
  
  const density = await Complaint.countDocuments({
    latitude: { $gte: latitude - 0.05, $lte: latitude + 0.05 },
    longitude: { $gte: longitude - 0.05, $lte: longitude + 0.05 }
  });
  
  score += Math.min(density * 2, 20);
  score = Math.min(score, 100);
  
  let level = 'Low';
  if (score >= 90) level = 'Critical';
  else if (score >= 70) level = 'High';
  else if (score >= 40) level = 'Medium';
  
  return { score, level };
};

const precheckComplaint = async (req, res) => {
  try {
    const { issueType, description, image, latitude, longitude } = req.body;

    if (!issueType || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: 'Please provide issueType, latitude, and longitude' });
    }

    let suggestion = null;
    if (description && description.length > 5) {
       suggestion = await getCategorySuggestion(description, issueType);
    }

    let duplicates = [];
    if (image) {
      const nearbyComplaints = await Complaint.find({
        latitude: { $gte: latitude - 0.00025, $lte: latitude + 0.00025 },
        longitude: { $gte: longitude - 0.00025, $lte: longitude + 0.00025 },
        image: { $ne: null }
      });

      if (nearbyComplaints.length > 0) {
        const payload = {
          target_image: image,
          nearby_images: nearbyComplaints.map(c => ({
            id: c._id.toString(),
            image: c.image
          }))
        };

        const pythonProcess = spawn('python', [path.join(__dirname, '../utils/compareImages.py')]);
        
        let resultData = '';
        pythonProcess.stdout.on('data', (data) => {
          resultData += data.toString();
        });

        pythonProcess.stdin.write(JSON.stringify(payload));
        pythonProcess.stdin.end();

        await new Promise((resolve) => {
          pythonProcess.on('close', resolve);
        });

        try {
          const result = JSON.parse(resultData);
          if (result.duplicate_found) {
            duplicates.push({ id: result.duplicate_id });
          }
        } catch (e) {
          console.error("Python parsing error:", e);
        }
      }
    }

    res.status(200).json({ duplicates, suggestion });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const createComplaint = async (req, res) => {
  try {
    const { issueType, description, image, latitude, longitude, duplicateReference, aiSuggestedCategory } = req.body;

    if (!issueType || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: 'Please provide issueType, latitude, and longitude' });
    }

    const { score, level } = await computePriority(issueType, description, latitude, longitude, image);

    const complaint = await Complaint.create({
      issueType,
      description,
      image,
      latitude,
      longitude,
      priorityScore: score,
      priorityLevel: level,
      duplicateReference: duplicateReference || null,
      aiSuggestedCategory: aiSuggestedCategory || null
    });

    res.status(201).json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });
    res.status(200).json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Complaint ID' });
    }

    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    res.status(200).json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Complaint ID' });
    }

    if (!status) {
      return res.status(400).json({ message: 'Please provide a status' });
    }

    const validStatuses = ['Pending', 'Assigned', 'In Progress', 'Resolved'];
    if (!validStatuses.includes(status)) {
       return res.status(400).json({ message: 'Invalid status value' });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    res.status(200).json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteComplaint = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Complaint ID' });
    }

    const complaint = await Complaint.findByIdAndDelete(id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    res.status(200).json({ message: 'Complaint removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  precheckComplaint,
  createComplaint,
  getAllComplaints,
  getComplaintById,
  updateComplaintStatus,
  deleteComplaint
};
