import { list } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    let blobs = [];
    try {
      const result = await list({ prefix: 'brumessenger-users/' });
      blobs = result?.blobs || [];
    } catch (listError) {
      console.error('List error:', listError);
      return res.status(500).json({ 
        error: 'Database connection failed',
        hint: 'Check BLOB_READ_WRITE_TOKEN'
      });
    }
    
    const users = await Promise.all(
      blobs.map(async (blob) => {
        try {
          const fetchResponse = await fetch(blob.url);
          
          if (!fetchResponse.ok) {
            console.error(`Failed to fetch ${blob.pathname}: ${fetchResponse.status}`);
            return null;
          }
          
          const text = await fetchResponse.text();
          
          if (!text || text.trim() === '') {
            console.error(`Empty data for ${blob.pathname}`);
            return null;
          }
          
          const userData = JSON.parse(text);
          
          if (!userData || !userData.username) {
            console.error(`Invalid data for ${blob.pathname}`);
            return null;
          }
          
          return {
            username: userData.username,
            status: userData.status || 'offline',
            lastActive: userData.lastActive || new Date().toISOString(),
            isAdmin: userData.isAdmin || false,
            createdAt: userData.createdAt || new Date().toISOString()
          };
        } catch (error) {
          console.error(`Error processing ${blob.pathname}:`, error);
          return null;
        }
      })
    );
    
    const validUsers = users.filter(user => user !== null);
    validUsers.sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive));
    
    return res.status(200).json({ 
      success: true, 
      users: validUsers,
      total: validUsers.length
    });
    
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch users',
      details: error.message 
    });
  }
}
