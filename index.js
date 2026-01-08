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
} = require("discord.js");

const CONFIG_PATH = path.join(__dirname, "rrpanels.json");

// =====================
// CONFIG (load/save + migration)
// =====================
function defaultConfig() {
  return {
    guildId: "1249782836982972517",

    // Reaction role panels channel:
    rrChannelId: "1250450644926464030",

    // Colour dropdown channel:
    colourChannelId: "1272601527164600403",

    // Message IDs (bot will edit if it owns them; otherwise it will create new)
    messages: {
      age: "1456859415843045497",
      location: "1456876189359669259",
      gender: "1456864506515820689",
      sexuality: "1456876128017977405",
      dmstatus: "1456888550288003244",
      power: "1456896005571088529",
      pings: "",

      // dropdown message(s) in colour channel
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

    // ---- MIGRATION: if older config used channelId, migrate it ----
    if (!cfg.rrChannelId && cfg.channelId) {
      cfg.rrChannelId = cfg.channelId;
      delete cfg.channelId;
    }

    // Ensure required keys exist
    const def = defaultConfig();
    cfg.guildId = cfg.guildId ?? def.guildId;
    cfg.rrChannelId = cfg.rrChannelId ?? def.rrChannelId;
    cfg.colourChannelId = cfg.colourChannelId ?? def.colourChannelId;
    cfg.messages = { ...def.messages, ...(cfg.messages || {}) };

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), "utf8");
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

let cfg = loadConfig();

// =====================
// DISCORD CLIENT
// =====================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,          // add/remove roles
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,        // !setup
    GatewayIntentBits.GuildMessageReactions, // reaction roles
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.User,
  ],
});

// =====================
// REACTION ROLE PANELS (Age first)
// =====================
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

// =====================
// COLOUR DROPDOWN (Option B, split into 2 menus)
// =====================
const COLOUR_ROLE_IDS_IN_ORDER = [
  "1271989191772999762",
  "1271989807610069033",
  "1271990032512581685",
  "1271991428364370030",
  "1271992162816626768",
  "1271992592543780935",
  "1272002406368149524",
  "1272002180622057583",
  "1272001915378470952",
  "1272001805290831902",
  "1309198526495981580",
  "1272001508841623593",
  "1272001227051368540",
  "1272001105160573001",
  "1272000992082264136",
  "1272000883621761047",
  "1271994645114781769",
  "1271994508510236723",
  "1271994090153574494",
  "1271994238795780177",
  "1271993606240206890",
  "1271993487591604346",
  "1271993365302345770",
  "1271993251271934022",
  "1271993777158098974",
  "1408855617975615631",
  "1408856244378402887",
  "1408858625560154132",
];

const COLOUR_ROLE_NAMES_IN_ORDER = [
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
  "♰ ✦ Cyber Siren ♰ ✦",
];

function buildColourOptions(start, end) {
  const opts = [];
  for (let i = start; i < end; i++) {
    const roleId = COLOUR_ROLE_IDS_IN_ORDER[i];
    const name = COLOUR_ROLE_NAMES_IN_ORDER[i] ?? `Colour ${i + 1}`;
    opts.push({
      label: name.slice(0, 100),
      value: roleId, // we store roleId directly
    });
  }
  // Allow "remove colour"
  opts.unshift({
    label: "Remove my colour role",
    value: "remove_colour",
  });
  return opts;
}

// =====================
// HELPERS
// =====================
function channelCanSend(ch) {
  return ch && typeof ch.send === "function";
}

async function ensureBotCanManage(guild) {
  const me = await guild.members.fetchMe();
  if (!me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    console.log("⚠️ Bot is missing MANAGE_ROLES permission.");
  }
}

async function preloadGuildEmojis(guild) {
  try {
    await guild.emojis.fetch();
  } catch {}
}

function emojiToString(emojiId) {
  const e = client.emojis.cache.get(emojiId);
  return e ? e.toString() : "❔";
}

function panelText(panel) {
  const lines = panel.items.map((i) => `${emojiToString(i.emojiId)} **${i.label}**`);
  return `**${panel.title}**\n${panel.description}\n\n${lines.join("\n")}`;
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
  return panel.items.find((i) => i.emojiId === emojiId) || null;
}

