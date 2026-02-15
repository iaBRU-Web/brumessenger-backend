// api/get-users.js
// Get all users
// Created by: Ineza Aime Bruno

// Simple in-memory storage (same as auth.js)
let users = {};

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
    const userList = Object.values(users);
    
    return res.status(200).json({ 
      success: true,
      users: userList
    });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ 
      error: 'Server error',
      details: error.message 
    });
  }
}
