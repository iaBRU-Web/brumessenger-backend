// api/messages.js
// Brumessenger Messages API - Persistent Cloud Storage
// Created by: Ineza Aime Bruno

import { put, list } from '@vercel/blob';

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
      
      // Try to get existing messages from Vercel Blob
      const { blobs } = await list({ prefix: `brumessenger-messages/${channelName}` });
      
      if (blobs.length === 0) {
        return res.status(200).json({ 
          success: true, 
          messages: [],
          channel: channelName
        });
      }
      
      // Get the most recent messages file
      const messageBlob = blobs[blobs.length - 1];
      const response = await fetch(messageBlob.url);
      const data = await response.json();
      
      return res.status(200).json({ 
        success: true, 
        messages: data.messages || [],
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
      
      // Get existing messages
      const { blobs } = await list({ prefix: `brumessenger-messages/${channelName}` });
      let messages = [];
      
      if (blobs.length > 0) {
        const messageBlob = blobs[blobs.length - 1];
        const response = await fetch(messageBlob.url);
        const data = await response.json();
        messages = data.messages || [];
      }
      
      // Add new message
      const newMessage = {
        from,
        to,
        text,
        timestamp: new Date().toISOString()
      };
      
      messages.push(newMessage);
      
      // Save updated messages to Vercel Blob
      const messageData = {
        channel: channelName,
        messages: messages,
        lastUpdated: new Date().toISOString()
      };
      
      await put(
        `brumessenger-messages/${channelName}.json`, 
        JSON.stringify(messageData), 
        {
          access: 'public',
          addRandomSuffix: false
        }
      );
      
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
