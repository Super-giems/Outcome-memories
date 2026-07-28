// ============================================================
// CHARACTER DATA
// To add a real photo: set img to a path/URL, e.g. "images/shadow.jpg"
// Leave img empty ("") to use the auto-generated placeholder icon.
// seed = starting score (1-5) used only for display when a character
// has 0 votes yet in the current cycle. It is never written to storage.
// ============================================================
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
      { id: "s-silver", name: "Silver", role: "Ranged support, telekinetic slows & barriers", seed: 4, img: "" },
      { id: "s-eggman", name: "Eggman", role: "Jetpack double jump", seed: 3, img: "" },
      { id: "s-tails", name: "Tails", role: "Flight & support", seed: 2, img: "" },
      { id: "s-knuckles", name: "Knuckles", role: "Wall-breaking shortcuts", seed: 3, img: "" },
      { id: "s-blaze", name: "Blaze", role: "Hit-and-run, fire damage on stunned hits", seed: 3, img: "" },
    ],
  },
};

const TIER_SCORE = { S: 5, A: 4, B: 3, C: 2, D: 1 };
const TIER_ORDER = ["S", "A", "B", "C", "D"];
const CYCLE_MS = 24 * 60 * 60 * 1000; // 24 hours

function tierFromAvg(avg) {
  if (avg >= 4.5) return "S";
  if (avg >= 3.5) return "A";
  if (avg >= 2.5) return "B";
  if (avg >= 1.5) return "C";
  return "D";
}

function colorFor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue},55%,50%)`;
}

// Generic "no photo yet" placeholder avatar, no letters, just a silhouette.
function placeholderAvatar(str) {
  const hex = colorFor(str);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" rx="22" fill="${hex}"/>
    <circle cx="50" cy="38" r="17" fill="rgba(255,255,255,0.88)"/>
    <path d="M50 60c-19 0-31 12-31 25v7h62v-7c0-13-12-25-31-25z" fill="rgba(255,255,255,0.88)"/>
  </svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

function avatarImgHTML(ch, size) {
  const autoPath = "images/" + encodeURIComponent(ch.name) + ".png";
  const src = ch.img || autoPath;
  const placeholder = placeholderAvatar(ch.name);
  return `<img class="avatar" style="width:${size}px;height:${size}px;" src="${src}" alt="${ch.name}" onerror="this.onerror=null;this.src='${placeholder}';">`;
}

// ============================================================
// STORAGE (works inside Claude artifacts; falls back to an
// in-memory store if window.storage isn't available, e.g. when
// this file is opened directly as a plain local file — in that
// case nothing is shared or saved between visits/devices).
// ============================================================
const hasStorage = !!(window.storage && window.storage.get && window.storage.set);
const memStore = {};

async function sGet(key, shared) {
  if (!hasStorage) return memStore[key] ?? null;
  try {
    const r = await window.storage.get(key, shared);
    return r ? r.value : null;
  } catch (e) {
    return null;
  }
}
async function sSet(key, value, shared) {
  if (!hasStorage) {
    memStore[key] = value;
    return true;
  }
  try {
    await window.storage.set(key, value, shared);
    return true;
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

async function getMyPlacement(side, id) {
  const raw = await sGet(`myplacement:${side}:${id}`, false);
  return raw ? JSON.parse(raw) : null; // null = in the unplaced pool
}
async function setMyPlacement(side, id, tier) {
  await sSet(`myplacement:${side}:${id}`, JSON.stringify(tier), false);
}

// Cast (or change, or remove) your vote for one character.
// newTier is one of "S"/"A"/"B"/"C"/"D", or null to send it back to the pool.
async function castVote(side, ch, newTier) {
  const oldTier = await getMyPlacement(side, ch.id);
  const agg = await getAgg(side, ch.id);
  if (oldTier) {
    agg.sum -= TIER_SCORE[oldTier];
    agg.count -= 1;
  }
  if (newTier) {
    agg.sum += TIER_SCORE[newTier];
    agg.count += 1;
  }
  await setAgg(side, ch.id, agg);
  await setMyPlacement(side, ch.id, newTier);
  return agg;
}

async function getCycleStart(side) {
  const raw = await sGet(`cycle-start:${side}`, true);
  if (!raw) {
    const now = Date.now();
    await sSet(`cycle-start:${side}`, JSON.stringify(now), true);
    return now;
  }
  return JSON.parse(raw);
}

// The tier list shown to visitors is a FIXED snapshot, not a live number.
// Votes keep accumulating in the background (getAgg/castVote), but the
// tier a character is shown in only changes when we "freeze" a new
// snapshot — either automatically every 24h, or instantly via the debug
// button. Nothing about the raw vote totals is reset by this.
async function freezeSide(side) {
  for (const ch of DATA[side].list) {
    const agg = await getAgg(side, ch.id);
    const avg = agg.count > 0 ? agg.sum / agg.count : ch.seed;
    const tier = tierFromAvg(avg);
    await sSet(`frozen:${side}:${ch.id}`, JSON.stringify({ tier, avg, count: agg.count }), true);
  }
  await sSet(`cycle-start:${side}`, JSON.stringify(Date.now()), true);
}

// Makes sure a snapshot exists at all (first time the site is ever used).
async function ensureFrozenInitialized(side) {
  const first = await sGet(`frozen:${side}:${DATA[side].list[0].id}`, true);
  if (!first) await freezeSide(side);
}

// Checks the 24h timer and freezes a fresh snapshot if it's overdue.
async function maybeAutoFreeze(side) {
  await ensureFrozenInitialized(side);
  const start = await getCycleStart(side);
  if (Date.now() - start >= CYCLE_MS) {
    await freezeSide(side);
  }
}

// Reads the current fixed snapshot for every character on a side.
async function getFrozenResults(side) {
  await maybeAutoFreeze(side);
  const results = {};
  for (const ch of DATA[side].list) {
    const raw = await sGet(`frozen:${side}:${ch.id}`, true);
    results[ch.id] = raw ? JSON.parse(raw) : { tier: tierFromAvg(ch.seed), avg: ch.seed, count: 0 };
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
