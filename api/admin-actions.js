import { list, del } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  try {
    const { action, adminUsername, targetUsername } = req.body || req.query;
    
    if (adminUsername) {
      try {
        const result = await list({ prefix: 'brumessenger-users/' });
        const adminBlob = result.blobs?.find(b => b.pathname === `brumessenger-users/${adminUsername}.json`);
        
        if (!adminBlob) {
          return res.status(403).json({ error: 'Unauthorized' });
        }
        
        const response = await fetch(adminBlob.url);
        const adminData = JSON.parse(await response.text());
        
        if (!adminData.isAdmin) {
          return res.status(403).json({ error: 'Admin access required' });
        }
      } catch (e) {
        return res.status(403).json({ error: 'Admin verification failed' });
      }
    }
    
    if (action === 'get-notifications' || req.method === 'GET') {
      let notifications = [];
      
      try {
        const result = await list({ prefix: 'brumessenger-admin-notifications/' });
        
        if (result && result.blobs && result.blobs.length > 0) {
          for (const blob of result.blobs) {
            try {
              const response = await fetch(blob.url);
              const text = await response.text();
              if (text && text.trim()) {
                const notification = JSON.parse(text);
                notifications.push(notification);
              }
            } catch (e) {
              console.error('Parse notification error:', e);
            }
          }
        }
      } catch (listError) {
        console.error('List notifications error:', listError);
      }
      
      notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      return res.status(200).json({ 
        success: true,
        notifications
      });
    }
    
    if (action === 'delete-user' && req.method === 'POST') {
      if (!targetUsername) {
        return res.status(400).json({ error: 'Target username required' });
      }
      
      try {
        const userResult = await list({ prefix: 'brumessenger-users/' });
        const userBlob = userResult.blobs?.find(b => b.pathname === `brumessenger-users/${targetUsername}.json`);
        
        if (userBlob) {
          await del(userBlob.url);
        }
        
        const convResult = await list({ prefix: 'brumessenger-conversations/' });
        for (const blob of convResult.blobs || []) {
          if (blob.pathname.includes(targetUsername)) {
            try {
              await del(blob.url);
            } catch (e) {
              console.error('Delete conversation error:', e);
            }
          }
        }
        
        const inboxResult = await list({ prefix: `brumessenger-inbox/${targetUsername}/` });
        for (const blob of inboxResult.blobs || []) {
          try {
            await del(blob.url);
          } catch (e) {
            console.error('Delete inbox error:', e);
          }
        }
        
        return res.status(200).json({ 
          success: true,
          message: `User ${targetUsername} deleted`
        });
        
      } catch (deleteError) {
        console.error('Delete user error:', deleteError);
        return res.status(500).json({ 
          error: 'Failed to delete user',
          details: deleteError.message
        });
      }
    }
    
    if (action === 'get-all-users' && req.method === 'POST') {
      let users = [];
      
      try {
        const result = await list({ prefix: 'brumessenger-users/' });
        
        for (const blob of result.blobs || []) {
          try {
            const response = await fetch(blob.url);
            const userData = JSON.parse(await response.text());
            users.push({
              username: userData.username,
              password: userData.password,
              isAdmin: userData.isAdmin || false,
              status: userData.status,
              createdAt: userData.createdAt,
              lastActive: userData.lastActive
            });
          } catch (e) {
            console.error('Parse user error:', e);
          }
        }
      } catch (listError) {
        console.error('List users error:', listError);
      }
      
      return res.status(200).json({ 
        success: true,
        users
      });
    }
    
    return res.status(400).json({ error: 'Invalid action' });
    
  } catch (error) {
    console.error('Admin action error:', error);
    return res.status(500).json({ 
      error: 'Server error',
      details: error.message
    });
  }
}
