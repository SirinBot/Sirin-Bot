require('dotenv').config();

const fs = require('fs');
const path = require('path');
const {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  PermissionsBitField,
} = require('discord.js');

/* ================= CONFIG ================= */

const CONFIG_PATH = path.join(__dirname, 'rrpanels.json');

function defaultConfig() {
  return {
    guildId: "1249782836982972517",

    // Main reaction-role channel
    channelId: "1250450644926464030",

    // Colour roles channel (separate)
    colorChannelId: "1272601527164600403",

    messages: {
      age: "1456859415843045497",
      location: "1456876189359669259",
      gender: "1456864506515820689",
      sexuality: "1456876128017977405",
      dmstatus: "1456888550288003244",
      power: "1456896005571088529",
      pings: "",
      colors: ""
    }
  };
}

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    const cfg = defaultConfig();
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
    return cfg;
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}

function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

let cfg = loadConfig();

/* ================= CLIENT ================= */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.User,
  ],
});

/* ================= PANELS ================= */

const PANELS = [
  {
    key: 'age',
    title: 'Age Roles',
    description: 'React to give yourself a role.',
    exclusive: true,
    items: [
      { label: '18-21', roleId: '1263212381387886745', emojiId: '1263442021197287455' },
      { label: '22-25', roleId: '1263212443258323040', emojiId: '1263369965931593753' },
      { label: '26-30', roleId: '1263212568735121520', emojiId: '1263443748189110353' },
      { label: '31+', roleId: '1263212744812003379', emojiId: '1456838594806288394' },
    ],
  },
  {
    key: 'location',
    title: 'Location',
    description: 'React to give yourself a role.',
    exclusive: true,
    items: [
      { label: 'North America', roleId: '1262758629669339188', emojiId: '1456867655423230065' },
      { label: 'Europe', roleId: '1262758761840377858', emojiId: '1456867744157925499' },
      { label: 'Asia', roleId: '1262758804970541168', emojiId: '1456867815679066196' },
      { label: 'South America', roleId: '1262758707134074962', emojiId: '1456867687291682897' },
      { label: 'Africa', roleId: '1262758906460115037', emojiId: '1456867886768459983' },
      { label: 'Oceania', roleId: '1327853204544819220', emojiId: '1456867989298221203' },
    ],
  },
  {
    key: 'gender',
    title: 'Gender Roles',
    description: 'React to give yourself a role.',
    exclusive: true,
    items: [
      { label: 'Male', roleId: '1262755983072170055', emojiId: '1456870104594645133' },
      { label: 'Female', roleId: '1262756023945396346', emojiId: '1456870577775181824' },
      { label: 'Nonbinary', roleId: '1262756123195474091', emojiId: '1456776067640721533' },
      { label: 'Genderfluid', roleId: '1304973887901008035', emojiId: '1456870851898118287' },
      { label: 'Trans Man', roleId: '1305333687172337880', emojiId: '1456870908558970931' },
      { label: 'Trans Woman', roleId: '1328635056394207284', emojiId: '1456870973705027787' },
      { label: 'Femboy', roleId: '1304973954389377024', emojiId: '1456824792693870718' },
    ],
  },
];

/* ================= COLOUR ROLES ================= */

const COLOR_PANEL = {
  key: 'colors',
  title: 'Pick your Colour',
  description: 'React to choose your colour role.',
  exclusive: true,
  items: [
    '1271989191772999762','1271989807610069033','1271990032512581685',
    '1271991428364370030','1271992162816626768','1271992592543780935',
    '1272002406368149524','1272002180622057583','1272001915378470952',
    '1272001805290831902','1309198526495981580','1272001508841623593',
    '1272001227051368540','1272001105160573001','1272000992082264136',
    '1272000883621761047','1271994645114781769','1271994508510236723',
    '1271994090153574494','1271994238795780177','1271993606240206890',
    '1271993487591604346','1271993365302345770','1271993251271934022',
    '1271993777158098974','1408855617975615631','1408856244378402887',
    '1408858625560154132'
  ].map(roleId => ({ roleId }))
};

/* ================= HELPERS ================= */

function emojiToString(id) {
  const e = client.emojis.cache.get(id);
  return e ? e.toString() : '❔';
}

function panelText(panel) {
  return `**${panel.title}**\n${panel.description}\n\n` +
    panel.items.map(i =>
      i.emojiId ? `${emojiToString(i.emojiId)} **${i.label}**` : `🎨 <@&${i.roleId}>`
    ).join('\n');
}

async function ensurePanel(channel, panel) {
  let msgId = cfg.messages[panel.key];
  let msg = null;

  if (msgId) {
    try { msg = await channel.messages.fetch(msgId); } catch {}
  }

  if (!msg || msg.author.id !== client.user.id) {
    msg = await channel.send({ content: panelText(panel) });
    cfg.messages[panel.key] = msg.id;
    saveConfig(cfg);
  } else if (msg.content !== panelText(panel)) {
    await msg.edit(panelText(panel));
  }

  for (const item of panel.items) {
    if (item.emojiId) {
      const emoji = client.emojis.cache.get(item.emojiId);
      if (emoji) await msg.react(emoji);
    }
  }
}

/* ================= SETUP ================= */

async function refreshAllPanels() {
  const guild = await client.guilds.fetch(cfg.guildId);

  const mainChannel = await guild.channels.fetch(cfg.channelId);
  if (!mainChannel || !mainChannel.send) throw new Error('Main channel invalid');

  for (const panel of PANELS) {
    await ensurePanel(mainChannel, panel);
  }

  const colorChannel = await guild.channels.fetch(cfg.colorChannelId);
  if (!colorChannel || !colorChannel.send) throw new Error('Colour channel invalid');

  await ensurePanel(colorChannel, COLOR_PANEL);

  console.log('All panels refreshed');
}

/* ================= REACTIONS ================= */

client.on(Events.MessageReactionAdd, async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) await reaction.fetch();

  const panel =
    [...PANELS, COLOR_PANEL].find(p => cfg.messages[p.key] === reaction.message.id);
  if (!panel) return;

  const member = await reaction.message.guild.members.fetch(user.id);

  const item = panel.items.find(i => i.emojiId === reaction.emoji.id);
  if (!item) return;

  if (panel.exclusive) {
    for (const i of panel.items) {
      if (i.roleId !== item.roleId) {
        await member.roles.remove(i.roleId).catch(() => {});
      }
    }
  }

  await member.roles.add(item.roleId).catch(() => {});
});

/* ================= READY ================= */

client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user.tag}`);
  try { await refreshAllPanels(); }
  catch (e) { console.log('Startup refresh error:', e.message); }
});

client.login(process.env.TOKEN);
