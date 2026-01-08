require("dotenv").config();

const fs = require("fs");
const path = require("path");

const {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  PermissionsBitField,
  ChannelType,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  EmbedBuilder,
} = require("discord.js");

const CONFIG_PATH = path.join(__dirname, "rrpanels.json");

// ---------------- CONFIG LOAD/SAVE ----------------
function defaultConfig() {
  return {
    guildId: "1249782836982972517",
    rrChannelId: "1250450644926464030",
    colourChannelId: "1272601527164600403",
    messages: {
      age: "",
      location: "",
      gender: "",
      sexuality: "",
      dmstatus: "",
      power: "",
      pings: "",
      colourMenu1: "",
      colourMenu2: "",
    },
  };
}

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    const cfg = defaultConfig();
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), "utf8");
    return cfg;
  }
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  } catch (e) {
    const badPath = path.join(__dirname, `rrpanels.bad-${Date.now()}.json`);
    fs.copyFileSync(CONFIG_PATH, badPath);
    const cfg = defaultConfig();
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), "utf8");
    console.log(`rrpanels.json was invalid JSON. Backed up to ${badPath} and recreated.`);
    return cfg;
  }
}

function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), "utf8");
}

let cfg = loadConfig();

// ---------------- DISCORD CLIENT ----------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,           // role add/remove
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,         // for !setup
    GatewayIntentBits.GuildMessageReactions,  // reactions
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.User,
  ],
});

// ---------------- PANELS (RR CHANNEL) ----------------
const PANELS = [
  {
    key: "age",
    title: "Age Roles",
    description: "React to give yourself a role.",
    exclusive: true,
    items: [
      { label: "18-21", roleId: "1263212381387886745", emojiId: "1263442021197287455" },
      { label: "22-25", roleId: "1263212443258323040", emojiId: "1263369965931593753" },
      { label: "26-30", roleId: "1263212568735121520", emojiId: "1263443748189110353" },
      { label: "31+",   roleId: "1263212744812003379", emojiId: "1456838594806288394" },
    ],
  },
  {
    key: "location",
    title: "Location",
    description: "React to give yourself a role.",
    exclusive: true,
    items: [
      { label: "North America", roleId: "1262758629669339188", emojiId: "1456867655423230065" },
      { label: "Europe",        roleId: "1262758761840377858", emojiId: "1456867744157925499" },
      { label: "Asia",          roleId: "1262758804970541168", emojiId: "1456867815679066196" },
      { label: "South America", roleId: "1262758707134074962", emojiId: "1456867687291682897" },
      { label: "Africa",        roleId: "1262758906460115037", emojiId: "1456867886768459983" },
      { label: "Oceania",       roleId: "1327853204544819220", emojiId: "1456867989298221203" },
    ],
  },
  {
    key: "gender",
    title: "Gender roles!",
    description: "React to give yourself a role.",
    exclusive: true,
    items: [
      { label: "Male",        roleId: "1262755983072170055", emojiId: "1456870104594645133" },
      { label: "Female",      roleId: "1262756023945396346", emojiId: "1456870577775181824" },
      { label: "Nonbinary",   roleId: "1262756123195474091", emojiId: "1456776067640721533" },
      { label: "Genderfluid", roleId: "1304973887901008035", emojiId: "1456870851898118287" },
      { label: "Trans Man",   roleId: "1305333687172337880", emojiId: "1456870908558970931" },
      { label: "Trans Woman", roleId: "1328635056394207284", emojiId: "1456870973705027787" },
      { label: "Femboy",      roleId: "1304973954389377024", emojiId: "1456824792693870718" },
    ],
  },
  {
    key: "sexuality",
    title: "Sexuality roles!",
    description: "React to give yourself a role.",
    exclusive: false,
    items: [
      { label: "Straight",   roleId: "1262758197345648700", emojiId: "1456878853468197072" },
      { label: "Gay",        roleId: "1266495777547751535", emojiId: "1456880652149461004" },
      { label: "Lesbian",    roleId: "1266495656386756679", emojiId: "1456878974859743324" },
      { label: "Sapphic",    roleId: "1338263424823464067", emojiId: "1456879048197279744" },
      { label: "Bisexual",   roleId: "1262758262420410428", emojiId: "1456878915489628203" },
      { label: "Pansexual",  roleId: "1262758313431666708", emojiId: "1456879120276262954" },
      { label: "Demisexual", roleId: "1262758355609321553", emojiId: "1456879187997626378" },
      { label: "Asexual",    roleId: "1262758394725666939", emojiId: "1456879240359313429" },
      { label: "Aromantic",  roleId: "1304975770212368406", emojiId: "1456879293350023282" },
    ],
  },
  {
    key: "dmstatus",
    title: "Dm Status",
    description: "React to give yourself a role.",
    exclusive: true,
    items: [
      { label: "Dm's Open",   roleId: "1263216868051779666", emojiId: "1456884937666859141" },
      { label: "Ask to DM",   roleId: "1263216913757114458", emojiId: "1456885432162979953" },
      { label: "Closed DM's", roleId: "1263216991229972533", emojiId: "1456885156823564309" },
    ],
  },
  {
    key: "power",
    title: "Power Dynamic (NSFW)",
    description: "React to give yourself a role.",
    exclusive: false,
    items: [
      { label: "Dominant",   roleId: "1334912781505527839", emojiId: "1456892993360494633" },
      { label: "Submissive", roleId: "1334912582661967963", emojiId: "1456892947478876160" },
      { label: "Switch",     roleId: "1334912916138491965", emojiId: "1456894032939585557" },
    ],
  },
  {
    key: "pings",
    title: "Ping Roles",
    description: "React to get pings.",
    exclusive: false,
    items: [
      { label: "Announcement's",   roleId: "1263577787248152596", emojiId: "1456901058134806538" },
      { label: "Gaming Ping",      roleId: "1263216358720798910", emojiId: "1456900095084859416" },
      { label: "Dead Chat Ping",   roleId: "1263216472478711973", emojiId: "1456901388872450141" },
      { label: "Server Bump Ping", roleId: "1263216710052216862", emojiId: "1456902907713814529" },
      { label: "Voice Chat Ping",  roleId: "1395156995585343610", emojiId: "1395157947612528741" },
    ],
  },
];

