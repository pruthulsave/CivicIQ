const fs = require('fs');
const path = require('path');

const dirs = [
  'frontend/src/assets',
  'frontend/src/components',
  'frontend/src/pages',
  'frontend/src/services',
  'frontend/src/hooks',
  'frontend/src/utils',
  'frontend/public',
  'backend/config',
  'backend/controllers',
  'backend/middleware',
  'backend/models',
  'backend/routes',
  'backend/services',
  'backend/utils',
  'backend/uploads',
  'docs'
];

dirs.forEach(dir => fs.mkdirSync(dir, { recursive: true }));

const files = {
  // Frontend
  'frontend/package.json': `{
  "name": "civiciq-frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.1"
  }
}`,
  'frontend/vite.config.js': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`,
  'frontend/index.html': `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CivicIQ</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,
  'frontend/.gitignore': `node_modules
dist
.env`,
  'frontend/README.md': `# CivicIQ Frontend\n\nReact + Vite frontend for CivicIQ.`,
  'frontend/src/main.jsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
  'frontend/src/index.css': `body { margin: 0; font-family: sans-serif; }`,
  'frontend/src/App.jsx': `import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ReportIssue from './pages/ReportIssue';
import TrackComplaint from './pages/TrackComplaint';
import OfficerDashboard from './pages/OfficerDashboard';
import Heatmap from './pages/Heatmap';
import VerifyRepair from './pages/VerifyRepair';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/report" element={<ReportIssue />} />
        <Route path="/track" element={<TrackComplaint />} />
        <Route path="/dashboard" element={<OfficerDashboard />} />
        <Route path="/heatmap" element={<Heatmap />} />
        <Route path="/verify" element={<VerifyRepair />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;`,
  'frontend/src/pages/Home.jsx': `export default function Home() { return <div>Home Page</div>; }`,
  'frontend/src/pages/ReportIssue.jsx': `export default function ReportIssue() { return <div>Report Issue Page</div>; }`,
  'frontend/src/pages/TrackComplaint.jsx': `export default function TrackComplaint() { return <div>Track Complaint Page</div>; }`,
  'frontend/src/pages/OfficerDashboard.jsx': `export default function OfficerDashboard() { return <div>Officer Dashboard Page</div>; }`,
  'frontend/src/pages/Heatmap.jsx': `export default function Heatmap() { return <div>Heatmap Page</div>; }`,
  'frontend/src/pages/VerifyRepair.jsx': `export default function VerifyRepair() { return <div>Verify Repair Page</div>; }`,
  'frontend/src/components/Placeholder.jsx': `export default function Placeholder() { return <div>Component</div>; }`,
  'frontend/src/services/api.js': `// API service placeholder\nexport const api = {};`,
  'frontend/src/hooks/useFetch.js': `// Custom hook placeholder\nexport function useFetch() {}`,
  'frontend/src/utils/helpers.js': `// Helper functions placeholder\nexport const helper = () => {};`,

  // Backend
  'backend/package.json': `{
  "name": "civiciq-backend",
  "version": "1.0.0",
  "description": "Backend for CivicIQ",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "mongoose": "^8.5.3"
  },
  "devDependencies": {
    "nodemon": "^3.1.4"
  }
}`,
  'backend/server.js': `require('dotenv').config();
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
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Placeholder Routes
app.use('/api/complaints', require('./routes/complaintRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));`,
  'backend/config/db.js': `const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Placeholder connection string.
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/civiciq');
    console.log(\`MongoDB Connected: \${conn.connection.host}\`);
  } catch (error) {
    console.error(\`Error: \${error.message}\`);
    // Non-fatal for placeholder purposes
  }
};

module.exports = connectDB;`,
  'backend/routes/complaintRoutes.js': `const express = require('express');
const router = express.Router();
const { getComplaints } = require('../controllers/complaintController');

router.get('/', getComplaints);

module.exports = router;`,
  'backend/controllers/complaintController.js': `const getComplaints = (req, res) => {
  res.status(200).json({ message: 'Get all complaints' });
};

module.exports = { getComplaints };`,
  'backend/models/Complaint.js': `const mongoose = require('mongoose');

const complaintSchema = mongoose.Schema({
  title: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);`,
  'backend/middleware/errorMiddleware.js': `const errorHandler = (err, req, res, next) => {
  res.status(res.statusCode || 500).json({ message: err.message });
};
module.exports = { errorHandler };`,
  'backend/services/complaintService.js': `const getComplaintsService = () => {};
module.exports = { getComplaintsService };`,
  'backend/utils/helper.js': `const formatDate = () => {};
module.exports = { formatDate };`,
  'backend/.env.example': `PORT=5000\nMONGO_URI=your_mongodb_connection_string_here`,
  'backend/.gitignore': `node_modules\n.env`,
  'backend/README.md': `# CivicIQ Backend\n\nNode.js + Express backend.`,
  
  // Docs
  'docs/API.md': `# API Documentation\n\nPlaceholder for API endpoints.`,
  'docs/DATABASE.md': `# Database Schema\n\nPlaceholder for database models.`,
  'docs/DEPLOYMENT.md': `# Deployment Guide\n\nFrontend: Vercel\nBackend: Render`,
  
  // Root
  '.gitignore': `node_modules\n.env\ndist\n.DS_Store`,
  'LICENSE': `MIT License`,
  'README.md': `# CivicIQ\n\nSmart Civic Issue Reporting.`
};

Object.entries(files).forEach(([filepath, content]) => {
  fs.writeFileSync(filepath, content);
});

console.log('Project scaffolding complete.');
