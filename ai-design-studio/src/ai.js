// ============================================================
// AI Design Studio — Design Intelligence
//
// Two layers:
//  1. A deterministic spatial-analysis engine that inspects the
//     project model and produces explained, actionable insights.
//     Works offline for every user — no API required.
//  2. An optional AI Mentor chat. Offline it answers from the
//     analysis engine; with a user-supplied Anthropic API key
//     (stored only in localStorage) it becomes fully conversational.
// ============================================================

import { footprint, overlaps, openingSegment, roomArea, fmtLen } from './model.js';
import { catalogItem } from './catalog.js';
import { theme } from './themes.js';

const KEY_STORE = 'ads.anthropicKey';

// ---------- Spatial analysis engine ----------

// Every insight: { id, severity: 'issue'|'tip'|'good', title, detail, fix?: {label, apply(project)} }
export function analyzeProject(p) {
  const insights = [];
  const room = p.room;
  const area = roomArea(room);
  const items = room.furniture.map((f) => ({ f, fp: footprint(f), c: catalogItem(f.catalogId) }));
  const solid = items.filter((i) => !i.c?.flat); // rugs don't block anything

  // --- 1. Circulation: door swing and entry path ---
  for (const o of room.openings.filter((x) => x.type === 'door')) {
    const seg = openingSegment(room, o);
    const swing = doorSwingZone(room, o, seg);
    const blockers = solid.filter((i) => overlaps(i.fp, swing));
    for (const b of blockers) {
      insights.push({
        id: `door-${o.id}-${b.f.id}`, severity: 'issue',
        title: `${b.c.name} blocks the door swing`,
        detail: `The ${b.c.name.toLowerCase()} sits inside the ${fmtLen(o.width)} door's swing zone. You'd hit it every time the door opens. Moving it roughly ${suggestClearDistance(b.fp, swing)} clears the path.`,
        fix: {
          label: `Move ${b.c.name} clear of the door`,
          apply: (proj) => nudgeClear(proj, b.f.id, swing),
        },
      });
    }
  }

  // --- 2. Walkway clearance between large pieces ---
  const bigs = solid.filter((i) => i.fp.w * i.fp.d > 0.45e6); // > ~0.45 m² footprint
  for (let a = 0; a < bigs.length; a++) {
    for (let b = a + 1; b < bigs.length; b++) {
      const gap = gapBetween(bigs[a].fp, bigs[b].fp);
      if (gap !== null && gap > 40 && gap < 550) {
        insights.push({
          id: `gap-${bigs[a].f.id}-${bigs[b].f.id}`, severity: 'issue',
          title: `Tight squeeze between ${bigs[a].c.name.toLowerCase()} and ${bigs[b].c.name.toLowerCase()}`,
          detail: `Only ${fmtLen(gap)} between them — comfortable circulation needs at least 600 mm (750 mm on a main path). Consider widening the gap or rotating one piece.`,
        });
        break;
      }
    }
  }

  // --- 3. Scale: dominant furniture vs room ---
  const furnArea = solid.reduce((s, i) => s + (i.fp.w * i.fp.d) / 1e6, 0);
  const density = furnArea / area;
  if (density > 0.45) {
    insights.push({
      id: 'density', severity: 'issue',
      title: 'The room is over-furnished',
      detail: `Furniture covers ${(density * 100).toFixed(0)}% of the floor. Above ~45% a room starts to feel cramped and hard to move through. Removing or downsizing one large piece would restore breathing room.`,
    });
  } else if (density < 0.12 && solid.length > 0 && area > 8) {
    insights.push({
      id: 'sparse', severity: 'tip',
      title: 'There’s room to add character',
      detail: `Furniture covers only ${(density * 100).toFixed(0)}% of the floor. A rug, plant or reading corner could anchor the empty zones without crowding the space.`,
    });
  }

  const sofa = items.find((i) => i.c?.id.startsWith('sofa'));
  if (sofa && (sofa.f.w / room.w > 0.62 && sofa.f.rot % 180 === 0 || sofa.f.w / room.l > 0.62 && sofa.f.rot % 180 !== 0)) {
    insights.push({
      id: 'sofa-scale', severity: 'issue',
      title: 'This sofa is oversized for the wall it sits on',
      detail: `The sofa spans over 60% of that dimension of the room. A rule of thumb: keep the main sofa under two-thirds of its wall so the room reads balanced. A 2-seat sofa may suit this space better.`,
    });
  }

  // --- 4. Natural light: furniture blocking windows ---
  for (const o of room.openings.filter((x) => x.type === 'window')) {
    const seg = openingSegment(room, o);
    const zone = inwardZone(room, o, seg, 650);
    const tall = solid.filter((i) => i.f.h > (o.sill || 900) + 150 && overlaps(i.fp, zone));
    for (const b of tall) {
      insights.push({
        id: `win-${o.id}-${b.f.id}`, severity: 'issue',
        title: `${b.c.name} blocks natural light`,
        detail: `At ${fmtLen(b.f.h)} tall, the ${b.c.name.toLowerCase()} rises past the window sill and shades the room. Repositioning it will noticeably brighten the space and improve the view line.`,
        fix: { label: `Move ${b.c.name} away from the window`, apply: (proj) => nudgeClear(proj, b.f.id, zone) },
      });
    }
  }

  // --- 5. Lighting coverage ---
  const emitters = room.lighting.length + items.filter((i) => i.c?.emits).length;
  const needed = Math.max(1, Math.ceil(area / 9));
  if (emitters < needed) {
    insights.push({
      id: 'lighting', severity: 'tip',
      title: 'Some corners will fall dark after sunset',
      detail: `${area.toFixed(0)} m² generally needs ${needed} light sources for even coverage; the plan has ${emitters}. A floor lamp in the far corner removes the darkest zone and adds evening warmth.`,
    });
  }

  // --- 6. Colour & theme advice ---
  const th = theme(p.themeId);
  if (area < 11 && ['industrial', 'traditional'].includes(p.themeId)) {
    insights.push({
      id: 'dark-small', severity: 'tip',
      title: 'Deep tones may shrink this room visually',
      detail: `${th.name} uses darker walls and floors. In a ${area.toFixed(0)} m² room they absorb light and pull walls inward. Minimal or Scandinavian keeps the same character while feeling larger.`,
    });
  }

  // --- 7. Ergonomics: sofa ↔ coffee table, TV distance, bed clearance ---
  const coffee = items.find((i) => i.c?.id === 'coffee');
  if (sofa && coffee) {
    const gap = gapBetween(sofa.fp, coffee.fp);
    if (gap !== null && gap > 650) {
      insights.push({
        id: 'coffee-far', severity: 'tip',
        title: 'Coffee table is out of reach',
        detail: `${fmtLen(gap)} from the sofa — you'd have to stand to set a cup down. 350–450 mm is the comfortable reach zone.`,
      });
    } else if (gap !== null && gap < 250 && gap > 0) {
      insights.push({
        id: 'coffee-near', severity: 'tip',
        title: 'Coffee table crowds the sofa',
        detail: `Only ${fmtLen(gap)} of knee room. Pull it to 350–450 mm so people can sit and pass comfortably.`,
      });
    }
  }
  const tv = items.find((i) => i.c?.id === 'tvunit');
  if (sofa && tv) {
    const dist = Math.hypot(sofa.fp.cx - tv.fp.cx, sofa.fp.cy - tv.fp.cy);
    if (dist < 1800) {
      insights.push({
        id: 'tv-near', severity: 'tip',
        title: 'Seating is close to the screen',
        detail: `${fmtLen(Math.round(dist))} viewing distance suits a screen of ~40″ or less. For a 55″ TV aim for 2.1–3.2 m.`,
      });
    }
  }
  const bed = items.find((i) => i.c?.cat === 'bed');
  if (bed) {
    const side = Math.min(bed.fp.x, room.w - (bed.fp.x + bed.fp.w));
    if (side > 0 && side < 500) {
      insights.push({
        id: 'bed-side', severity: 'tip',
        title: 'Narrow side access to the bed',
        detail: `One side of the bed has just ${fmtLen(side)} — making the bed and getting in comfortably needs at least 600 mm. Centering the bed or shifting it ${fmtLen(600 - side)} helps.`,
      });
    }
  }

  // --- 8. Positive reinforcement: what's working ---
  const rug = items.find((i) => i.c?.icon === 'rug');
  if (rug && sofa && overlaps(rug.fp, sofa.fp, 100)) {
    insights.push({
      id: 'rug-anchor', severity: 'good',
      title: 'The rug anchors the seating zone nicely',
      detail: 'Front legs of the seating landing on the rug ties the conversation area together — exactly what designers aim for.',
    });
  }
  if (!insights.some((i) => i.severity === 'issue')) {
    insights.unshift({
      id: 'all-clear', severity: 'good',
      title: 'Circulation and scale look healthy',
      detail: 'Walkways are clear, door swings are unobstructed and nothing is oversized. This layout would pass a designer’s first review.',
    });
  }

  const order = { issue: 0, tip: 1, good: 2 };
  return insights.sort((a, b) => order[a.severity] - order[b.severity]);
}

