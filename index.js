require('dotenv').config();

const fs = require('fs');
const path = require('path');
const {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  PermissionsBitField,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
} = require('discord.js');

// --------- SAFETY (prevents crash loops) ----------
process.on('unhandledRejection', (reason) => console.error('Unhandled Rejection:', reason));
process.on('uncaughtException', (err) => console.error('Uncaught Exception:', err));

if (!process.env.TOKEN || process.env.TOKEN.trim().length < 20) {
  console.error('❌ TOKEN missing/invalid. Set TOKEN in .env locally and in Railway Variables.');
  process.exit(1);
}

const CONFIG_PATH = path.join(__dirname, 'rrpanels.json');

// ---------- CONFIG LOAD/SAVE ----------
function defaultConfig() {
  return {
    guildId: "1249782836982972517",
    channelId: "1250450644926464030",
    colorChannelId: "1272601527164600403",
    messages: {
      age: "",
      location: "",
      gender: "",
      sexuality: "",
      dmstatus: "",
      power: "",
      pings: "",
      colors: ""
    }
  };
}

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    const cfg = defaultConfig();
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf8');
    return cfg;
  }
  try {
    const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

    // patch missing keys safely
    const d = defaultConfig();
    if (!cfg.guildId) cfg.guildId = d.guildId;
    if (!cfg.channelId) cfg.channelId = d.channelId;
    if (!cfg.colorChannelId) cfg.colorChannelId = d.colorChannelId;
    if (!cfg.messages) cfg.messages = d.messages;
    if (typeof cfg.messages.colors === 'undefined') cfg.messages.colors = "";

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf8');
    return cfg;
  } catch (e) {
    const badPath = path.join(__dirname, `rrpanels.bad-${Date.now()}.json`);
    fs.copyFileSync(CONFIG_PATH, badPath);
    const cfg = defaultConfig();
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf8');
    console.log(`rrpanels.json was invalid JSON. Backed up to ${badPath} and recreated.`);
    return cfg;
  }
}

function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf8');
}

let cfg = loadConfig();

// ---------- BOT ----------
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

// ---------- COMPAT HELPERS ----------
function isTextBasedChannel(ch) {
  if (!ch) return false;
  if (typeof ch.isTextBased === 'function') return ch.isTextBased();
  return typeof ch.send === 'function';
}

async function ensureBotCanManage(guild) {
  const me = await guild.members.fetchMe();
  if (!me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    console.log('⚠️ Bot is missing MANAGE_ROLES permission.');
  }
}

