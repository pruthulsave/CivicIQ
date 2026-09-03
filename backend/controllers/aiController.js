const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const detectPothole = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  const imagePath = req.file.path;
  const scriptPath = path.join(__dirname, '../detect.py');

  const pythonProcess = spawn('python', [scriptPath, imagePath]);

  let outputData = '';
  let errorData = '';
  let responseSent = false;

  pythonProcess.stdout.on('data', (data) => {
    outputData += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    errorData += data.toString();
  });

  pythonProcess.on('error', (err) => {
    console.error('Failed to start Python process:', err);
    if (!responseSent) {
      responseSent = true;
      return res.status(500).json({ error: 'Internal server error: Python process failed to start' });
    }
  });

  pythonProcess.on('close', (code) => {
    // delete the temporary uploaded file
    fs.unlink(imagePath, (err) => {
      if (err) console.error('Error deleting temp image:', err);
    });

    if (responseSent) return;
    responseSent = true;

    if (code !== 0) {
      console.error('Python script error:', errorData);
      return res.status(500).json({ error: 'Failed to run detection script' });
    }

    try {
      // Find the last valid JSON object from the python output
      const lines = outputData.trim().split('\n');
      const result = JSON.parse(lines[lines.length - 1]);
      
      if (result.error) {
        return res.status(500).json({ error: result.error });
      }

      return res.status(200).json(result);
    } catch (err) {
      console.error('Failed to parse Python output:', outputData);
      return res.status(500).json({ error: 'Failed to parse detection results' });
    }
  });
};

module.exports = {
  detectPothole
};
