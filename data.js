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
const CYCLE_MS = 24 * 60 * 60 * 1000;

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

const SUPABASE_URL = "https://qfevxppkurqbdtdaidtq.supabase.co";
const SUPABASE_KEY = "sb_publishable_JoQ6KZQjTioykLad8Orl1Q_WbEwLUUD";

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
      `${SUPABASE_URL}/rest/v1/site_kv?key=eq.${encodeURIComponent(key)}&select=value`,
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
    const res = await fetch(`${SUPABASE_URL}/rest/v1/site_kv`, {
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

async function getMyPlacement(side, id) {
  const raw = await sGet(`myplacement:${side}:${id}`, false);
  return raw ? JSON.parse(raw) : null;
}
async function setMyPlacement(side, id, tier) {
  await sSet(`myplacement:${side}:${id}`, JSON.stringify(tier), false);
}

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

async function freezeSide(side) {
  for (const ch of DATA[side].list) {
    const agg = await getAgg(side, ch.id);
    const avg = agg.count > 0 ? agg.sum / agg.count : ch.seed;
    const tier = tierFromAvg(avg);
    await sSet(`frozen:${side}:${ch.id}`, JSON.stringify({ tier, avg, count: agg.count }), true);
  }
  await sSet(`cycle-start:${side}`, JSON.stringify(Date.now()), true);
}

async function ensureFrozenInitialized(side) {
  const first = await sGet(`frozen:${side}:${DATA[side].list[0].id}`, true);
  if (!first) await freezeSide(side);
}

async function maybeAutoFreeze(side) {
  await ensureFrozenInitialized(side);
  const start = await getCycleStart(side);
  if (Date.now() - start >= CYCLE_MS) {
    await freezeSide(side);
  }
}

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
