// api/messages.js
// Brumessenger Messages API - Simple Storage
// Created by: Ineza Aime Bruno

// Simple in-memory storage for messages
let conversations = {};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    if (req.method === 'GET') {
      // Get messages for a conversation
      const { user1, user2 } = req.query;
      
      if (!user1 || !user2) {
        return res.status(400).json({ error: 'Both user1 and user2 required' });
      }
      
      // Create consistent channel name (sorted alphabetically)
      const channelName = [user1, user2].sort().join('-');
      
      return res.status(200).json({ 
        success: true, 
        messages: conversations[channelName] || [],
        channel: channelName
      });
    }
    
    if (req.method === 'POST') {
      // Save a new message
      const { from, to, text } = req.body;
      
      if (!from || !to || !text) {
        return res.status(400).json({ error: 'from, to, and text required' });
      }
      
      // Create consistent channel name
      const channelName = [from, to].sort().join('-');
      
      // Initialize conversation if doesn't exist
      if (!conversations[channelName]) {
        conversations[channelName] = [];
      }
      
      // Add new message
      const newMessage = {
        from,
        to,
        text,
        timestamp: new Date().toISOString()
      };
      
      conversations[channelName].push(newMessage);
      
      return res.status(200).json({ 
        success: true, 
        message: 'Message saved',
        data: newMessage
      });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('Messages error:', error);
    return res.status(500).json({ 
      error: 'Server error',
      details: error.message 
    });
  }
}
