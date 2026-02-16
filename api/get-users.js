import { list } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    const { currentUser } = req.query;
    
    let blobs = [];
    try {
      const result = await list({ prefix: 'brumessenger-users/' });
      blobs = result?.blobs || [];
    } catch (listError) {
      console.error('List error:', listError);
      return res.status(500).json({ 
        error: 'Database error',
        users: []
      });
    }
    
    const users = [];
    
    for (const blob of blobs) {
      try {
        const response = await fetch(blob.url);
        if (!response.ok) continue;
        
        const text = await response.text();
        if (!text || text.trim() === '') continue;
        
        const userData = JSON.parse(text);
        
        if (userData && userData.username) {
          users.push({
            username: userData.username,
            status: userData.status || 'offline',
            lastActive: userData.lastActive,
            isAdmin: userData.isAdmin || false,
            createdAt: userData.createdAt
          });
        }
      } catch (parseError) {
        console.error('Parse error:', parseError);
        continue;
      }
    }
    
    const filteredUsers = users.filter(u => u.username !== currentUser);
    
    return res.status(200).json({ 
      success: true,
      users: filteredUsers
    });
    
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ 
      error: 'Server error',
      users: []
    });
  }
}
