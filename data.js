const DATA = {
  killers: {
    theme: { accent: "#d21f3c", glow: "#ff3b56" },
    list: [
      { id: "k-fleetway", name: "Fleetway", role: "Rushdown juggernaut", seed: 5, img: "" },
      { id: "k-kolossos", name: "Kolossos", role: "Brutal high-damage brawler", seed: 4, img: "" },
      { id: "k-2011x", name: "2011x", role: "Starter Executioner", seed: 3, img: "" },
      { id: "k-tripwire", name: "Tripwire", role: "Traps & bleed damage", seed: 2, img: "" },
    ],
  },
  survivors: {
    theme: { accent: "#f2c14e", glow: "#ffd873" },
    list: [
      { id: "s-metal", name: "Metal Sonic", role: "Self-destruct sacrifice", seed: 5, img: "" },
      { id: "s-sonic", name: "Sonic", role: "Balanced all-round speed", seed: 4, img: "" },
      { id: "s-cream", name: "Cream", role: "Healer", seed: 4, img: "" },
      { id: "s-silver", name: "Silver", role: "Ranged support, telekinetic slows", seed: 4, img: "" },
      { id: "s-eggman", name: "Eggman", role: "Jetpack double jump", seed: 3, img: "" },
      { id: "s-tails", name: "Tails", role: "Flight & support", seed: 2, img: "" },
      { id: "s-knuckles", name: "Knuckles", role: "Wall-breaking shortcuts", seed: 3, img: "" },
      { id: "s-blaze", name: "Blaze", role: "Hit-and-run, fire damage on stunned hits", seed: 3, img: "" },
      { id: "s-amy", name: "Amy", role: "Close-range hammer control", seed: 3, img: "" },
    ],
  },
  MAP: {
    theme: { accent: "#3aa0ff", glow: "#7dc4ff" },
    list: [
      { id: "map-hillgym", name: "HILL.GYM", role: "Complex multi-level fortress", seed: 5, img: "" },
      { id: "map-angelisland", name: "Angel Island", role: "Jungle & shrine layout", seed: 4, img: "" },
      { id: "map-ycr", name: "You Can't Run", role: "Tight chase corridors", seed: 4, img: "" },
      { id: "map-notperfect", name: "Not Perfect", role: "Distorted glitch zone", seed: 3, img: "" },
      { id: "map-greenhill", name: "Green Hill", role: "Classic opening zone", seed: 2, img: "" },
      { id: "map-mysticcave", name: "Mystic Cave", role: "Dark underground maze", seed: 1, img: "" },
    ],
  },
  LMS: {
    theme: { accent: "#f2c14e", glow: "#ffd873" },
    list: [
      { id: "s-metal", name: "Metal Sonic", role: "Self-destruct sacrifice", seed: 5, img: "" },
      { id: "s-cream", name: "Cream", role: "Healer", seed: 5, img: "" },
      { id: "s-sonic", name: "Sonic", role: "Balanced all-round speed", seed: 4, img: "" },
      { id: "s-eggman", name: "Eggman", role: "Jetpack double jump", seed: 4, img: "" },
      { id: "s-blaze", name: "Blaze", role: "Hit-and-run, fire damage on stunned hits", seed: 4, img: "" },
      { id: "s-knuckles", name: "Knuckles", role: "Wall-breaking shortcuts", seed: 3, img: "" },
      { id: "s-tails", name: "Tails", role: "Flight & support", seed: 3, img: "" },
      { id: "s-silver", name: "Silver", role: "Ranged support, telekinetic slows", seed: 3, img: "" },
      { id: "s-amy", name: "Amy", role: "Close-range hammer control", seed: 2, img: "" },
    ],
  },
  panel: {
    theme: { accent: "#a855f7", glow: "#c084fc" },
    list: [
      { id: "p-supersonic", name: "Super Sonic", role: "", seed: 3, img: "" },
      { id: "p-chara", name: "Chara", role: "", seed: 3, img: "" },
      { id: "p-baldi", name: "Baldi", role: "", seed: 3, img: "" },
      { id: "p-bear5", name: "Bear5", role: "", seed: 3, img: "" },
      { id: "p-sans", name: "Sans", role: "", seed: 3, img: "" },
      { id: "p-meowl", name: "Meowl", role: "", seed: 3, img: "" },
      { id: "p-clover", name: "Clover", role: "", seed: 3, img: "" },
      { id: "p-steve", name: "Steve", role: "", seed: 3, img: "" },
      { id: "p-cream", name: "Cream", role: "", seed: 3, img: "" },
      { id: "p-v1", name: "V1", role: "", seed: 3, img: "" },
      { id: "p-neometalsonic", name: "Neo Metal Sonic", role: "", seed: 3, img: "" },
    ],
  },
};

