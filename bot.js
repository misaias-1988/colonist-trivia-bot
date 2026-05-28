require('dotenv').config();
const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const CHANNEL_ID = '1508951125867626710';
const QUESTION = '🎲 **Board of the Day**\n\nIf this were your board, where would **YOU** put a settlement next? What would your strategy be for this game? 👇';
const IMAGES_DIR = path.join(__dirname, 'images');
const STATE_FILE = path.join(__dirname, 'state.json');
const INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

function getState() {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  }
  return { index: 0 };
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function getImages() {
  return fs.readdirSync(IMAGES_DIR)
    .filter(f => /\.(png|jpg|jpeg|gif|webp)$/i.test(f))
    .sort((a, b) => parseInt(a) - parseInt(b));
}

async function sendTrivia(client) {
  const state = getState();
  const images = getImages();

  if (state.index >= images.length) {
    console.log('All 30 boards sent! Campaign complete.');
    client.destroy();
    process.exit(0);
  }

  const imageName = images[state.index];
  const imagePath = path.join(IMAGES_DIR, imageName);
  const channel = await client.channels.fetch(CHANNEL_ID);
  const attachment = new AttachmentBuilder(imagePath, { name: imageName });

  await channel.send({
    content: `${QUESTION}\n\n*Board ${state.index + 1} of ${images.length}*`,
    files: [attachment],
  });

  console.log(`[${new Date().toISOString()}] Sent board ${state.index + 1}/${images.length}`);

  state.index++;
  saveState(state);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('clientReady', async () => {
  console.log(`Bot online as ${client.user.tag}`);
  await sendTrivia(client);
  setInterval(() => sendTrivia(client), INTERVAL_MS);
});

client.on('error', (err) => console.error('Discord error:', err));

client.login(process.env.DISCORD_BOT_TOKEN);
