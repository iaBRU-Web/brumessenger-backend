import { put, list } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    const { from, to, message, timestamp } = req.body;
    
    if (!from || !to || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const messageData = {
      id: messageId,
      from,
      to,
      message,
      timestamp: timestamp || new Date().toISOString(),
      read: false
    };
    
    const conversationKey = [from, to].sort().join('-');
    
    try {
      await put(`brumessenger-conversations/${conversationKey}/${messageId}.json`, 
        JSON.stringify(messageData), {
          access: 'public',
          addRandomSuffix: false
        });
    } catch (convError) {
      console.error('Conversation save error:', convError);
    }
    
    let recipientOnline = false;
    try {
      const usersResult = await list({ prefix: 'brumessenger-users/' });
      const recipientBlob = usersResult.blobs?.find(b => b.pathname === `brumessenger-users/${to}.json`);
      
      if (recipientBlob) {
        const response = await fetch(recipientBlob.url);
        const userData = JSON.parse(await response.text());
        recipientOnline = userData.status === 'online';
      }
    } catch (e) {
      console.error('Check recipient status error:', e);
    }
    
    if (!recipientOnline) {
      try {
        await put(`brumessenger-inbox/${to}/${messageId}.json`, 
          JSON.stringify(messageData), {
            access: 'public',
            addRandomSuffix: false
          });
      } catch (inboxError) {
        console.error('Inbox save error:', inboxError);
      }
    }
    
    return res.status(200).json({ 
      success: true,
      messageId
    });
    
  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({ 
      error: 'Failed to send message',
      details: error.message
    });
  }
}
