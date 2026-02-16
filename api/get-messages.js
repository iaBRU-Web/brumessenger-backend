// api/get-messages.js
// Get messages between two users - IMPROVED VERSION
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
    const { user1, user2 } = req.query;
    
    if (!user1 || !user2) {
      return res.status(400).json({ error: 'Both users required (user1 and user2)' });
    }
    
    const conversationKey = [user1, user2].sort().join('-');
    
    // Get messages for this conversation
    let blobs;
    try {
      const result = await list({ prefix: `brumessenger-messages/${conversationKey}/` });
      blobs = result.blobs || [];
    } catch (error) {
      console.error('Error listing messages:', error);
      return res.status(500).json({ 
        error: 'Database connection error',
        details: 'Could not access messages database'
      });
    }
    
    if (blobs.length === 0) {
      return res.status(200).json({ 
        success: true,
        messages: []
      });
    }
    
    const messagesBlob = blobs.find(b => b.pathname === `brumessenger-messages/${conversationKey}/messages.json`);
    
    if (!messagesBlob) {
      return res.status(200).json({ 
        success: true,
        messages: []
      });
    }
    
    let messages;
    try {
      const response = await fetch(messagesBlob.url);
      messages = await response.json();
    } catch (error) {
      console.error('Error fetching messages:', error);
      return res.status(500).json({ 
        error: 'Failed to load messages',
        details: 'Could not retrieve conversation data'
      });
    }
    
    return res.status(200).json({ 
      success: true,
      messages: messages || []
    });
    
  } catch (error) {
    console.error('Get messages error:', error);
    return res.status(500).json({ 
      error: 'Failed to get messages',
      details: error.message
    });
  }
}
