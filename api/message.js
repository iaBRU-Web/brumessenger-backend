// api/messages.js
// Brumessenger Messages API
// Created by: Ineza Aime Bruno

const conversations = {};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // GET messages
    if (req.method === 'GET') {
      const { user1, user2 } = req.query;
      
      if (!user1 || !user2) {
        return res.status(400).json({ 
          success: false,
          error: 'Both user1 and user2 required' 
        });
      }
      
      // Create channel name (always same order)
      const channelName = [user1.toLowerCase(), user2.toLowerCase()].sort().join('-');
      
      return res.status(200).json({ 
        success: true, 
        messages: conversations[channelName] || [],
        channel: channelName
      });
    }
    
    // POST new message
    if (req.method === 'POST') {
      const { from, to, text } = req.body;
      
      if (!from || !to || !text) {
        return res.status(400).json({ 
          success: false,
          error: 'from, to, and text required' 
        });
      }
      
      // Create channel name (always same order)
      const channelName = [from.toLowerCase(), to.toLowerCase()].sort().join('-');
      
      // Initialize if needed
      if (!conversations[channelName]) {
        conversations[channelName] = [];
      }
      
      // Add message
      const newMessage = {
        from: from,
        to: to,
        text: text,
        timestamp: new Date().toISOString()
      };
      
      conversations[channelName].push(newMessage);
      
      return res.status(200).json({ 
        success: true, 
        message: 'Message saved',
        data: newMessage
      });
    }
    
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
    
  } catch (error) {
    console.error('Messages error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Server error',
      details: error.message 
    });
  }
}
