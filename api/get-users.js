// api/get-users.js
// Get all users
// Created by: Ineza Aime Bruno

const users = {};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }
  
  try {
    // Convert users object to array
    const userList = Object.values(users);
    
    return res.status(200).json({ 
      success: true,
      users: userList
    });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Server error',
      details: error.message 
    });
  }
}
