require('dotenv').config();

const fs = require('fs');
const path = require('path');
const {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require('discord.js');

const CONFIG_PATH = path.join(__dirname, 'rrpanels.json');

// ---------- CONFIG LOAD/SAVE ----------
function defaultConfig() {
  return {
    guildId: "1249782836982972517",

    // Reaction-role panels channel
    channelId: "1250450644926464030",

    // Colour roles dropdown channel
    colorChannelId: "1272601527164600403",

    messages: {
      age: "1456859415843045497",
      location: "1456876189359669259",
      gender: "1456864506515820689",
      sexuality: "1456876128017977405",
      dmstatus: "1456888550288003244",
      power: "1456896005571088529",
      pings: "",

      // Colour dropdown panel message id (blank => bot will post it)
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
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    return JSON.parse(raw);
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

let cfg = loadConfig();

// ---------- REACTION ROLE PANELS (AGE FIRST) ----------
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
      { label: "Dm's Open",    roleId: '1263216868051779666', emojiId: '1456884937666859141' },
      { label: 'Ask to DM',    roleId: '1263216913757114458', emojiId: '1456885432162979953' },
      { label: "Closed DM's",  roleId: '1263216991229972533', emojiId: '1456885156823564309' },
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

// ---------- COLOUR ROLES (DROPDOWN) ----------
const COLOR_PANEL = {
  key: "colors",
  title: "Pick your Colour",
  description:
    "It's a small but fun way to express yourself and stand out from the crowd.\n\n" +
    "Just pick one of the colors below and make it your own.\n" +
    "And remember, you can always change your color whenever you feel like it!",
  placeholder: "Choose your Colour!",
  exclusive: true,
  items: [
    { label: "Ash Veil", roleId: "1271989191772999762" },
    { label: "Obsidian", roleId: "1271989807610069033" },
    { label: "Cinder", roleId: "1271990032512581685" },
    { label: "Flicker", roleId: "1271991428364370030" },
    { label: "Hemoglobin", roleId: "1271992162816626768" },
    { label: "Ember", roleId: "1271992592543780935" },
    { label: "Glow", roleId: "1272002406368149524" },
    { label: "Violet", roleId: "1272002180622057583" },
    { label: "Rose", roleId: "1272001915378470952" },
    { label: "Crimson", roleId: "1272001805290831902" },
    { label: "Void", roleId: "1309198526495981580" },
    { label: "Frost", roleId: "1272001508841623593" },
    { label: "Sky", roleId: "1272001227051368540" },
    { label: "Ocean", roleId: "1272001105160573001" },
    { label: "Mint", roleId: "1272000992082264136" },
    { label: "Lime", roleId: "1272000883621761047" },
    { label: "Peach", roleId: "1271994645114781769" },
    { label: "Sand", roleId: "1271994508510236723" },
    { label: "Ivory", roleId: "1271994090153574494" },
    { label: "Slate", roleId: "1271994238795780177" },
    { label: "Shadow", roleId: "1271993606240206890" },
    { label: "Ink", roleId: "1271993487591604346" },
    { label: "Storm", roleId: "1271993365302345770" },
    { label: "Coal", roleId: "1271993251271934022" },
    { label: "Plasma", roleId: "1271993777158098974" },
    { label: "Aurora", roleId: "1408855617975615631" },
    { label: "Nebula", roleId: "1408856244378402887" },
    { label: "Eclipse", roleId: "1408858625560154132" },
  ]
};

// ---------- HELPERS ----------
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
    if (cfg.messages?.[p.key] && cfg.messages[p.key] === messageId) return p;
  }
  return null;
}

function findItemByEmoji(panel, reactionEmoji) {
  const emojiId = reactionEmoji?.id;
  if (!emojiId) return null;
  return panel.items.find(i => i.emojiId === emojiId) || null;
}

async function ensureBotCanManage(guild) {
  const me = await guild.members.fetchMe();
  if (!me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    console.log('⚠️ Bot is missing MANAGE_ROLES permission.');
  }
}

async function ensurePanel(channel, panel) {
  const desired = panelText(panel);

  let msgId = cfg.messages?.[panel.key];
  let msg = null;

  if (msgId && msgId.trim().length > 0) {
    try {
      msg = await channel.messages.fetch(msgId);
    } catch {
      msg = null;
      cfg.messages[panel.key] = "";
    }
  }

  // If not our message, we cannot edit it -> post a new one
  if (msg && msg.author?.id !== client.user.id) {
    msg = null;
    cfg.messages[panel.key] = "";
  }

  if (!msg) {
    msg = await channel.send({ content: desired });
    cfg.messages[panel.key] = msg.id;
    saveConfig(cfg);
    console.log(`Posted ${panel.key} panel -> ${msg.id}`);
  } else {
    if (msg.content !== desired) {
      await msg.edit({ content: desired });
      console.log(`Updated ${panel.key} panel`);
    }
  }

  // Add reactions (no duplicates)
  for (const item of panel.items) {
    try {
      const emojiObj = client.emojis.cache.get(item.emojiId);
      await msg.react(emojiObj ?? item.emojiId);
    } catch (e) {
      console.log(`Could not react with emoji ${item.emojiId} for ${panel.key}:`, e?.message ?? e);
    }
  }

  return msg;
}

// ---------- COLOUR PANEL HELPERS ----------
function buildColorEmbed() {
  return new EmbedBuilder()
    .setTitle(COLOR_PANEL.title)
    .setDescription(COLOR_PANEL.description)
    .setColor(0xb84cff);
}

function buildColorMenu() {
  return new StringSelectMenuBuilder()
    .setCustomId('color_roles_select')
    .setPlaceholder(COLOR_PANEL.placeholder)
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(
      COLOR_PANEL.items.map(c => ({
        label: c.label,
        value: c.roleId,
      }))
    );
}

async function ensureColorPanel(guild) {
  const channel = await guild.channels.fetch(cfg.colorChannelId);
  if (!channel || !channel.isTextBased()) throw new Error('Color channelId is not a text channel.');

  let msg = null;
  const msgId = cfg.messages.colors;

  if (msgId && msgId.trim().length > 0) {
    try { msg = await channel.messages.fetch(msgId); } catch { msg = null; }
  }

  const payload = {
    embeds: [buildColorEmbed()],
    components: [new ActionRowBuilder().addComponents(buildColorMenu())],
  };

  if (!msg) {
    msg = await channel.send(payload);
    cfg.messages.colors = msg.id;
    saveConfig(cfg);
    console.log(`Posted colors panel -> ${msg.id}`);
  } else {
    await msg.edit(payload);
    console.log('Updated colors panel');
  }
}

// ---------- REFRESH ALL PANELS ----------
async function refreshAllPanels() {
  const guild = await client.guilds.fetch(cfg.guildId);

  // Ensures custom emoji are cached before we render text/react
  await guild.emojis.fetch().catch(() => {});

  await ensureBotCanManage(guild);

  const rrChannel = await guild.channels.fetch(cfg.channelId);
  if (!rrChannel || !rrChannel.isTextBased()) throw new Error('Configured channelId is not a text channel.');

  for (const panel of PANELS) {
    await ensurePanel(rrChannel, panel);
  }

  // Separate channel: colour dropdown
  await ensureColorPanel(guild);

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

  // Exclusive: remove others in same panel when adding
  if (adding && panel.exclusive) {
    const otherRoleIds = panel.items.map(i => i.roleId).filter(rid => rid !== item.roleId);
    for (const rid of otherRoleIds) {
      if (member.roles.cache.has(rid)) {
        await member.roles.remove(rid).catch(() => {});
      }
    }
  }

  if (adding) {
    if (!member.roles.cache.has(item.roleId)) {
      await member.roles.add(item.roleId).catch(() => {});
    }
  } else {
    if (member.roles.cache.has(item.roleId)) {
      await member.roles.remove(item.roleId).catch(() => {});
    }
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
  if (interaction.customId !== 'color_roles_select') return;

  const member = await interaction.guild.members.fetch(interaction.user.id);
  const selectedRoleId = interaction.values[0];

  // Remove all other colour roles
  for (const c of COLOR_PANEL.items) {
    if (c.roleId !== selectedRoleId && member.roles.cache.has(c.roleId)) {
      await member.roles.remove(c.roleId).catch(() => {});
    }
  }

  // Toggle selected role
  if (member.roles.cache.has(selectedRoleId)) {
    await member.roles.remove(selectedRoleId).catch(() => {});
    await interaction.reply({ content: 'Colour removed ✅', ephemeral: true });
  } else {
    await member.roles.add(selectedRoleId).catch(() => {});
    const name = COLOR_PANEL.items.find(x => x.roleId === selectedRoleId)?.label ?? 'that colour';
    await interaction.reply({ content: `Colour set to **${name}** 🎨`, ephemeral: true });
  }
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

client.login(process.env.TOKEN);
