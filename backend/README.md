# CivicIQ Backend

## Setup Instructions

1. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

2. **Environment Variables**
   - Copy \`.env.example\` to \`.env\`.
   - Update \`MONGO_URI\` with your MongoDB Atlas connection string.

3. **Run the server**
   - Development mode (with nodemon):
     \`\`\`bash
     npm run dev
     \`\`\`
   - Production mode:
     \`\`\`bash
     npm start
     \`\`\`

The server will be available at \`http://localhost:5000\`.
You can verify the setup by visiting the health endpoint: \`http://localhost:5000/api/health\`