// ---------------- COLOUR ROLES (2 DROPDOWNS) ----------------
const COLOUR_ROLES = [
  { label: "♰ ✦ Ash Veil ✦ ♰",        roleId: "1271989191772999762" },
  { label: "♰ ✦ Obsidian ✦ ♰",        roleId: "1271989807610069033" },
  { label: "♰ ✦ Cinder ✦ ♰",          roleId: "1271990032512581685" },
  { label: "♰ ✦ Flicker ✦ ♰",         roleId: "1271991428364370030" },
  { label: "♰ ✦ Hemogoblin ✦ ♰",      roleId: "1271992162816626768" },
  { label: "♰ ✦ Crimson Shard ✦ ♰",   roleId: "1271992592543780935" },
  { label: "♰ ✦ Vintner ✦ ♰",         roleId: "1272002406368149524" },
  { label: "♰ ✦ Ember Kiss ✦ ♰",      roleId: "1272002180622057583" },
  { label: "♰ ✦ Scorched ✦ ♰",        roleId: "1272001915378470952" },
  { label: "♰ ✦ Corroded ✦ ♰",        roleId: "1272001805290831902" },
  { label: "♰ ✦ Circuit ✦ ♰",         roleId: "1309198526495981580" },
  { label: "♰ ✦ Embercore ✦ ♰",       roleId: "1272001508841623593" },
  { label: "♰ ✦ Toxic Grove ✦ ♰",     roleId: "1272001227051368540" },
  { label: "♰ ✦ Venom Lichen ✦ ♰",    roleId: "1272001105160573001" },

  { label: "♰ ✦ Cyber Jade ✦ ♰",      roleId: "1272000992082264136" },
  { label: "♰ ✦ Viridian Hex ✦ ♰",    roleId: "1272000883621761047" },
  { label: "♰ ✦ Neon Rift ✦ ♰",       roleId: "1271994645114781769" },
  { label: "♰ ✦ Abyssal ✦ ♰",         roleId: "1271994508510236723" },
  { label: "♰ ✦ Cryo Byte ✦ ♰",       roleId: "1271994090153574494" },
  { label: "♰ ✦ Byte Wraith ♰ ✦",     roleId: "1271994238795780177" },
  { label: "♰ ✦ Nullshade ♰ ✦",       roleId: "1271993606240206890" },
  { label: "♰ ✦ Darknet Fiend ♰ ✦",   roleId: "1271993487591604346" },
  { label: "♰ ✦ Hellspire ♰ ✦",       roleId: "1271993365302345770" },
  { label: "♰ ✦ Ether Pulse ♰ ✦",     roleId: "1271993251271934022" },
  { label: "♰ ✦ Glitch Blossom ♰ ✦",  roleId: "1271993777158098974" },
  { label: "♰ ✦ Aurora Wraith ♰ ✦",   roleId: "1408855617975615631" },
  { label: "♰ ✦ Voltage Specter ♰ ✦", roleId: "1408856244378402887" },
  { label: "♰ ✦ Cyber Siren ♰ ✦",     roleId: "1408858625560154132" },
];