// ---------- YOUR REACTION ROLE PANELS ----------
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
      { label: '31+',   roleId: '1263212744812003379', emojiId: '1456838594806288394' },
    ],
  },
  {
    key: 'location',
    title: 'Location',
    description: 'React to give yourself a role.',
    exclusive: true,
    items: [
      { label: 'North America', roleId: '1262758629669339188', emojiId: '1456867655423230065' },
      { label: 'Europe',        roleId: '1262758761840377858', emojiId: '1456867744157925499' },
      { label: 'Asia',          roleId: '1262758804970541168', emojiId: '1456867815679066196' },
      { label: 'South America', roleId: '1262758707134074962', emojiId: '1456867687291682897' },
      { label: 'Africa',        roleId: '1262758906460115037', emojiId: '1456867886768459983' },
      { label: 'Oceania',       roleId: '1327853204544819220', emojiId: '1456867989298221203' },
    ],
  },
  {
    key: 'gender',
    title: 'Gender roles!',
    description: 'React to give yourself a role.',
    exclusive: true,
    items: [
      { label: 'Male',        roleId: '1262755983072170055', emojiId: '1456870104594645133' },
      { label: 'Female',      roleId: '1262756023945396346', emojiId: '1456870577775181824' },
      { label: 'Nonbinary',   roleId: '1262756123195474091', emojiId: '1456776067640721533' },
      { label: 'Genderfluid', roleId: '1304973887901008035', emojiId: '1456870851898118287' },
      { label: 'Trans Man',   roleId: '1305333687172337880', emojiId: '1456870908558970931' },
      { label: 'Trans Woman', roleId: '1328635056394207284', emojiId: '1456870973705027787' },
      { label: 'Femboy',      roleId: '1304973954389377024', emojiId: '1456824792693870718' },
    ],
  },
  {
    key: 'sexuality',
    title: 'Sexuality roles!',
    description: 'React to give yourself a role.',
    exclusive: false,
    items: [
      { label: 'Straight',   roleId: '1262758197345648700', emojiId: '1456878853468197072' },
      { label: 'Gay',        roleId: '1266495777547751535', emojiId: '1456880652149461004' },
      { label: 'Lesbian',    roleId: '1266495656386756679', emojiId: '1456878974859743324' },
      { label: 'Sapphic',    roleId: '1338263424823464067', emojiId: '1456879048197279744' },
      { label: 'Bisexual',   roleId: '1262758262420410428', emojiId: '1456878915489628203' },
      { label: 'Pansexual',  roleId: '1262758313431666708', emojiId: '1456879120276262954' },
      { label: 'Demisexual', roleId: '1262758355609321553', emojiId: '1456879187997626378' },
      { label: 'Asexual',    roleId: '1262758394725666939', emojiId: '1456879240359313429' },
      { label: 'Aromantic',  roleId: '1304975770212368406', emojiId: '1456879293350023282' },
    ],
  },
  {
    key: 'dmstatus',
    title: "Dm Status",
    description: 'React to give yourself a role.',
    exclusive: true,
    items: [
      { label: "Dm's Open",   roleId: '1263216868051779666', emojiId: '1456884937666859141' },
      { label: 'Ask to DM',   roleId: '1263216913757114458', emojiId: '1456885432162979953' },
      { label: "Closed DM's", roleId: '1263216991229972533', emojiId: '1456885156823564309' },
    ],
  },
  {
    key: 'power',
    title: 'Power Dynamic (NSFW)',
    description: 'React to give yourself a role.',
    exclusive: false,
    items: [
      { label: 'Dominant',   roleId: '1334912781505527839', emojiId: '1456892993360494633' },
      { label: 'Submissive', roleId: '1334912582661967963', emojiId: '1456892947478876160' },
      { label: 'Switch',     roleId: '1334912916138491965', emojiId: '1456894032939585557' },
    ],
  },
  {
    key: 'pings',
    title: 'Ping Roles',
    description: 'React to get pings.',
    exclusive: false,
    items: [
      { label: "Announcement's",   roleId: '1263577787248152596', emojiId: '1456901058134806538' },
      { label: 'Gaming Ping',      roleId: '1263216358720798910', emojiId: '1456900095084859416' },
      { label: 'Dead Chat Ping',   roleId: '1263216472478711973', emojiId: '1456901388872450141' },
      { label: 'Server Bump Ping', roleId: '1263216710052216862', emojiId: '1456902907713814529' },
      { label: 'Voice Chat Ping',  roleId: '1395156995585343610', emojiId: '1395157947612528741' },
    ],
  },
];

// ---------- COLOUR ROLES (DROPDOWN OPTION B) ----------
const COLOUR_ROLE_IDS = [
  "1271989191772999762","1271989807610069033","1271990032512581685","1271991428364370030",
  "1271992162816626768","1271992592543780935","1272002406368149524","1272002180622057583",
  "1272001915378470952","1272001805290831902","1309198526495981580","1272001508841623593",
  "1272001227051368540","1272001105160573001","1272000992082264136","1272000883621761047",
  "1271994645114781769","1271994508510236723","1271994090153574494","1271994238795780177",
  "1271993606240206890","1271993487591604346","1271993365302345770","1271993251271934022",
  "1271993777158098974","1408855617975615631","1408856244378402887","1408858625560154132"
];

const COLOUR_LABELS = [
  "♰ ✦ Ash Veil ✦ ♰",
  "♰ ✦ Obsidian ✦ ♰",
  "♰ ✦ Cinder ✦ ♰",
  "♰ ✦ Flicker ✦ ♰",
  "♰ ✦ Hemogoblin ✦ ♰",
  "♰ ✦ Crimson Shard ✦ ♰",
  "♰ ✦ Vintner ✦ ♰",
  "♰ ✦ Ember Kiss ✦ ♰",
  "♰ ✦ Scorched ✦ ♰",
  "♰ ✦ Corroded ✦ ♰",
  "♰ ✦ Circuit ✦ ♰",
  "♰ ✦ Embercore ✦ ♰",
  "♰ ✦ Toxic Grove ✦ ♰",
  "♰ ✦ Venom Lichen ✦ ♰",
  "♰ ✦ Cyber Jade ✦ ♰",
  "♰ ✦ Viridian Hex ✦ ♰",
  "♰ ✦ Neon Rift ✦ ♰",
  "♰ ✦ Abyssal ✦ ♰",
  "♰ ✦ Cryo Byte ✦ ♰",
  "♰ ✦ Byte Wraith ♰ ✦",
  "♰ ✦ Nullshade ♰ ✦",
  "♰ ✦ Darknet Fiend ♰ ✦",
  "♰ ✦ Hellspire ♰ ✦",
  "♰ ✦ Ether Pulse ♰ ✦",
  "♰ ✦ Glitch Blossom ♰ ✦",
  "♰ ✦ Aurora Wraith ♰ ✦",
  "♰ ✦ Voltage Specter ♰ ✦",
  "♰ ✦ Cyber Siren ♰ ✦"
];

