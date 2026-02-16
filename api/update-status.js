import { put, list } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    const { username, status } = req.body;
    
    if (!username || !status) {
      return res.status(400).json({ error: 'Username and status required' });
    }
    
    if (!['online', 'offline'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    let userData;
    try {
      const result = await list({ prefix: 'brumessenger-users/' });
      const userBlob = result.blobs?.find(b => b.pathname === `brumessenger-users/${username}.json`);
      
      if (!userBlob) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const response = await fetch(userBlob.url);
      const text = await response.text();
      userData = JSON.parse(text);
      
    } catch (fetchError) {
      console.error('Fetch user error:', fetchError);
      return res.status(500).json({ error: 'Failed to load user' });
    }
    
    userData.status = status;
    userData.lastActive = new Date().toISOString();
    
    try {
      await put(`brumessenger-users/${username}.json`, JSON.stringify(userData), {
        access: 'public',
        addRandomSuffix: false
      });
    } catch (putError) {
      console.error('Update error:', putError);
      return res.status(500).json({ error: 'Failed to update status' });
    }
    
    return res.status(200).json({ 
      success: true,
      status: userData.status
    });
    
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
