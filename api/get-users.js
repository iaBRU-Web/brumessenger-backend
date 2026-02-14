// api/get-users.js
// Get all registered users
// Created by: Ineza Aime Bruno

import { list } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { blobs } = await list({ prefix: 'brumessenger-users/' });
    
    const users = await Promise.all(
      blobs.map(async (blob) => {
        const response = await fetch(blob.url);
        const userData = await response.json();
        
        // Don't send passwords to frontend
        return {
          username: userData.username,
          status: userData.status || 'offline',
          lastActive: userData.lastActive,
          isAdmin: userData.isAdmin || false,
          createdAt: userData.createdAt
        };
      })
    );
    
    // Sort by last active (most recent first)
    users.sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive));
    
    return res.status(200).json({ 
      success: true, 
      users,
      total: users.length
    });
    
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch users',
      details: error.message 
    });
  }
}
