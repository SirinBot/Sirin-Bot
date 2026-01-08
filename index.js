require("dotenv").config();

const fs = require("fs");
const path = require("path");

const {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  PermissionsBitField,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
} = require("discord.js");

const CONFIG_PATH = path.join(__dirname, "rrpanels.json");

// ---------------- CONFIG ----------------
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
    const raw = fs.readFileSync(CONFIG_PATH, "utf8");
    const cfg = JSON.parse(raw);

    // upgrade older config shape: channelId -> rrChannelId
    if (!cfg.rrChannelId && cfg.channelId) {
      cfg.rrChannelId = cfg.channelId;
      delete cfg.channelId;
    }

    if (!cfg.messages) cfg.messages = {};
    return cfg;
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

// ---------------- BOT ----------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,          // needed to add/remove roles
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,        // for !setup
    GatewayIntentBits.GuildMessageReactions, // reaction roles
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.User,
  ],
});

let cfg = loadConfig();

// ---------------- HELPERS ----------------
function isSendableTextChannel(ch) {
  if (!ch) return false;
  // works across different d.js builds
  if (typeof ch.isTextBased === "function") return ch.isTextBased() && typeof ch.send === "function";
  return typeof ch.send === "function";
}

function emojiToString(emojiId) {
  const e = client.emojis.cache.get(emojiId);
  return e ? e.toString() : "❔";
}

function panelText(panel) {
  const lines = panel.items.map(i => `${emojiToString(i.emojiId)} **${i.label}**`);
  return `**${panel.title}**\n${panel.description}\n\n${lines.join("\n")}`;
}

async function ensureBotCanManage(guild) {
  const me = await guild.members.fetchMe();
  if (!me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    console.log("⚠️ Bot is missing MANAGE_ROLES permission.");
  }
}

