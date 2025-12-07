const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { Jimp } = require("jimp");

module.exports.config = {
  name: "pair",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "KASHIF RAZA",
  description: "Create a romantic pair edit with profile pics",
  commandCategory: "Love",
  usages: "[@mention optional]",
  cooldowns: 5,
};

const cacheDir = path.join(__dirname, "cache", "canvas");

// ⭐ UPDATED TEMPLATE (YOUR IMAGE) ⭐
const templateUrl = "https://i.ibb.co/bs2rRdx/frame-love-life.png";
const templatePath = path.join(cacheDir, "pair_template.png");

// ⭐ NEW ROMANTIC MESSAGES — SERIF BOLD ⭐
const romanticMessages = [
  "𝐒𝐨𝐮𝐥𝐬 𝐦𝐞𝐞𝐭 𝐛𝐲 𝐟𝐚𝐭𝐞, 𝐡𝐞𝐚𝐫𝐭𝐬 𝐮𝐧𝐢𝐭𝐞 𝐛𝐲 𝐥𝐨𝐯𝐞 ❤️",
  "𝐈𝐧 𝐲𝐨𝐮𝐫 𝐞𝐲𝐞𝐬, 𝐈 𝐟𝐨𝐮𝐧𝐝 𝐦𝐲 𝐟𝐨𝐫𝐞𝐯𝐞𝐫 💖",
  "𝐘𝐨𝐮 𝐚𝐫𝐞 𝐭𝐡𝐞 𝐥𝐨𝐯𝐞 𝐦𝐲 𝐡𝐞𝐚𝐫𝐭 𝐜𝐡𝐨𝐬𝐞 💕",
  "𝐓𝐰𝐨 𝐡𝐞𝐚𝐫𝐭𝐬, 𝐨𝐧𝐞 𝐣𝐨𝐮𝐫𝐧𝐞𝐲 🌹",
  "𝐄𝐯𝐞𝐫𝐲 𝐛𝐞𝐚𝐭 𝐨𝐟 𝐦𝐲 𝐡𝐞𝐚𝐫𝐭 𝐰𝐡𝐢𝐬𝐩𝐞𝐫𝐬 𝐲𝐨𝐮𝐫 𝐧𝐚𝐦𝐞 💞",
  "𝐋𝐨𝐯𝐞 𝐟𝐞𝐞𝐥𝐬 𝐩𝐞𝐫𝐟𝐞𝐜𝐭 𝐰𝐡𝐞𝐧 𝐢𝐭'𝐬 𝐲𝐨𝐮 ❤️",
  "𝐌𝐲 𝐥𝐢𝐟𝐞, 𝐦𝐲 𝐜𝐞𝐧𝐭𝐞𝐫, 𝐦𝐲 𝐥𝐨𝐯𝐞 💜",
  "𝐘𝐨𝐮 𝐚𝐫𝐞 𝐭𝐡𝐞 𝐦𝐨𝐬𝐭 𝐛𝐞𝐚𝐮𝐭𝐢𝐟𝐮𝐥 𝐩𝐚𝐫𝐭 𝐨𝐟 𝐦𝐲 𝐰𝐨𝐫𝐥𝐝 💗"
];

const maleNames = ["ali","ahmed","muhammad","hassan","hussain","kashif","raza","usman","bilal","hamza","asad","zain","fahad","faisal","imran","kamran","adnan","arslan","waqas","waseem","irfan","junaid","khalid","nadeem","naveed","omer","qasim","rizwan","sajid","salman","shahid","tariq","umar","yasir","zahid"];
const femaleNames = ["fatima","ayesha","maria","sana","hira","zara","maryam","khadija","sara","amina","bushra","farah","iqra","javeria","kinza","laiba","maham","nadia","rabia","saima","tahira","uzma","zainab","anam","asma","dua","esha","fiza","huma","iram"];