const TIER_SCHEMES = {
  default: ["S", "A", "B", "C", "D"],
  panel: ["OP", "SS+", "S+", "S", "A"],
};

function schemeForSide(side) {
  return side === "panel" ? "panel" : "default";
}

function tierOrderFor(side) {
  return TIER_SCHEMES[schemeForSide(side)];
}

function tierScoreFor(side, label) {
  const order = tierOrderFor(side);
  return 5 - order.indexOf(label);
}

const CYCLE_MS = 24 * 60 * 60 * 1000;

function tierFromAvg(side, avg) {
  const order = tierOrderFor(side);
  if (avg >= 4.5) return order[0];
  if (avg >= 3.5) return order[1];
  if (avg >= 2.5) return order[2];
  if (avg >= 1.5) return order[3];
  return order[4];
}

function colorFor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue},55%,50%)`;
}

function placeholderAvatar(str) {
  const hex = colorFor(str);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" rx="22" fill="${hex}"/>
    <circle cx="50" cy="38" r="17" fill="rgba(255,255,255,0.88)"/>
    <path d="M50 60c-19 0-31 12-31 25v7h62v-7c0-13-12-25-31-25z" fill="rgba(255,255,255,0.88)"/>
  </svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

function folderForSide(side) {
  if (side === "MAP") return "maps";
  if (side === "panel") return "characters/panel";
  return "characters";
}

function avatarImgHTML(ch, side, width, height) {
  const folder = folderForSide(side);
  const autoPath = `images/${folder}/` + encodeURIComponent(ch.name) + ".png";
  const src = ch.img || autoPath;
  const placeholder = placeholderAvatar(ch.name);
  const h = height || width;
  return `<img class="avatar" style="width:${width}px;height:${h}px;" src="${src}" alt="${ch.name}" onerror="this.onerror=null;this.src='${placeholder}';">`;
}

const SUPABASE_URL = "https://qfevxppkurqbdtdaidtq.supabase.co";
const SUPABASE_KEY = "sb_publishable_JoQ6KZQjTioykLad8Orl1Q_WbEwLUUD";
const TABLE_NAME = "Outcome Memories voites";
const TABLE_PATH = encodeURIComponent(TABLE_NAME);

const hasStorage = true;

async function sGet(key, shared) {
  if (!shared) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${TABLE_PATH}?key=eq.${encodeURIComponent(key)}&select=value`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return rows.length ? rows[0].value : null;
  } catch (e) {
    return null;
  }
}

async function sSet(key, value, shared) {
  if (!shared) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      return false;
    }
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_PATH}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify([{ key, value }]),
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

async function getAgg(side, id) {
  const raw = await sGet(`agg:${side}:${id}`, true);
  return raw ? JSON.parse(raw) : { sum: 0, count: 0 };
}
async function setAgg(side, id, agg) {
  await sSet(`agg:${side}:${id}`, JSON.stringify(agg), true);
}

function isDampenTrigger(side, votesMap) {
  const order = tierOrderFor(side);
  const best = order[0];
  const worst = order[order.length - 1];
  const total = DATA[side].list.length;
  const ids = Object.keys(votesMap);
  if (ids.length < total) return null;
  const tiers = Object.values(votesMap);
  const first = tiers[0];
  if (!tiers.every((t) => t === first)) return null;
  if (first !== best && first !== worst) return null;
  return first;
}