// ---------------- REACTION PANELS (AGE FIRST) ----------------
const RR_PANELS = [
  {
    key: "age",
    title: "Age Roles",
    description: "React to give yourself a role.",
    exclusive: true,
    items: [
      { label: "18-21", roleId: "1263212381387886745", emojiId: "1263442021197287455" },
      { label: "22-25", roleId: "1263212443258323040", emojiId: "1263369965931593753" },
      { label: "26-30", roleId: "1263212568735121520", emojiId: "1263443748189110353" },
      { label: "31+",   roleId: "1263212744812003379", emojiId: "1456838594806288394" }, // static emoji
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
      { label: "Male",        roleId: "1262755983072170055", hint: "Male",        emojiId: "1456870104594645133" },
      { label: "Female",      roleId: "1262756023945396346", hint: "Female",      emojiId: "1456870577775181824" },
      { label: "Nonbinary",   roleId: "1262756123195474091", hint: "Nonbinary",   emojiId: "1456776067640721533" },
      { label: "Genderfluid", roleId: "1304973887901008035", hint: "Genderfluid", emojiId: "1456870851898118287" },
      { label: "Trans Man",   roleId: "1305333687172337880", hint: "Trans Man",   emojiId: "1456870908558970931" },
      { label: "Trans Woman", roleId: "1328635056394207284", hint: "Trans Woman", emojiId: "1456870973705027787" },
      { label: "Femboy",      roleId: "1304973954389377024", hint: "Femboy",      emojiId: "1456824792693870718" }, // animated ok
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
      { label: "Dm's Open",    roleId: "1263216868051779666", emojiId: "1456884937666859141" },
      { label: "Ask to DM",    roleId: "1263216913757114458", emojiId: "1456885432162979953" },
      { label: "Closed DM's",  roleId: "1263216991229972533", emojiId: "1456885156823564309" },
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

function findPanelByMessageId(messageId) {
  for (const p of RR_PANELS) {
    if (cfg.messages?.[p.key] && cfg.messages[p.key] === messageId) return p;
  }
  return null;
}

function findItemByEmoji(panel, reactionEmoji) {
  const emojiId = reactionEmoji?.id; // custom emoji => id
  if (!emojiId) return null;
  return panel.items.find(i => i.emojiId === emojiId) || null;
}

async function ensureReactionPanel(channel, panel) {
  const desired = panelText(panel);

  let msgId = cfg.messages?.[panel.key];
  let msg = null;

  if (msgId && msgId.trim().length > 0) {
    try {
      msg = await channel.messages.fetch(msgId);
    } catch {
      msg = null;
      cfg.messages[panel.key] = "";
      saveConfig(cfg);
    }
  }

  if (msg && msg.author?.id !== client.user.id) {
    msg = null;
    cfg.messages[panel.key] = "";
    saveConfig(cfg);
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

  // add reactions
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

// ---------------- COLOUR DROPDOWNS (OPTION B) ----------------

// role IDs given in order + names you gave in the same order
const COLOUR_ROLES = [
  { roleId: "1271989191772999762", name: "♰ ✦ Ash Veil ✦ ♰" },
  { roleId: "1271989807610069033", name: "♰ ✦ Obsidian ✦ ♰" },
  { roleId: "1271990032512581685", name: "♰ ✦ Cinder ✦ ♰" },
  { roleId: "1271991428364370030", name: "♰ ✦ Flicker ✦ ♰" },
  { roleId: "1271992162816626768", name: "♰ ✦ Hemogoblin ✦ ♰" },
  { roleId: "1271992592543780935", name: "♰ ✦ Crimson Shard ✦ ♰" },
  { roleId: "1272002406368149524", name: "♰ ✦ Vintner ✦ ♰" },
  { roleId: "1272002180622057583", name: "♰ ✦ Ember Kiss ✦ ♰" },
  { roleId: "1272001915378470952", name: "♰ ✦ Scorched ✦ ♰" },
  { roleId: "1272001805290831902", name: "♰ ✦ Corroded ✦ ♰" },
  { roleId: "1309198526495981580", name: "♰ ✦ Circuit ✦ ♰" },
  { roleId: "1272001508841623593", name: "♰ ✦ Embercore ✦ ♰" },
  { roleId: "1272001227051368540", name: "♰ ✦ Toxic Grove ✦ ♰" },
  { roleId: "1272001105160573001", name: "♰ ✦ Venom Lichen ✦ ♰" },

  { roleId: "1272000992082264136", name: "♰ ✦ Cyber Jade ✦ ♰" },
  { roleId: "1272000883621761047", name: "♰ ✦ Viridian Hex ✦ ♰" },
  { roleId: "1271994645114781769", name: "♰ ✦ Neon Rift ✦ ♰" },
  { roleId: "1271994508510236723", name: "♰ ✦ Abyssal ✦ ♰" },
  { roleId: "1271994090153574494", name: "♰ ✦ Cryo Byte ✦ ♰" },
  { roleId: "1271994238795780177", name: "♰ ✦ Byte Wraith ♰ ✦" },
  { roleId: "1271993606240206890", name: "♰ ✦ Nullshade ♰ ✦" },
  { roleId: "1271993487591604346", name: "♰ ✦ Darknet Fiend ♰ ✦" },
  { roleId: "1271993365302345770", name: "♰ ✦ Hellspire ♰ ✦" },
  { roleId: "1271993251271934022", name: "♰ ✦ Ether Pulse ♰ ✦" },
  { roleId: "1271993777158098974", name: "♰ ✦ Glitch Blossom ♰ ✦" },
  { roleId: "1408855617975615631", name: "♰ ✦ Aurora Wraith ♰ ✦" },
  { roleId: "1408856244378402887", name: "♰ ✦ Voltage Specter ♰ ✦" },
  { roleId: "1408858625560154132", name: "♰ ✦ Cyber Siren ♰ ✦" },
];

const COLOUR_MENU_1_ID = "colour_menu_1";
const COLOUR_MENU_2_ID = "colour_menu_2";

// split into two menus (max 25 each)
const COLOUR_MENU_1 = COLOUR_ROLES.slice(0, 14);
const COLOUR_MENU_2 = COLOUR_ROLES.slice(14);

function buildColourEmbed() {
  return new EmbedBuilder()
    .setTitle("Pick your Colour")
    .setDescription(
      "React to choose your colour role.\n\n" +
      "Use the dropdown menus below to select a colour.\n" +
      "Picking a new one will replace your previous colour role."
    );
}

function buildColourMenu(customId, options, placeholder) {
  return new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder(placeholder)
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(
      options.map((c) => ({
        label: c.name.length > 100 ? c.name.slice(0, 97) + "..." : c.name,
        value: c.roleId,
        emoji: "🎨", // simple + always works
      }))
    );
}

async function ensureColourMenus(colourChannel) {
  const embed = buildColourEmbed();

  const row1 = new ActionRowBuilder().addComponents(
    buildColourMenu(COLOUR_MENU_1_ID, COLOUR_MENU_1, "Choose your Colour (1/2)!")
  );

  const row2 = new ActionRowBuilder().addComponents(
    buildColourMenu(COLOUR_MENU_2_ID, COLOUR_MENU_2, "Choose your Colour (2/2)!")
  );

  // message 1
  let m1 = null;
  const id1 = cfg.messages?.colourMenu1;
  if (id1) {
    try { m1 = await colourChannel.messages.fetch(id1); } catch { m1 = null; cfg.messages.colourMenu1 = ""; saveConfig(cfg); }
  }
  if (!m1 || m1.author?.id !== client.user.id) {
    m1 = await colourChannel.send({ embeds: [embed], components: [row1] });
    cfg.messages.colourMenu1 = m1.id;
    saveConfig(cfg);
    console.log("Posted colour menu 1 ->", m1.id);
  } else {
    await m1.edit({ embeds: [embed], components: [row1] }).catch(() => {});
  }

  // message 2
  let m2 = null;
  const id2 = cfg.messages?.colourMenu2;
  if (id2) {
    try { m2 = await colourChannel.messages.fetch(id2); } catch { m2 = null; cfg.messages.colourMenu2 = ""; saveConfig(cfg); }
  }
  if (!m2 || m2.author?.id !== client.user.id) {
    m2 = await colourChannel.send({ components: [row2] });
    cfg.messages.colourMenu2 = m2.id;
    saveConfig(cfg);
    console.log("Posted colour menu 2 ->", m2.id);
  } else {
    await m2.edit({ components: [row2] }).catch(() => {});
  }
}

// ---------------- REFRESH EVERYTHING ----------------
async function refreshAllPanels() {
  cfg = loadConfig(); // reload each time (avoids “undefined” keys)
  const guild = await client.guilds.fetch(cfg.guildId);

  await ensureBotCanManage(guild);

  const rrChannel = await guild.channels.fetch(cfg.rrChannelId);
  if (!isSendableTextChannel(rrChannel)) throw new Error("RR channel invalid");

  const colourChannel = await guild.channels.fetch(cfg.colourChannelId);
  if (!isSendableTextChannel(colourChannel)) throw new Error("Colour channel invalid");

  // RR panels in RR channel
  for (const panel of RR_PANELS) {
    await ensureReactionPanel(rrChannel, panel);
  }

  // Colour dropdowns in colour channel
  await ensureColourMenus(colourChannel);

  console.log("Panels refreshed ✅");
}

// ---------------- COMMAND: /setup or !setup typed in chat ----------------
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (message.guild?.id !== cfg.guildId) return;

  const content = message.content.trim();
  if (content !== "!setup" && content !== "/setup") return;

  if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return message.reply("You need Administrator to run setup.");
  }

  try {
    await refreshAllPanels();
    await message.reply("Created/updated all panels ✅");
  } catch (e) {
    console.log("Setup error:", e);
    await message.reply(`Setup failed: ${e?.message ?? e}`);
  }
});

// ---------------- SELECT MENU HANDLER (COLOURS) ----------------
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;

  if (interaction.customId !== COLOUR_MENU_1_ID && interaction.customId !== COLOUR_MENU_2_ID) return;

  try {
    const guild = interaction.guild;
    if (!guild) return;

    const member = await guild.members.fetch(interaction.user.id);
    const pickedRoleId = interaction.values[0];

    // remove ALL colour roles first (exclusive across both menus)
    const allColourRoleIds = COLOUR_ROLES.map(c => c.roleId);
    const toRemove = member.roles.cache.filter(r => allColourRoleIds.includes(r.id)).map(r => r.id);

    if (toRemove.length) {
      await member.roles.remove(toRemove).catch(() => {});
    }

    // add selected
    await member.roles.add(pickedRoleId);

    const pickedName = COLOUR_ROLES.find(c => c.roleId === pickedRoleId)?.name ?? "colour";
    await interaction.reply({ content: `✅ Set your colour to **${pickedName}**`, ephemeral: true });
  } catch (e) {
    console.log("Colour select error:", e?.message ?? e);
    if (!interaction.replied) {
      await interaction.reply({ content: "❌ I couldn't set your colour role (check my role position + permissions).", ephemeral: true }).catch(() => {});
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
  handleReactionToggle(reaction, user, true).catch(() => {});
});

client.on(Events.MessageReactionRemove, (reaction, user) => {
  handleReactionToggle(reaction, user, false).catch(() => {});
});

// ---------------- READY ----------------
client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user.tag}`);

  try {
    await refreshAllPanels();
  } catch (e) {
    console.log("Startup refresh error:", e?.message ?? e);
  }
});

// avoid “crash loops” in hosting logs
client.on("error", (err) => console.log("Client error:", err?.message ?? err));
process.on("unhandledRejection", (err) => console.log("UnhandledRejection:", err?.message ?? err));

client.login(process.env.TOKEN);

