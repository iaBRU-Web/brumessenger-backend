// api/update-status.js
// Update user online/offline status
// Created by: Ineza Aime Bruno

import { put, list } from '@vercel/blob';

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
    
    if (!username) {
      return res.status(400).json({ error: 'Username required' });
    }
    
    // Get user
    const { blobs } = await list({ prefix: 'brumessenger-users/' });
    const userBlob = blobs.find(b => b.pathname === `brumessenger-users/${username}.json`);
    
    if (!userBlob) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const response = await fetch(userBlob.url);
    const userData = await response.json();
    
    // Update status and last active time
    userData.status = status || 'online';
    userData.lastActive = new Date().toISOString();
    
    await put(`brumessenger-users/${username}.json`, JSON.stringify(userData), {
      access: 'public',
      addRandomSuffix: false
    });
    
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
