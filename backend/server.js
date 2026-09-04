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

// Spawn Python AI Server
const { spawn } = require('child_process');
const path = require('path');
let pythonServer;

const startPythonServer = () => {
  pythonServer = spawn('python', [path.join(__dirname, 'ai_server.py')]);
  
  pythonServer.stdout.on('data', (data) => console.log(`[AI Server]: ${data.toString().trim()}`));
  pythonServer.stderr.on('data', (data) => console.error(`[AI Server Err]: ${data.toString().trim()}`));
  
  pythonServer.on('close', (code) => {
    console.log(`Python AI server exited with code ${code}. Restarting in 3s...`);
    setTimeout(startPythonServer, 3000);
  });
};

startPythonServer();

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.log(`Uncaught Exception: ${err.message}`);
  server.close(() => process.exit(1));
});
