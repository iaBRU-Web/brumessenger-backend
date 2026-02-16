// api/send-message.js
// Send and store messages with offline support - IMPROVED VERSION
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
    const { from, to, text, timestamp } = req.body;
    
    if (!from || !to || !text) {
      return res.status(400).json({ error: 'Missing required fields (from, to, text)' });
    }
    
    // Create unique message ID
    const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Store message in both directions for proper retrieval
    const conversationKey = [from, to].sort().join('-');
    
    // Get existing messages for this conversation
    let messages = [];
    try {
      const result = await list({ prefix: `brumessenger-messages/${conversationKey}/` });
      const blobs = result.blobs || [];
      
      if (blobs.length > 0) {
        const blob = blobs.find(b => b.pathname === `brumessenger-messages/${conversationKey}/messages.json`);
        if (blob) {
          const response = await fetch(blob.url);
          messages = await response.json();
        }
      }
    } catch (error) {
      console.log('No existing messages, creating new conversation');
      messages = [];
    }
    
    // Add new message
    const message = {
      id: messageId,
      from,
      to,
      text,
      timestamp: timestamp || new Date().toISOString(),
      read: false
    };
    
    messages.push(message);
    
    // Store updated messages
    try {
      await put(
        `brumessenger-messages/${conversationKey}/messages.json`,
        JSON.stringify(messages),
        {
          access: 'public',
          addRandomSuffix: false
        }
      );
    } catch (error) {
      console.error('Error storing message:', error);
      return res.status(500).json({ 
        error: 'Failed to store message',
        details: 'Could not save message to database'
      });
    }
    
    // Store in recipient's inbox for offline delivery
    try {
      const result = await list({ prefix: `brumessenger-inbox/${to}/` });
      const blobs = result.blobs || [];
      let inbox = [];
      
      const inboxBlob = blobs.find(b => b.pathname === `brumessenger-inbox/${to}/messages.json`);
      if (inboxBlob) {
        const response = await fetch(inboxBlob.url);
        inbox = await response.json();
      }
      
      inbox.push(message);
      
      await put(
        `brumessenger-inbox/${to}/messages.json`,
        JSON.stringify(inbox),
        {
          access: 'public',
          addRandomSuffix: false
        }
      );
    } catch (error) {
      console.error('Error storing in inbox:', error);
      // Don't fail the whole request if inbox storage fails
    }
    
    return res.status(200).json({ 
      success: true,
      message: 'Message sent',
      messageId
    });
    
  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({ 
      error: 'Failed to send message',
      details: error.message,
      help: 'Check Vercel Blob configuration'
    });
  }
}
