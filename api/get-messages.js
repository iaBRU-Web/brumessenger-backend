// api/get-messages.js
// Get messages between two users
// Created by: Ineza Aime Bruno
// THIS IS A NEW FILE - FIXES MESSAGE HISTORY LOADING

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
    const { user1, user2 } = req.query;
    
    if (!user1 || !user2) {
      return res.status(400).json({ error: 'Both users required' });
    }
    
    const conversationKey = [user1, user2].sort().join('-');
    
    // Get messages for this conversation
    const { blobs } = await list({ prefix: `brumessenger-messages/${conversationKey}/` });
    
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
    
    const response = await fetch(messagesBlob.url);
    const messages = await response.json();
    
    // Mark messages as read for the requesting user
    // This could be enhanced to update read status in the database
    
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
