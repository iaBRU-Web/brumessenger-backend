import { put, list } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    const { action, username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    
    let blobs = [];
    try {
      const result = await list({ prefix: 'brumessenger-users/' });
      blobs = result?.blobs || [];
    } catch (listError) {
      console.error('List error:', listError);
      return res.status(500).json({ 
        error: 'Database connection failed',
        hint: 'Check BLOB_READ_WRITE_TOKEN is set correctly'
      });
    }
    
    const userBlob = blobs.find(b => b.pathname === `brumessenger-users/${username}.json`);
    
    if (action === 'signup') {
      if (userBlob) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      
      const userData = {
        username,
        password,
        createdAt: new Date().toISOString(),
        isAdmin: username.toLowerCase() === 'admin' || username.toLowerCase() === 'bruno',
        status: 'online',
        lastActive: new Date().toISOString()
      };
      
      try {
        await put(`brumessenger-users/${username}.json`, JSON.stringify(userData), {
          access: 'public',
          addRandomSuffix: false
        });
      } catch (putError) {
        console.error('Put error:', putError);
        return res.status(500).json({ 
          error: 'Failed to create account',
          hint: 'Database write failed'
        });
      }
      
      return res.status(200).json({ 
        success: true, 
        message: 'Account created successfully',
        user: {
          username: userData.username,
          isAdmin: userData.isAdmin,
          createdAt: userData.createdAt
        }
      });
    }
    
    if (action === 'login') {
      if (!userBlob) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      
      let userData;
      try {
        const fetchResponse = await fetch(userBlob.url);
        
        if (!fetchResponse.ok) {
          throw new Error(`HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`);
        }
        
        const text = await fetchResponse.text();
        
        if (!text || text.trim() === '') {
          throw new Error('Empty response from blob storage');
        }
        
        userData = JSON.parse(text);
        
        if (!userData || typeof userData !== 'object') {
          throw new Error('Invalid user data format');
        }
        
      } catch (fetchError) {
        console.error('Fetch user error:', fetchError);
        console.error('Blob URL:', userBlob.url);
        return res.status(500).json({ 
          error: 'Failed to load user data',
          details: fetchError.message,
          hint: 'User data corrupted or inaccessible'
        });
      }
      
      if (userData.password !== password) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      
      userData.status = 'online';
      userData.lastActive = new Date().toISOString();
      
      try {
        await put(`brumessenger-users/${username}.json`, JSON.stringify(userData), {
          access: 'public',
          addRandomSuffix: false
        });
      } catch (updateError) {
        console.error('Update error:', updateError);
      }
      
      return res.status(200).json({ 
        success: true, 
        message: 'Login successful',
        user: {
          username: userData.username,
          isAdmin: userData.isAdmin || false,
          createdAt: userData.createdAt
        }
      });
    }
    
    return res.status(400).json({ error: 'Invalid action. Use login or signup' });
    
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ 
      error: 'Server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