// -- geometry utilities local to analysis --

function doorSwingZone(room, o, seg) {
  const r = o.width; // swing radius = leaf width
  if (o.wall === 0) return { x: seg.x1, y: 0, w: o.width, d: r };
  if (o.wall === 2) return { x: seg.x1, y: room.l - r, w: o.width, d: r };
  if (o.wall === 3) return { x: 0, y: seg.y1, w: r, d: o.width };
  return { x: room.w - r, y: seg.y1, w: r, d: o.width };
}

function inwardZone(room, o, seg, depth) {
  if (o.wall === 0) return { x: seg.x1, y: 0, w: o.width, d: depth };
  if (o.wall === 2) return { x: seg.x1, y: room.l - depth, w: o.width, d: depth };
  if (o.wall === 3) return { x: 0, y: seg.y1, w: depth, d: o.width };
  return { x: room.w - depth, y: seg.y1, w: depth, d: o.width };
}

function gapBetween(a, b) {
  const dx = Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w));
  const dy = Math.max(b.y - (a.y + a.d), a.y - (b.y + b.d));
  if (dx > 0 && dy > 0) return null; // diagonal — no shared walkway
  return Math.max(dx, dy);
}

function suggestClearDistance(fp, zone) {
  const dx = Math.min(Math.abs(zone.x + zone.w - fp.x), Math.abs(fp.x + fp.w - zone.x));
  const dy = Math.min(Math.abs(zone.y + zone.d - fp.y), Math.abs(fp.y + fp.d - zone.y));
  return fmtLen(Math.round(Math.min(dx, dy) + 60));
}

