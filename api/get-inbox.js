import { list, del } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  try {
    const { username } = req.query;
    
    if (!username) {
      return res.status(400).json({ error: 'Username required' });
    }
    
    if (req.method === 'GET') {
      let messages = [];
      
      try {
        const result = await list({ prefix: `brumessenger-inbox/${username}/` });
        
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
              console.error('Parse inbox message error:', parseError);
              continue;
            }
          }
        }
      } catch (listError) {
        console.error('List inbox error:', listError);
      }
      
      messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      return res.status(200).json({ 
        success: true,
        messages,
        count: messages.length
      });
    }
    
    if (req.method === 'DELETE') {
      try {
        const result = await list({ prefix: `brumessenger-inbox/${username}/` });
        
        if (result && result.blobs && result.blobs.length > 0) {
          for (const blob of result.blobs) {
            try {
              await del(blob.url);
            } catch (delError) {
              console.error('Delete error:', delError);
            }
          }
        }
      } catch (listError) {
        console.error('List for delete error:', listError);
      }
      
      return res.status(200).json({ 
        success: true,
        message: 'Inbox cleared'
      });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('Inbox error:', error);
    return res.status(500).json({ 
      error: 'Failed to access inbox',
      messages: []
    });
  }
}