async function downloadTemplate() {
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
  if (!fs.existsSync(templatePath)) {
    const response = await axios.get(templateUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(templatePath, Buffer.from(response.data));
  }
}

async function getAvatar(uid) {
  const url = `https://graph.facebook.com/${uid}/picture?width=800&height=800&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  const response = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(response.data);
}

async function makeCircularImage(buffer, size) {
  const img = await Jimp.read(buffer);
  img.resize(size, size);

  const mask = new Jimp(size, size, 0x00000000);
  const center = size / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dist = Math.sqrt((x - center) ** 2 + (y - center) ** 2);
      if (dist < center) mask.setPixelColor(0xFFFFFFFF, x, y);
    }
  }

  img.mask(mask, 0, 0);
  return img;
}

function detectGender(name) {
  name = name.toLowerCase();
  if (femaleNames.some(n => name.includes(n))) return "female";
  if (maleNames.some(n => name.includes(n))) return "male";
  return "unknown";
}

async function getThreadMembers(api, threadID) {
  return new Promise(res => {
    api.getThreadInfo(threadID, (err, info) => {
      if (err) return res([]);
      res(info.participantIDs || []);
    });
  });
}

async function getUserInfo(api, uid) {
  return new Promise(res => {
    api.getUserInfo(uid, (err, info) => {
      if (err) return res({});
      res(info[uid] || {});
    });
  });
}

module.exports.run = async ({ api, event }) => {
  const { threadID, messageID, senderID } = event;
  const mention = Object.keys(event.mentions);

  try {
    await downloadTemplate();

    let one = senderID;
    let two;

    const senderInfo = await getUserInfo(api, senderID);
    const senderGender =
      senderInfo.gender === 1 ? "female" :
      senderInfo.gender === 2 ? "male" :
      detectGender(senderInfo.name || "");

    if (mention[0]) {
      two = mention[0];
    } else {
      const members = await getThreadMembers(api, threadID);
      const filtered = members.filter(m => m !== senderID);
      if (filtered.length === 0)
        return api.sendMessage("No members available!", threadID, messageID);

      let opposite = [];

      for (const uid of filtered) {
        const info = await getUserInfo(api, uid);
        const g =
          info.gender === 1 ? "female" :
          info.gender === 2 ? "male" :
          detectGender(info.name || "");

        if (senderGender === "male" && g === "female") opposite.push(uid);
        else if (senderGender === "female" && g === "male") opposite.push(uid);
        else if (senderGender === "unknown" || g === "unknown") opposite.push(uid);
      }

      if (opposite.length === 0) opposite = filtered;
      two = opposite[Math.floor(Math.random() * opposite.length)];
    }

    const avatar1 = await getAvatar(one);
    const avatar2 = await getAvatar(two);

    // ⭐ NEW SIZES MATCH TEMPLATE ⭐
    const circle1 = await makeCircularImage(avatar1, 260);
    const circle2 = await makeCircularImage(avatar2, 260);

    const template = await Jimp.read(templatePath);

    // ⭐ EXACT POSITIONS BASED ON YOUR UPLOADED FRAME ⭐
    template.composite(circle1, 80, 210);   // left circle
    template.composite(circle2, 700, 210);  // right circle

    const outputPath = path.join(cacheDir, `pair_${Date.now()}.png`);
    await template.write(outputPath);

    const name1 = (await getUserInfo(api, one)).name || "User 1";
    const name2 = (await getUserInfo(api, two)).name || "User 2";

    const romantic = romanticMessages[Math.floor(Math.random() * romanticMessages.length)];

    api.sendMessage(
      {
        body: `≿━━━━━━━━༺💜༻━━━━━━━━≾\n\n${romantic}\n\n${name1} ❤️ ${name2}\n\n≿━━━━━━━━༺💜༻━━━━━━━━≾`,
        attachment: fs.createReadStream(outputPath),
        mentions: [
          { tag: name1, id: one },
          { tag: name2, id: two }
        ]
      },
      threadID,
      () => fs.unlinkSync(outputPath),
      messageID
    );

  } catch (err) {
    console.error(err);
    api.sendMessage("Error creating pair!", threadID, messageID);
  }
};