const COLOUR_ROLES = COLOUR_ROLE_IDS.map((id, idx) => ({
  roleId: id,
  label: COLOUR_LABELS[idx] ?? `Colour ${idx + 1}`,
}));

function buildColourEmbed() {
  return new EmbedBuilder()
    .setTitle("Pick your Colour")
    .setDescription(
      "Choose a colour role from the dropdowns below.\n" +
      "Only **one** colour can be selected at a time.\n\n" +
      "Use **Remove Colour** to clear your colour role."
    );
}

function buildColourRows() {
  // Discord limit: 25 options per menu.
  // Put "Remove Colour" + 24 colours in menu1 (25 total).
  // Remaining colours go in menu2.
  const removeOption = { label: "Remove Colour", value: "remove_colour" };

  const first24 = COLOUR_ROLES.slice(0, 24).map(r => ({ label: r.label, value: r.roleId }));
  const rest = COLOUR_ROLES.slice(24).map(r => ({ label: r.label, value: r.roleId }));

  const menu1 = new StringSelectMenuBuilder()
    .setCustomId("color_select_1")
    .setPlaceholder("Choose your Colour! (1/2)")
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions([removeOption, ...first24]);

  const rows = [new ActionRowBuilder().addComponents(menu1)];

  if (rest.length > 0) {
    const menu2 = new StringSelectMenuBuilder()
      .setCustomId("color_select_2")
      .setPlaceholder("Choose your Colour! (2/2)")
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(rest);

    rows.push(new ActionRowBuilder().addComponents(menu2));
  }

  return rows;
}

async function ensureColourPanel(guild) {
  const channel = await guild.channels.fetch(cfg.colorChannelId);
  if (!isTextBasedChannel(channel)) throw new Error(`Colour channel invalid or no access. id=${cfg.colorChannelId}`);

  let msg = null;
  const msgId = (cfg.messages?.colors ?? "").trim();

  if (msgId) {
    try { msg = await channel.messages.fetch(msgId); } catch { msg = null; }
  }

  // If message exists but isn't ours, create a new one
  if (msg && msg.author?.id !== client.user.id) msg = null;

  const payload = { embeds: [buildColourEmbed()], components: buildColourRows() };

  if (!msg) {
    msg = await channel.send(payload);
    cfg.messages.colors = msg.id;
    saveConfig(cfg);
    console.log(`Posted colours dropdown -> ${msg.id}`);
  } else {
    await msg.edit(payload);
    console.log("Updated colours dropdown");
  }
}

// ---------- REACTION PANEL HELPERS ----------
function emojiToString(emojiId) {
  const e = client.emojis.cache.get(emojiId);
  return e ? e.toString() : '❔';
}

function panelText(panel) {
  const lines = panel.items.map(i => `${emojiToString(i.emojiId)} **${i.label}**`);
  return `**${panel.title}**\n${panel.description}\n\n${lines.join('\n')}`;
}

function findPanelByMessageId(messageId) {
  for (const p of PANELS) {
    if (cfg.messages?.[p.key] && String(cfg.messages[p.key]) === String(messageId)) return p;
  }
  return null;
}

function findItemByEmoji(panel, reactionEmoji) {
  const emojiId = reactionEmoji?.id;
  if (!emojiId) return null;
  return panel.items.find(i => String(i.emojiId) === String(emojiId)) || null;
}

