// api/auth.js
// Brumessenger Authentication API - IMPROVED VERSION
// Created by: Ineza Aime Bruno

import { put, list } from '@vercel/blob';

export default async function handler(req, res) {
  // CORS headers - MUST be first
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
    
    // Input validation
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    
    // Get all users - with error handling
    let blobs;
    try {
      const result = await list({ prefix: 'brumessenger-users/' });
      blobs = result.blobs || [];
    } catch (error) {
      console.error('Error listing users:', error);
      return res.status(500).json({ 
        error: 'Database connection error',
        details: 'Could not access user database. Check Vercel Blob configuration.'
      });
    }
    
    const userBlob = blobs.find(b => b.pathname === `brumessenger-users/${username}.json`);
    
    if (action === 'signup') {
      // Check if username exists
      if (userBlob) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      
      // Create new user
      const userData = {
        username,
        password, // In production, hash this!
        createdAt: new Date().toISOString(),
        isAdmin: username.toLowerCase() === 'admin' || username.toLowerCase() === 'bruno',
        status: 'online',
        lastActive: new Date().toISOString()
      };
      
      try {
        await put(`brumessenger-users/${username}.json`, JSON.stringify(userData), {
          access: 'public',
          addRandomSuffix: false
        });
      } catch (error) {
        console.error('Error creating user:', error);
        return res.status(500).json({ 
          error: 'Failed to create account',
          details: 'Could not save user data. Check Vercel Blob configuration.'
        });
      }
      
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
    
    if (action === 'login') {
      // Check if user exists
      if (!userBlob) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      
      // Get user data
      let userData;
      try {
        const response = await fetch(userBlob.url);
        userData = await response.json();
      } catch (error) {
        console.error('Error fetching user data:', error);
        return res.status(500).json({ 
          error: 'Failed to load user data',
          details: 'Could not retrieve user information'
        });
      }
      
      // Verify password
      if (userData.password !== password) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      
      // Update status
      userData.status = 'online';
      userData.lastActive = new Date().toISOString();
      
      try {
        await put(`brumessenger-users/${username}.json`, JSON.stringify(userData), {
          access: 'public',
          addRandomSuffix: false
        });
      } catch (error) {
        console.error('Error updating user status:', error);
        // Don't fail login if status update fails
      }
      
      return res.status(200).json({ 
        success: true, 
        message: 'Login successful',
        user: {
          username: userData.username,
          isAdmin: userData.isAdmin || false,
          createdAt: userData.createdAt
        }
      });
    }
    
    return res.status(400).json({ error: 'Invalid action. Use "login" or "signup"' });
    
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ 
      error: 'Server error',
      details: error.message,
      help: 'Check Vercel Blob environment variables'
    });
  }
}
