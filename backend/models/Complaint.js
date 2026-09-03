const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  issueType: {
    type: String,
    required: [true, 'Please add an issue type']
  },
  description: {
    type: String
  },
  image: {
    type: String
  },
  latitude: {
    type: Number,
    required: [true, 'Please add latitude']
  },
  longitude: {
    type: Number,
    required: [true, 'Please add longitude']
  },
  severity: {
    type: String,
    default: 'Pending Analysis'
  },
  priority: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Pending', 'Assigned', 'In Progress', 'Resolved'],
    default: 'Pending'
  },
  priorityScore: {
    type: Number,
    default: 0
  },
  priorityLevel: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Low'
  },
  duplicateReference: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    default: null
  },
  aiSuggestedCategory: {
    type: String,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