// Move a piece the shortest distance that exits the zone (with 60 mm margin).
function nudgeClear(p, fid, zone) {
  const f = p.room.furniture.find((x) => x.id === fid);
  if (!f) return;
  const fp = footprint(f);
  const moves = [
    { axis: 'x', delta: zone.x - (fp.x + fp.w) - 60 },          // left of zone
    { axis: 'x', delta: zone.x + zone.w - fp.x + 60 },          // right of zone
    { axis: 'y', delta: zone.y - (fp.y + fp.d) - 60 },          // above zone
    { axis: 'y', delta: zone.y + zone.d - fp.y + 60 },          // below zone
  ].map((m) => ({ ...m, cost: Math.abs(m.delta), ok: fits(p.room, fp, m) }))
   .filter((m) => m.ok)
   .sort((a, b) => a.cost - b.cost);
  if (moves.length) {
    f[moves[0].axis] += moves[0].delta;
  }
}

function fits(room, fp, m) {
  const x = fp.x + (m.axis === 'x' ? m.delta : 0);
  const y = fp.y + (m.axis === 'y' ? m.delta : 0);
  return x >= 0 && y >= 0 && x + fp.w <= room.w && y + fp.d <= room.l;
}

// ---------- AI Mentor chat ----------

export function getApiKey() { return localStorage.getItem(KEY_STORE) || ''; }
export function setApiKey(k) {
  if (k) localStorage.setItem(KEY_STORE, k.trim());
  else localStorage.removeItem(KEY_STORE);
}

