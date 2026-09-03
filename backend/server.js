require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
connectDB();

// Health route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'CivicIQ Backend Running'
  });
});

// Complaint routes
app.use('/api/complaints', require('./routes/complaintRoutes'));

// AI routes
app.use('/api', require('./routes/aiRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