async function ensureReactionPanel(channel, panel) {
  const desired = panelText(panel);

  let msgId = (cfg.messages?.[panel.key] ?? "").trim();
  let msg = null;

  if (msgId) {
    try { msg = await channel.messages.fetch(msgId); }
    catch { msg = null; cfg.messages[panel.key] = ""; }
  }

  if (msg && msg.author?.id !== client.user.id) {
    msg = null;
    cfg.messages[panel.key] = "";
  }

  if (!msg) {
    msg = await channel.send({ content: desired });
    cfg.messages[panel.key] = msg.id;
    saveConfig(cfg);
    console.log(`Posted ${panel.key} panel -> ${msg.id}`);
  } else if (msg.content !== desired) {
    await msg.edit({ content: desired });
    console.log(`Updated ${panel.key} panel`);
  }

  for (const item of panel.items) {
    try {
      const emojiObj = client.emojis.cache.get(item.emojiId);
      await msg.react(emojiObj ?? item.emojiId);
    } catch (e) {
      console.log(`Could not react with emoji ${item.emojiId} for ${panel.key}:`, e?.message ?? e);
    }
  }
}

// ---------- REFRESH ALL PANELS ----------
async function refreshAllPanels() {
  const guild = await client.guilds.fetch(cfg.guildId);

  // Fill emoji cache so your panel text shows emojis correctly
  await guild.emojis.fetch().catch(() => {});

  await ensureBotCanManage(guild);

  const rrChannel = await guild.channels.fetch(cfg.channelId);
  if (!isTextBasedChannel(rrChannel)) throw new Error(`RR channel invalid or no access. id=${cfg.channelId}`);

  // Reaction panels (Age first)
  for (const panel of PANELS) {
    await ensureReactionPanel(rrChannel, panel);
  }

  // Colour dropdown panel (Option B)
  await ensureColourPanel(guild);

  saveConfig(cfg);
  console.log('Panels refreshed ✅');
}

// ---------- COMMAND: !setup ----------
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (message.guild?.id !== cfg.guildId) return;

  const content = message.content.trim();
  if (content !== '!setup' && content !== '/setup') return;

  if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return message.reply('You need Administrator to run setup.');
  }

  try {
    await refreshAllPanels();
    await message.reply('Created/updated all panels ✅');
  } catch (e) {
    console.log('Setup error:', e);
    await message.reply(`Setup failed: ${e?.message ?? e}`);
  }
});

// ---------- REACTION ROLE HANDLERS ----------
async function handleReactionToggle(reaction, user, adding) {
  if (user.bot) return;

  try {
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();
  } catch {
    return;
  }

  const panel = findPanelByMessageId(reaction.message.id);
  if (!panel) return;

  const item = findItemByEmoji(panel, reaction.emoji);
  if (!item) return;

  const guild = reaction.message.guild;
  if (!guild) return;

  const member = await guild.members.fetch(user.id);

  if (adding && panel.exclusive) {
    const otherRoleIds = panel.items.map(i => i.roleId).filter(rid => rid !== item.roleId);
    for (const rid of otherRoleIds) {
      if (member.roles.cache.has(rid)) await member.roles.remove(rid).catch(() => {});
    }
  }

  if (adding) {
    if (!member.roles.cache.has(item.roleId)) await member.roles.add(item.roleId).catch(() => {});
  } else {
    if (member.roles.cache.has(item.roleId)) await member.roles.remove(item.roleId).catch(() => {});
  }
}

client.on(Events.MessageReactionAdd, (reaction, user) => {
  handleReactionToggle(reaction, user, true).catch(err => console.log('ReactionAdd error:', err));
});

client.on(Events.MessageReactionRemove, (reaction, user) => {
  handleReactionToggle(reaction, user, false).catch(err => console.log('ReactionRemove error:', err));
});

// ---------- COLOUR DROPDOWN HANDLER ----------
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;
  if (!['color_select_1', 'color_select_2'].includes(interaction.customId)) return;

  const picked = interaction.values?.[0];
  if (!picked) return;

  const guild = interaction.guild;
  if (!guild) return;

  const member = await guild.members.fetch(interaction.user.id);

  // Remove any existing colour roles first (exclusive)
  const toRemove = COLOUR_ROLE_IDS.filter(rid => member.roles.cache.has(rid));
  if (toRemove.length) await member.roles.remove(toRemove).catch(() => {});

  if (picked === "remove_colour") {
    return interaction.reply({ content: "✅ Colour removed.", ephemeral: true }).catch(() => {});
  }

  await member.roles.add(picked).catch(() => {});
  return interaction.reply({ content: "✅ Colour updated!", ephemeral: true }).catch(() => {});
});

// ---------- READY ----------
client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user.tag}`);
  try {
    await refreshAllPanels();
  } catch (e) {
    console.log('Startup refresh error:', e?.message ?? e);
  }
});

client.login(process.env.TOKEN.trim());
