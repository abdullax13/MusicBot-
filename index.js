require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const { Manager } = require("erela.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const manager = new Manager({
  nodes: [
    {
      host: process.env.LAVALINK_HOST,
      port: 2333,
      password: process.env.LAVALINK_PASSWORD,
      secure: false
    }
  ],
  send(id, payload) {
    const guild = client.guilds.cache.get(id);
    if (guild) guild.shard.send(payload);
  }
});

client.once("clientReady", () => {
  console.log(`Bot is ready as ${client.user.tag}`);
  manager.init(client.user.id);
});

client.on("raw", (d) => manager.updateVoiceState(d));

manager.on("nodeConnect", () => {
  console.log("Connected to Lavalink");
});

manager.on("nodeError", (node, error) => {
  console.log("Lavalink Error:", error);
});

manager.on("trackStart", (player, track) => {
  const channel = client.channels.cache.get(player.textChannel);
  if (channel) channel.send(`🎶 الآن يتم تشغيل: ${track.title}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith("!sPlay")) return;

  if (!message.member.voice.channel) {
    return message.reply("لازم تدخل روم صوتي أولاً 🎧");
  }

  const query = message.content.slice(6).trim();
  if (!query) return message.reply("اكتب اسم الأغنية بعد الأمر.");

  const player = manager.create({
    guild: message.guild.id,
    voiceChannel: message.member.voice.channel.id,
    textChannel: message.channel.id,
    selfDeafen: true
  });

  if (player.state !== "CONNECTED") player.connect();

  const res = await manager.search(query, message.author);

  if (!res || !res.tracks.length) {
    return message.reply("ما حصلت شي.");
  }

  player.queue.add(res.tracks[0]);

  if (!player.playing && !player.paused && player.queue.totalSize === 1) {
    player.play();
  }

  message.reply("🎶 تم إضافة الأغنية إلى الطابور");
});

client.login(process.env.TOKEN);
