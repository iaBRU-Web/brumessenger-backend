// api/get-inbox.js
// Get offline messages for a user - IMPROVED VERSION
// Created by: Ineza Aime Bruno

import { list, del } from '@vercel/blob';

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
    const { username } = req.query;
    
    if (!username) {
      return res.status(400).json({ error: 'Username required' });
    }
    
    // Get user's inbox
    let blobs;
    try {
      const result = await list({ prefix: `brumessenger-inbox/${username}/` });
      blobs = result.blobs || [];
    } catch (error) {
      console.error('Error listing inbox:', error);
      return res.status(500).json({ 
        error: 'Database connection error',
        details: 'Could not access inbox'
      });
    }
    
    if (blobs.length === 0) {
      return res.status(200).json({ 
        success: true,
        messages: []
      });
    }
    
    const inboxBlob = blobs.find(b => b.pathname === `brumessenger-inbox/${username}/messages.json`);
    
    if (!inboxBlob) {
      return res.status(200).json({ 
        success: true,
        messages: []
      });
    }
    
    let messages;
    try {
      const response = await fetch(inboxBlob.url);
      messages = await response.json();
    } catch (error) {
      console.error('Error fetching inbox messages:', error);
      return res.status(500).json({ 
        error: 'Failed to load inbox',
        details: 'Could not retrieve offline messages'
      });
    }
    
    // Clear inbox after retrieval (messages are now delivered)
    try {
      await del([inboxBlob.url]);
    } catch (error) {
      console.error('Error clearing inbox:', error);
      // Don't fail the request if clearing fails
    }
    
    return res.status(200).json({ 
      success: true,
      messages: messages || []
    });
    
  } catch (error) {
    console.error('Get inbox error:', error);
    return res.status(500).json({ 
      error: 'Failed to get inbox',
      details: error.message
    });
  }
}
