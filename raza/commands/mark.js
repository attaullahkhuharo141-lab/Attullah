
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: 'mark',
    aliases: ['board', 'comment'],
    description: 'Write comment on board/blackboard',
    usage: 'mark [your text]',
    category: 'Fun',
    prefix: true
  },

  wrapText(ctx, text, maxWidth) {
    return new Promise(resolve => {
      if (ctx.measureText(text).width < maxWidth) return resolve([text]);
      if (ctx.measureText('W').width > maxWidth) return resolve(null);
      
      const words = text.split(' ');
      const lines = [];
      let line = '';
      
      while (words.length > 0) {
        let split = false;
        while (ctx.measureText(words[0]).width >= maxWidth) {
          const temp = words[0];
          words[0] = temp.slice(0, -1);
          if (split) words[1] = `${temp.slice(-1)}${words[1]}`;
          else {
            split = true;
            words.splice(1, 0, temp.slice(-1));
          }
        }
        if (ctx.measureText(`${line}${words[0]}`).width < maxWidth) {
          line += `${words.shift()} `;
        } else {
          lines.push(line.trim());
          line = '';
        }
        if (words.length === 0) lines.push(line.trim());
      }
      return resolve(lines);
    });
  },

  async run({ api, event, args, send }) {
    const { threadID, messageID } = event;
    
    const text = args.join(' ');
    if (!text) {
      return send.reply('📝 Please enter the text you want to write on the board\n\nUsage: mark [your text]');
    }

    try {
      // Dynamic import of canvas
      const { loadImage, createCanvas } = await import('canvas');
      
      const cacheDir = path.join(__dirname, 'cache');
      fs.ensureDirSync(cacheDir);
      const pathImg = path.join(cacheDir, `mark_${Date.now()}.png`);

      // Download board image
      const imageUrl = 'https://i.imgur.com/3j4GPdy.jpg';
      const response = await axios.get(imageUrl, { 
        responseType: 'arraybuffer',
        timeout: 15000 
      });
      
      fs.writeFileSync(pathImg, Buffer.from(response.data));

      // Load and process image
      const baseImage = await loadImage(pathImg);
      const canvas = createCanvas(baseImage.width, baseImage.height);
      const ctx = canvas.getContext('2d');
      
      ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
      ctx.font = '400 45px Arial';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'start';

      // Adjust font size if text is too long
      let fontSize = 45;
      while (ctx.measureText(text).width > 2250) {
        fontSize--;
        ctx.font = `400 ${fontSize}px Arial, sans-serif`;
      }

      // Wrap text and draw
      const lines = await this.wrapText(ctx, text, 440);
      ctx.fillText(lines.join('\n'), 95, 420);

      // Save final image
      const imageBuffer = canvas.toBuffer();
      fs.writeFileSync(pathImg, imageBuffer);

      // Send message
      await api.sendMessage({
        body: '📝 Here is your board comment!',
        attachment: fs.createReadStream(pathImg)
      }, threadID, messageID);

      // Clean up
      setTimeout(() => {
        try { fs.unlinkSync(pathImg); } catch {}
      }, 10000);

    } catch (error) {
      console.error('Mark command error:', error);
      
      if (error.message.includes('canvas')) {
        return send.reply('❌ Canvas module not found. Installing required package...');
      }
      
      return send.reply(`❌ Error: ${error.message}`);
    }
  }
};