// =====================
// ENSURE/REFRESH REACTION PANELS
// =====================
async function ensurePanel(rrChannel, panel) {
  const desired = panelText(panel);

  let msgId = cfg.messages?.[panel.key];
  let msg = null;

  if (msgId && String(msgId).trim().length) {
    try {
      msg = await rrChannel.messages.fetch(msgId);
    } catch {
      msg = null;
      cfg.messages[panel.key] = "";
    }
  }

  // If message exists but isn't authored by bot, make a new one
  if (msg && msg.author?.id !== client.user.id) {
    msg = null;
    cfg.messages[panel.key] = "";
  }

  if (!msg) {
    msg = await rrChannel.send({ content: desired });
    cfg.messages[panel.key] = msg.id;
    saveConfig(cfg);
    console.log(`Posted ${panel.key} panel -> ${msg.id}`);
  } else {
    if (msg.content !== desired) {
      await msg.edit({ content: desired });
      console.log(`Updated ${panel.key} panel`);
    }
  }

  // React with each emoji
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

async function refreshReactionPanels(guild) {
  const rrChannel = await guild.channels.fetch(cfg.rrChannelId);
  if (!channelCanSend(rrChannel)) throw new Error("RR channel invalid (wrong channel id or bot can't send there)");

  for (const panel of PANELS) {
    await ensurePanel(rrChannel, panel);
  }

  saveConfig(cfg);
  console.log("Reaction panels refreshed ✅");
}

// =====================
// COLOUR MENUS (dropdowns)
// =====================
async function ensureColourMenus(guild) {
  const colourChannel = await guild.channels.fetch(cfg.colourChannelId);
  if (!channelCanSend(colourChannel)) throw new Error("Colour channel invalid (wrong channel id or bot can't send there)");

  const menu1 = new StringSelectMenuBuilder()
    .setCustomId("colour_menu_1")
    .setPlaceholder("Choose your Colour! (Page 1)")
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(buildColourOptions(0, 14));

  const menu2 = new StringSelectMenuBuilder()
    .setCustomId("colour_menu_2")
    .setPlaceholder("Choose your Colour! (Page 2)")
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(buildColourOptions(14, 28));

  const row1 = new ActionRowBuilder().addComponents(menu1);
  const row2 = new ActionRowBuilder().addComponents(menu2);

  const content = "**Pick your Colour**\nReact to choose your colour role.";

  // message 1
  let m1 = null;
  if (cfg.messages.colourMenu1) {
    try {
      m1 = await colourChannel.messages.fetch(cfg.messages.colourMenu1);
    } catch {
      m1 = null;
      cfg.messages.colourMenu1 = "";
    }
  }
  if (!m1 || m1.author?.id !== client.user.id) {
    m1 = await colourChannel.send({ content, components: [row1] });
    cfg.messages.colourMenu1 = m1.id;
  } else {
    await m1.edit({ content, components: [row1] });
  }

  // message 2
  let m2 = null;
  if (cfg.messages.colourMenu2) {
    try {
      m2 = await colourChannel.messages.fetch(cfg.messages.colourMenu2);
    } catch {
      m2 = null;
      cfg.messages.colourMenu2 = "";
    }
  }
  if (!m2 || m2.author?.id !== client.user.id) {
    m2 = await colourChannel.send({ content, components: [row2] });
    cfg.messages.colourMenu2 = m2.id;
  } else {
    await m2.edit({ content, components: [row2] });
  }

  saveConfig(cfg);
  console.log("Colour menus refreshed ✅");
}

// Remove any existing colour roles, then apply the selected one (exclusive)
async function applyColourRole(member, selectedRoleId) {
  const allColourRoleIds = new Set(COLOUR_ROLE_IDS_IN_ORDER);

  // remove existing colour roles first
  const toRemove = member.roles.cache.filter((r) => allColourRoleIds.has(r.id));
  if (toRemove.size) {
    await member.roles.remove(toRemove.map((r) => r.id)).catch(() => {});
  }

  if (selectedRoleId && selectedRoleId !== "remove_colour") {
    await member.roles.add(selectedRoleId);
  }
}

// =====================
// !setup command
// =====================
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
    const guild = message.guild;
    await preloadGuildEmojis(guild);
    await refreshReactionPanels(guild);
    await ensureColourMenus(guild);
    await message.reply("Created/updated everything ✅");
  } catch (e

