

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: 'setprofile',
    aliases: ['setavatar', 'setpfp', 'setdp'],
    description: 'Change bot profile picture (reply to image)',
    usage: 'setprofile (reply to image)',
    category: 'Profile',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, send, config }) {
    const { senderID, messageReply } = event;
    
    if (!config.ADMINBOT.includes(senderID)) {
      return send.reply('Only bot admins can use this command.');
    }
    
    if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
      return send.reply('Please reply to an image with this command.');
    }
    
    const attachment = messageReply.attachments[0];
    
    if (attachment.type !== 'photo') {
      return send.reply('Please reply to an image (not video, file, etc).');
    }
    
    const imageUrl = attachment.url;
    
    if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
      return send.reply('❌ Invalid image URL. Please try replying to a different image.');
    }
    
    await send.reply('⏳ Setting profile picture...');
    
    try {
      const cacheDir = path.join(__dirname, 'cache');
      fs.ensureDirSync(cacheDir);
      
      const imagePath = path.join(cacheDir, `profile_${Date.now()}.jpg`);
      
      const response = await axios.get(imageUrl, { 
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      fs.writeFileSync(imagePath, Buffer.from(response.data));
      
      return new Promise((resolve, reject) => {
        api.changeAvatar(fs.createReadStream(imagePath), (err) => {
          try {
            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
            }
          } catch (e) {
            console.error('[SETPROFILE] Cache cleanup error:', e);
          }
          
          if (err) {
            console.error('[SETPROFILE] changeAvatar error:', err);
            send.reply('❌ Failed to change profile picture: ' + err.message).then(resolve).catch(reject);
          } else {
            send.reply('✅ Profile picture updated successfully!').then(resolve).catch(reject);
          }
        });
      });
      
    } catch (error) {
      console.error('[SETPROFILE] Error:', error);
      return send.reply('❌ Failed to change profile picture: ' + error.message);
    }
  }
};
