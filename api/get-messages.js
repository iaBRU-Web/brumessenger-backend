import { list } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    const { user1, user2 } = req.query;
    
    if (!user1 || !user2) {
      return res.status(400).json({ error: 'Both users required' });
    }
    
    const conversationKey = [user1, user2].sort().join('-');
    
    let messages = [];
    
    try {
      const result = await list({ prefix: `brumessenger-conversations/${conversationKey}/` });
      
      if (result && result.blobs && result.blobs.length > 0) {
        for (const blob of result.blobs) {
          try {
            const response = await fetch(blob.url);
            if (!response.ok) continue;
            
            const text = await response.text();
            if (!text || text.trim() === '') continue;
            
            const messageData = JSON.parse(text);
            if (messageData && messageData.id) {
              messages.push(messageData);
            }
          } catch (parseError) {
            console.error('Parse message error:', parseError);
            continue;
          }
        }
      }
    } catch (listError) {
      console.error('List messages error:', listError);
    }
    
    messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    return res.status(200).json({ 
      success: true,
      messages
    });
    
  } catch (error) {
    console.error('Get messages error:', error);
    return res.status(500).json({ 
      error: 'Failed to load messages',
      messages: []
    });
  }
}
