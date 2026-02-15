// api/auth.js
// Brumessenger Authentication API
// Created by: Ineza Aime Bruno
// Special thanks to: NSORO EMMANUEL

// Simple in-memory storage (resets on deployment, but works immediately)
let users = {};

export default async function handler(req, res) {
  // CORS headers
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
    const { action, username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    
    if (action === 'signup') {
      // Check if username exists
      if (users[username]) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      
      // Create new user
      users[username] = {
        username,
        password,
        createdAt: new Date().toISOString(),
        isAdmin: username.toLowerCase() === 'admin' || username.toLowerCase() === 'bruno',
        status: 'online',
        lastActive: new Date().toISOString()
      };
      
      return res.status(200).json({ 
        success: true, 
        message: 'Account created successfully',
        user: {
          username: users[username].username,
          isAdmin: users[username].isAdmin,
          createdAt: users[username].createdAt
        }
      });
    }
    
    if (action === 'login') {
      // Check if user exists
      if (!users[username]) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      
      // Verify password
      if (users[username].password !== password) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      
      // Update status
      users[username].status = 'online';
      users[username].lastActive = new Date().toISOString();
      
      return res.status(200).json({ 
        success: true, 
        message: 'Login successful',
        user: {
          username: users[username].username,
          isAdmin: users[username].isAdmin || false,
          createdAt: users[username].createdAt
        }
      });
    }
    
    return res.status(400).json({ error: 'Invalid action' });
    
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ 
      error: 'Server error',
      details: error.message 
    });
  }
}
