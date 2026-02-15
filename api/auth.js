// api/auth.js
// Brumessenger Authentication API
// Created by: Ineza Aime Bruno

const users = {};

export default async function handler(req, res) {
  // CORS headers - MUST be at the top
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { action, username, password } = req.body;
    
    // Validate inputs
    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Username and password required' 
      });
    }
    
    if (username.length < 3) {
      return res.status(400).json({ 
        success: false,
        error: 'Username must be at least 3 characters' 
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        error: 'Password must be at least 6 characters' 
      });
    }
    
    // SIGNUP
    if (action === 'signup') {
      // Check if username already exists
      if (users[username.toLowerCase()]) {
        return res.status(400).json({ 
          success: false,
          error: 'Username already taken' 
        });
      }
      
      // Create new user
      const userData = {
        username: username,
        password: password,
        createdAt: new Date().toISOString(),
        isAdmin: username.toLowerCase() === 'admin' || username.toLowerCase() === 'bruno',
        status: 'online',
        lastActive: new Date().toISOString()
      };
      
      users[username.toLowerCase()] = userData;
      
      return res.status(200).json({ 
        success: true, 
        message: 'Account created successfully',
        user: {
          username: userData.username,
          isAdmin: userData.isAdmin,
          createdAt: userData.createdAt
        }
      });
    }
    
    // LOGIN
    if (action === 'login') {
      const user = users[username.toLowerCase()];
      
      // Check if user exists
      if (!user) {
        return res.status(401).json({ 
          success: false,
          error: 'Invalid username or password' 
        });
      }
      
      // Check password
      if (user.password !== password) {
        return res.status(401).json({ 
          success: false,
          error: 'Invalid username or password' 
        });
      }
      
      // Update user status
      user.status = 'online';
      user.lastActive = new Date().toISOString();
      
      return res.status(200).json({ 
        success: true, 
        message: 'Login successful',
        user: {
          username: user.username,
          isAdmin: user.isAdmin || false,
          createdAt: user.createdAt
        }
      });
    }
    
    // Invalid action
    return res.status(400).json({ 
      success: false,
      error: 'Invalid action. Use "login" or "signup"' 
    });
    
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Server error',
      details: error.message 
    });
  }
}
