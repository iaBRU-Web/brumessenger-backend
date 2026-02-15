// api/update-status.js
// Update user online/offline status
// Created by: Ineza Aime Bruno

// Simple in-memory storage (same as auth.js)
let users = {};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { username, status } = req.body;
    
    if (!username || !status) {
      return res.status(400).json({ error: 'Username and status required' });
    }
    
    if (users[username]) {
      users[username].status = status;
      users[username].lastActive = new Date().toISOString();
    }
    
    return res.status(200).json({ 
      success: true,
      message: 'Status updated'
    });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({ 
      error: 'Server error',
      details: error.message 
    });
  }
}
