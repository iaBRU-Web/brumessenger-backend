// api/update-status.js
// Update user online/offline status
// Created by: Ineza Aime Bruno

const users = {};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }
  
  try {
    const { username, status } = req.body;
    
    if (!username || !status) {
      return res.status(400).json({ 
        success: false,
        error: 'Username and status required' 
      });
    }
    
    const user = users[username.toLowerCase()];
    
    if (user) {
      user.status = status;
      user.lastActive = new Date().toISOString();
    }
    
    return res.status(200).json({ 
      success: true,
      message: 'Status updated'
    });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Server error',
      details: error.message 
    });
  }
}
