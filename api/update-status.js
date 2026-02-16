// api/update-status.js
// Update user online/offline status - IMPROVED VERSION
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
    const { username, status } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username required' });
    }
    
    // Get user
    let blobs;
    try {
      const result = await list({ prefix: 'brumessenger-users/' });
      blobs = result.blobs || [];
    } catch (error) {
      console.error('Error listing users:', error);
      return res.status(500).json({ 
        error: 'Database connection error',
        details: 'Could not access user database'
      });
    }
    
    const userBlob = blobs.find(b => b.pathname === `brumessenger-users/${username}.json`);
    
    if (!userBlob) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    let userData;
    try {
      const response = await fetch(userBlob.url);
      userData = await response.json();
    } catch (error) {
      console.error('Error fetching user data:', error);
      return res.status(500).json({ 
        error: 'Failed to load user data'
      });
    }
    
    // Update status and last active time
    userData.status = status || 'online';
    userData.lastActive = new Date().toISOString();
    
    try {
      await put(`brumessenger-users/${username}.json`, JSON.stringify(userData), {
        access: 'public',
        addRandomSuffix: false
      });
    } catch (error) {
      console.error('Error updating status:', error);
      return res.status(500).json({ 
        error: 'Failed to update status',
        details: 'Could not save updated status'
      });
    }
    
    return res.status(200).json({ 
      success: true,
      message: 'Status updated'
    });
    
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({ 
      error: 'Failed to update status',
      details: error.message
    });
  }
}