const COLOUR_ROLE_IDS = COLOUR_ROLES.map(r => r.roleId);

// ---------------- HELPERS ----------------
function safeIsTextChannel(ch) {
  if (!ch) return false;
  if (typeof ch.isTextBased === "function") return ch.isTextBased();
  return ch.type === ChannelType.GuildText;
}

function emojiToString(emojiId) {
  const e = client.emojis.cache.get(emojiId);
  return e ? e.toString() : `:emoji_${emojiId}:`;
}

function panelText(panel) {
  const lines = panel.items.map(i => `${emojiToString(i.emojiId)} **${i.label}**`);
  return `**${panel.title}**\n${panel.description}\n\n${lines.join("\n")}`;
}

function findPanelByMessageId(messageId) {
  for (const p of PANELS) {
    if (cfg.messages?.[p.key] && cfg.messages[p.key] === messageId) return p;
  }
  return null;
}

function findItemByEmoji(panel, reactionEmoji) {
  const emojiId = reactionEmoji?.id; // custom emoji only
  if (!emojiId) return null;
  return panel.items.find(i => i.emojiId === emojiId) || null;
}

async function ensureBotCanManage(guild) {
  const me = await guild.members.fetchMe();
  if (!me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    console.log("⚠️ Bot is missing MANAGE_ROLES permission.");
  }
}

async function fetchOrNull(channel, messageId) {
  if (!messageId || !String(messageId).trim()) return null;
  try {
    return await channel.messages.fetch(messageId);
  } catch {
    return null;
  }
}

// ---------------- REACTION PANELS ----------------
async function ensurePanel(channel, panel) {
  const desired = panelText(panel);

  let msg = await fetchOrNull(channel, cfg.messages?.[panel.key]);

  // Can't edit other people's messages
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

  // Add reactions (won't duplicate)
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

async function refreshReactionPanels() {
  const guild = await client.guilds.fetch(cfg.guildId);
  await ensureBotCanManage(guild);

  const rrChannel = await guild.channels.fetch(cfg.rrChannelId);
  if (!safeIsTextChannel(rrChannel)) throw new Error("RR channel invalid");

  for (const panel of PANELS) {
    await ensurePanel(rrChannel, panel);
  }

  saveConfig(cfg);
  console.log("Reaction panels refreshed ✅");
}

// ---------------- COLOUR DROPDOWNS ----------------
function buildColourMenu(customId, roles, placeholder) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder(placeholder)
    .setMinValues(1)
    .setMaxValues(1);

  for (const r of roles) {
    menu.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(r.label.slice(0, 100))
        .setValue(r.roleId)
    );
  }

  return new ActionRowBuilder().addComponents(menu);
}

async function ensureColourMessage(channel, key, embed, row) {
  let msg = await fetchOrNull(channel, cfg.messages?.[key]);

  if (msg && msg.author?.id !== client.user.id) {
    msg = null;
    cfg.messages[key] = "";
  }

  if (!msg) {
    msg = await channel.send({ embeds: [embed], components: [row] });
    cfg.messages[key] = msg.id;
    saveConfig(cfg);
    console.log(`Posted ${key} -> ${msg.id}`);
  } else {
    await msg.edit({ embeds: [embed], components: [row] });
    console.log(`Updated ${key}`);
  }

  return msg;
}

