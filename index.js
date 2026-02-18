require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  entersState,
  VoiceConnectionStatus,
  StreamType
} = require("@discordjs/voice");

const ytdl = require("ytdl-core");
const ytsr = require("ytsr");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.once("clientReady", () => {
  console.log(`Bot is ready as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith("!sPlay")) return;

  if (!message.member.voice.channel) {
    return message.reply("لازم تدخل روم صوتي أولاً 🎧");
  }

  const query = message.content.slice(6).trim();
  if (!query) {
    return message.reply("اكتب اسم الأغنية بعد الأمر.");
  }

  try {
    let url;

    // إذا رابط مباشر
    if (ytdl.validateURL(query)) {
      url = query;
    } else {
      const searchResults = await ytsr(query, { limit: 5 });
      const video = searchResults.items.find(i => i.type === "video");

      if (!video) return message.reply("ما حصلت نتيجة مناسبة.");

      url = video.url;
    }

    const stream = ytdl(url, {
      filter: "audioonly",
      quality: "highestaudio",
      highWaterMark: 1 << 25
    });

    const connection = joinVoiceChannel({
      channelId: message.member.voice.channel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator
    });

    await entersState(connection, VoiceConnectionStatus.Ready, 20000);

    const player = createAudioPlayer();

    const resource = createAudioResource(stream, {
      inputType: StreamType.Arbitrary
    });

    player.play(resource);
    connection.subscribe(player);

    message.reply("🎶 تم تشغيل الأغنية");

    player.on(AudioPlayerStatus.Idle, () => {
      connection.destroy();
    });

  } catch (error) {
    console.error("Playback Error:", error);
    message.reply("صار خطأ أثناء التشغيل.");
  }
});

client.login(process.env.TOKEN);
