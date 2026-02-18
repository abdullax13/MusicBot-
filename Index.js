require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  entersState,
  VoiceConnectionStatus
} = require("@discordjs/voice");
const play = require("play-dl");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.once("ready", () => {
  console.log(`Bot is ready as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (!message.content.startsWith("!sPlay")) return;
  if (!message.member.voice.channel) {
    return message.reply("لازم تدخل روم صوتي أولاً 🎧");
  }

  const query = message.content.replace("!sPlay", "").trim();
  if (!query) return message.reply("اكتب اسم الأغنية بعد الأمر.");

  try {
    const search = await play.search(query, { limit: 1 });
    if (!search.length) return message.reply("ما حصلت شي.");

    const url = search[0].url;

    const stream = await play.stream(url);

    const connection = joinVoiceChannel({
      channelId: message.member.voice.channel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator
    });

    await entersState(connection, VoiceConnectionStatus.Ready, 20000);

    const player = createAudioPlayer();
    const resource = createAudioResource(stream.stream, {
      inputType: stream.type
    });

    player.play(resource);
    connection.subscribe(player);

    message.reply(`🎶 شغلت: ${search[0].title}`);

    player.on(AudioPlayerStatus.Idle, () => {
      connection.destroy();
    });

  } catch (error) {
    console.error(error);
    message.reply("صار خطأ أثناء التشغيل.");
  }
});

client.login(process.env.TOKEN);