async function refreshColourMenus() {
  const guild = await client.guilds.fetch(cfg.guildId);
  const colourChannel = await guild.channels.fetch(cfg.colourChannelId);
  if (!safeIsTextChannel(colourChannel)) throw new Error("Colour channel invalid");

  const embed1 = new EmbedBuilder()
    .setTitle("Pick your Colour")
    .setDescription("Choose your colour role from the dropdown below.\n(1/2)");

  const embed2 = new EmbedBuilder()
    .setTitle("Pick your Colour")
    .setDescription("Choose your colour role from the dropdown below.\n(2/2)");

  const firstHalf = COLOUR_ROLES.slice(0, 14);
  const secondHalf = COLOUR_ROLES.slice(14);

  const row1 = buildColourMenu("colour_menu_1", firstHalf, "Choose your Colour! (1/2)");
  const row2 = buildColourMenu("colour_menu_2", secondHalf, "Choose your Colour! (2/2)");

  await ensureColourMessage(colourChannel, "colourMenu1", embed1, row1);
  await ensureColourMessage(colourChannel, "colourMenu2", embed2, row2);

  saveConfig(cfg);
  console.log("Colour menus refreshed ✅");
}

// ---------------- COMMAND: !setup ----------------
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;
  if (message.guild.id !== cfg.guildId) return;

  const content = message.content.trim();
  if (content !== "!setup" && content !== "/setup") return;

  if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return message.reply("You need Administrator to run setup.");
  }

  try {
    await refreshReactionPanels();
    await refreshColourMenus();
    await message.reply("Created/updated all panels + colour menus ✅");
  } catch (e) {
    console.log("Setup error:", e);
    await message.reply(`Setup failed: ${e?.message ?? e}`);
  }
});

// ---------------- SELECT MENU HANDLER (COLOURS) ----------------
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;
  if (interaction.customId !== "colour_menu_1" && interaction.customId !== "colour_menu_2") return;

  try {
    const guild = interaction.guild;
    if (!guild) return;

    const member = await guild.members.fetch(interaction.user.id);
    const chosenRoleId = interaction.values?.[0];
    if (!chosenRoleId) return;

    // Remove all other colour roles first (exclusive colour)
    const removeIds = COLOUR_ROLE_IDS.filter(id => id !== chosenRoleId);
    for (const rid of removeIds) {
      if (member.roles.cache.has(rid)) {
        await member.roles.remove(rid).catch(() => {});
      }
    }

    // Add chosen
    if (!member.roles.cache.has(chosenRoleId)) {
      await member.roles.add(chosenRoleId);
    }

    const chosen = COLOUR_ROLES.find(r => r.roleId === chosenRoleId);
    await interaction.reply({
      content: `✅ Colour set to **${chosen ? chosen.label : "selected role"}**`,
      ephemeral: true,
    });
  } catch (e) {
    console.log("Colour menu error:", e?.message ?? e);
    if (!interaction.replied) {
      await interaction.reply({ content: "❌ Something went wrong setting your colour.", ephemeral: true }).catch(() => {});
    }
  }
});

// ---------------- REACTION ROLE HANDLERS ----------------
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

  // Exclusive panels: when adding, remove other roles from that panel
  if (adding && panel.exclusive) {
    const otherRoleIds = panel.items
      .map(i => i.roleId)
      .filter(rid => rid !== item.roleId);

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
  handleReactionToggle(reaction, user, true).catch(err => console.log("ReactionAdd error:", err));
});

client.on(Events.MessageReactionRemove, (reaction, user) => {
  handleReactionToggle(reaction, user, false).catch(err => console.log("ReactionRemove error:", err));
});

// ---------------- READY ----------------
client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Startup refresh (won't crash the whole bot)
  try {
    await refreshReactionPanels();
    await refreshColourMenus();
  } catch (e) {
    console.log("Startup refresh error:", e?.message ?? e);
  }
});

// ---------------- LOGIN ----------------
client.login(process.env.TOKEN);
