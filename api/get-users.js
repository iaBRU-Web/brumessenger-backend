// api/get-users.js
// Get all registered users - IMPROVED VERSION
// Created by: Ineza Aime Bruno

import { list } from '@vercel/blob';

export default async function handler(req, res) {
  // CORS headers - MUST be first
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
    let blobs;
    try {
      const result = await list({ prefix: 'brumessenger-users/' });
      blobs = result.blobs || [];
    } catch (error) {
      console.error('Error listing users:', error);
      return res.status(500).json({ 
        error: 'Database connection error',
        details: 'Could not access user database',
        help: 'Check Vercel Blob configuration'
      });
    }
    
    const users = await Promise.all(
      blobs.map(async (blob) => {
        try {
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
        } catch (error) {
          console.error('Error fetching user:', blob.pathname, error);
          return null;
        }
      })
    );
    
    // Filter out any failed user fetches
    const validUsers = users.filter(user => user !== null);
    
    // Sort by last active (most recent first)
    validUsers.sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive));
    
    return res.status(200).json({ 
      success: true, 
      users: validUsers,
      total: validUsers.length
    });
    
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch users',
      details: error.message,
      help: 'Check server logs for details'
    });
  }
}