// Offline mentor: composes an answer from the live analysis + project facts.
export function mentorReplyOffline(question, p) {
  const q = question.toLowerCase();
  const insights = analyzeProject(p);
  const issues = insights.filter((i) => i.severity === 'issue');
  const area = roomArea(p.room);
  const th = theme(p.themeId);

  if (/(light|bright|dark|window|sun)/.test(q)) {
    const li = insights.find((i) => /light/i.test(i.title));
    return li ? `${li.detail} Beyond that, keeping tall furniture off the window wall and using the ${th.name} palette's lighter wall tone will bounce daylight deeper into the room.`
      : `Natural light looks unobstructed right now. To brighten further: keep tall pieces off the window wall, add a mirror opposite the window, and layer a floor lamp for evenings. Your ${th.name} palette already reflects light well.`;
  }
  if (/(small|bigger|larger|space|cramped|size)/.test(q)) {
    return `The room is ${(p.room.w / 1000).toFixed(1)} × ${(p.room.l / 1000).toFixed(1)} m (${area.toFixed(1)} m²). To make it feel larger: keep sightlines from the door clear, choose lower-profile furniture, use a large rug (small rugs fragment the floor), and stay with lighter wall tones. ${issues.length ? 'Also worth fixing: ' + issues[0].title.toLowerCase() + '.' : ''}`;
  }
  if (/(colou?r|paint|wall)/.test(q)) {
    return `For ${th.name}, I'd paint the main walls ${th.wall} and reserve the deeper ${th.accentWall} for the accent wall — the wall you face when entering carries an accent best. Light ceilings always; and match the trim (${th.trim}) to keep edges quiet. In a ${area.toFixed(0)} m² room, contrast on one wall adds depth without shrinking the space.`;
  }
  if (/(cost|budget|price|cheap|expensive)/.test(q)) {
    return `Open the Budget tab for the live estimate — it prices every item at your chosen tier plus painting, flooring and labour. The fastest savings usually come from keeping the current flooring (refinish instead of replace) and choosing standard-tier furniture for anything not touched daily. Splurge where you touch: sofa, bed, work chair.`;
  }
  if (/(theme|style|look)/.test(q)) {
    return `You're currently in ${th.name} — ${th.tagline.toLowerCase()} Given this room's size and light, ${area < 12 ? 'Minimal or Scandinavian would maximise the sense of space' : 'Japandi or Contemporary would layer in warmth without clutter'}. Try one from the Themes tab and hold "Compare" to see before/after instantly.`;
  }
  if (issues.length) {
    return `The most useful thing I can tell you right now: ${issues[0].title.toLowerCase()}. ${issues[0].detail} ${issues.length > 1 ? `There ${issues.length - 1 === 1 ? 'is one more issue' : 'are ' + (issues.length - 1) + ' more issues'} in the Assistant tab.` : ''}`;
  }
  return `This layout is in good shape — circulation is clear and nothing is out of scale. Questions I can help with: making the room feel bigger, wall colours for ${th.name}, lighting placement, budget trade-offs, or what to buy first. You can also connect an Anthropic API key in Settings for a fully conversational mentor.`;
}

// Online mentor: direct browser call with the user's own key.
export async function mentorReplyClaude(question, p, historyMsgs) {
  const key = getApiKey();
  const facts = projectFacts(p);
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 700,
      system: `You are the AI Mentor inside AI Design Studio — a warm, expert interior designer, architect and DIY coach. Be concise (under 150 words), specific and practical. Always explain WHY behind recommendations. Use metric measurements. Current project state:\n${facts}`,
      messages: [...historyMsgs.slice(-8), { role: 'user', content: question }],
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${t.slice(0, 140)}`);
  }
  const data = await res.json();
  return data.content?.map((b) => b.text || '').join('') || '(no reply)';
}

export function projectFacts(p) {
  const insights = analyzeProject(p).map((i) => `- [${i.severity}] ${i.title}: ${i.detail}`).join('\n');
  const furn = p.room.furniture.map((f) => {
    const c = catalogItem(f.catalogId);
    return `- ${c?.name} at (${(f.x / 1000).toFixed(1)}, ${(f.y / 1000).toFixed(1)}) m, ${f.rot}°`;
  }).join('\n');
  return `Room: ${p.name}, ${(p.room.w / 1000).toFixed(1)} × ${(p.room.l / 1000).toFixed(1)} × ${(p.room.h / 1000).toFixed(1)} m. Theme: ${theme(p.themeId).name}.\nFurniture:\n${furn}\nEngine analysis:\n${insights}`;
}