function computeContributions(side, votesMap) {
  const dampTier = isDampenTrigger(side, votesMap);
  const result = {};
  for (const id in votesMap) {
    const tier = votesMap[id];
    const ch = DATA[side].list.find((c) => c.id === id);
    if (!ch) continue;
    if (dampTier) {
      const dampScore = tierScoreFor(side, dampTier);
      result[id] = ch.seed + (dampScore - ch.seed) / 2;
    } else {
      result[id] = tierScoreFor(side, tier);
    }
  }
  return result;
}

async function getMyVotesMap(side) {
  const raw = await sGet(`myvotes:${side}`, false);
  const map = raw ? JSON.parse(raw) : {};
  const valid = {};
  for (const id in map) {
    if (DATA[side].list.some((c) => c.id === id)) valid[id] = map[id];
  }
  return valid;
}

async function getMyPlacement(side, id) {
  const map = await getMyVotesMap(side);
  return map[id] || null;
}

async function castVote(side, ch, newTier) {
  const votesMap = await getMyVotesMap(side);
  const oldContributions = computeContributions(side, votesMap);

  const newVotesMap = { ...votesMap };
  if (newTier) newVotesMap[ch.id] = newTier;
  else delete newVotesMap[ch.id];

  const newContributions = computeContributions(side, newVotesMap);

  const affectedIds = new Set([...Object.keys(oldContributions), ...Object.keys(newContributions)]);
  for (const id of affectedIds) {
    const oldVal = oldContributions[id];
    const newVal = newContributions[id];
    if (oldVal === newVal) continue;
    const agg = await getAgg(side, id);
    if (oldVal !== undefined) {
      agg.sum -= oldVal;
      agg.count -= 1;
    }
    if (newVal !== undefined) {
      agg.sum += newVal;
      agg.count += 1;
    }
    await setAgg(side, id, agg);
  }

  await sSet(`myvotes:${side}`, JSON.stringify(newVotesMap), false);
  return newVotesMap;
}

const RESET_HOUR_UTC = 9;

function getTodayResetUTC() {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), RESET_HOUR_UTC, 0, 0, 0);
}

function getCurrentResetBoundary() {
  const now = Date.now();
  let reset = getTodayResetUTC();
  if (now < reset) reset -= CYCLE_MS;
  return reset;
}

function getNextResetBoundary() {
  return getCurrentResetBoundary() + CYCLE_MS;
}

async function freezeSide(side) {
  for (const ch of DATA[side].list) {
    const agg = await getAgg(side, ch.id);
    const avg = agg.count > 0 ? agg.sum / agg.count : ch.seed;
    const tier = tierFromAvg(side, avg);
    await sSet(`frozen:${side}:${ch.id}`, JSON.stringify({ tier, avg, count: agg.count }), true);
  }
}

async function ensureFrozenInitialized(side) {
  const first = await sGet(`frozen:${side}:${DATA[side].list[0].id}`, true);
  if (!first) await freezeSide(side);
}

async function maybeAutoFreeze(side) {
  await ensureFrozenInitialized(side);
  const boundary = getCurrentResetBoundary();
  const raw = await sGet(`reset-boundary:${side}`, true);
  const last = raw ? JSON.parse(raw) : 0;
  if (last < boundary) {
    await freezeSide(side);
    await sSet(`reset-boundary:${side}`, JSON.stringify(boundary), true);
  }
}

async function getFrozenResults(side) {
  await maybeAutoFreeze(side);
  const results = {};
  for (const ch of DATA[side].list) {
    const raw = await sGet(`frozen:${side}:${ch.id}`, true);
    results[ch.id] = raw ? JSON.parse(raw) : { tier: tierFromAvg(side, ch.seed), avg: ch.seed, count: 0 };
  }
  return results;
}

function formatCountdown(msLeft) {
  if (msLeft < 0) msLeft = 0;
  const h = Math.floor(msLeft / 3600000);
  const m = Math.floor((msLeft % 3600000) / 60000);
  const s = Math.floor((msLeft % 60000) / 1000);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
