/* ─────────────────────────────────────────────────────────────────────────────
   GRIHA — Household Financial Operating System for the Indian Home
   Vanilla ES2022 · No build step · Mobile-first 375–430 px
   ───────────────────────────────────────────────────────────────────────────── */

// ═══════════════════════════════════════════════════════════════
// 1. DATA
// ═══════════════════════════════════════════════════════════════

const CITIES = {
  Chennai: {
    state: 'Tamil Nadu', discom: 'TANGEDCO',
    primary: '#E8622A', accent: '#FF9557',
    greeting: 'வணக்கம்',
    landmark: 'Besant Nagar sea breeze meets smarter cooling discipline.',
    tagline: 'Beat the heat without letting slabs beat your budget.',
    insight: 'Chennai 3 BHK flats spend 48% of their bill on cooling — your home may be running above that.',
    stats: [{ label: 'Avg summer high', value: '34°C' }, { label: 'Avg 3 BHK bill', value: '₹3,850' }, { label: 'Top slab rate', value: '₹8.15/unit' }],
    tariffs: [
      { range: '0–100 units', rate: '₹0', note: 'Subsidised (residential)' },
      { range: '101–400 units', rate: '₹4.70', note: '← You are here' },
      { range: '401–500 units', rate: '₹6.30', note: '⚠ Next threshold' },
      { range: '501+ units', rate: '₹8.15', note: 'Peak marginal rate' }
    ],
    warningThreshold: 420, billingCycle: 'bi-monthly'
  },
  Mumbai: {
    state: 'Maharashtra', discom: 'Adani Electricity / Tata Power',
    primary: '#1B5FBF', accent: '#5B9FFF',
    greeting: 'नमस्कार',
    landmark: 'From Bandra apartments to Powai towers, every rupee gets a role.',
    tagline: 'Control monsoon humidity costs and subscription sprawl.',
    insight: 'Mumbai homes see bills spike 28% in June–August from dehumidifier and AC overlap.',
    stats: [{ label: 'Humid peak', value: '31°C' }, { label: 'Avg 3 BHK bill', value: '₹4,120' }, { label: 'Top slab rate', value: '₹10.00/unit' }],
    tariffs: [
      { range: '0–100 units', rate: '₹2.60', note: '' },
      { range: '101–300 units', rate: '₹3.72', note: '← You are here' },
      { range: '301–500 units', rate: '₹5.80', note: '⚠ Next threshold' },
      { range: '501+ units', rate: '₹10.00', note: 'Peak marginal rate' }
    ],
    warningThreshold: 280, billingCycle: 'monthly'
  },
  Bengaluru: {
    state: 'Karnataka', discom: 'BESCOM',
    primary: '#1A7A3C', accent: '#4DCA78',
    greeting: 'ನಮಸ್ಕಾರ',
    landmark: 'A Cubbon-Park calm interface for a high-velocity home budget.',
    tagline: 'Optimise hybrid-work homes and rising appliance loads.',
    insight: "Bengaluru's mild climate means cooling costs only 31% of bills — appliance mix matters more here.",
    stats: [{ label: 'Pleasant high', value: '29°C' }, { label: 'Avg 3 BHK bill', value: '₹3,240' }, { label: 'Top slab rate', value: '₹7.15/unit' }],
    tariffs: [
      { range: '0–30 units', rate: '₹0', note: 'Subsidised' },
      { range: '31–100 units', rate: '₹3.15', note: '← You are here' },
      { range: '101–200 units', rate: '₹5.85', note: '⚠ Next threshold' },
      { range: '201+ units', rate: '₹7.15', note: 'Peak marginal rate' }
    ],
    warningThreshold: 180, billingCycle: 'monthly'
  },
  Delhi: {
    state: 'NCT Delhi', discom: 'BSES / TPDDL',
    primary: '#B52020', accent: '#FF5555',
    greeting: 'नमस्ते',
    landmark: 'Built for Lajpat summers, Dwarka heaters, and subsidy-aware bills.',
    tagline: 'Stay ahead of seasonal spikes before they become bills.',
    insight: 'Delhi 3 BHK homes see 41% year-on-year bill variance between January and July.',
    stats: [{ label: 'Summer high', value: '41°C' }, { label: 'Avg 3 BHK bill', value: '₹4,450' }, { label: 'Top slab rate', value: '₹8.00/unit' }],
    tariffs: [
      { range: '0–200 units', rate: '₹3.00', note: '← You are here' },
      { range: '201–400 units', rate: '₹4.50', note: '⚠ Next threshold' },
      { range: '401–800 units', rate: '₹6.50', note: '' },
      { range: '801+ units', rate: '₹8.00', note: 'Peak marginal rate' }
    ],
    warningThreshold: 380, billingCycle: 'monthly'
  },
  Hyderabad: {
    state: 'Telangana', discom: 'TGSPDCL',
    primary: '#6B3EC0', accent: '#A87FFF',
    greeting: 'నమస్కారం',
    landmark: 'Charminar warmth with HITEC City-grade operating intelligence.',
    tagline: 'Forecast cooling, water heating, and EV charging economics.',
    insight: "Hyderabad's dry heat drives longer AC runtimes — 62% of bills go to cooling in peak months.",
    stats: [{ label: 'Dry heat', value: '36°C' }, { label: 'Avg 3 BHK bill', value: '₹3,670' }, { label: 'Top slab rate', value: '₹9.50/unit' }],
    tariffs: [
      { range: '0–50 units', rate: '₹1.45', note: '' },
      { range: '51–100 units', rate: '₹2.60', note: '← You are here' },
      { range: '101–200 units', rate: '₹3.70', note: '⚠ Next threshold' },
      { range: '201–300 units', rate: '₹5.75', note: '' },
      { range: '301+ units', rate: '₹9.50', note: 'Peak marginal rate' }
    ],
    warningThreshold: 180, billingCycle: 'monthly'
  }
};

const LANGUAGES = [
  ['English','English'],['Hindi','हिन्दी'],['Tamil','தமிழ்'],
  ['Telugu','తెలుగు'],['Kannada','ಕನ್ನಡ'],['Malayalam','മലയാളം'],
  ['Marathi','मराठी'],['Bengali','বাংলা'],['Gujarati','ગુજરાતી'],
  ['Punjabi','ਪੰਜਾਬੀ'],['Odia','ଓଡ଼ିਆ']
];

const MODULES = [
  { name: 'Electricity', icon: '⚡', active: true },
  { name: 'Water', icon: '💧', active: false },
  { name: 'Gas', icon: '🔥', active: false },
  { name: 'Internet & Broadband', icon: '📡', active: false },
  { name: 'EV Charging', icon: '🔋', active: false },
  { name: 'OTT Subscriptions', icon: '▶', active: false },
  { name: 'Appliance Maintenance', icon: '🔧', active: false },
  { name: 'Solar & Battery', icon: '☀', active: false }
];

const BILLS = [
  { month: 'May', year: 2026, units: 418, amount: 4680, status: 'Due' },
  { month: 'Apr', year: 2026, units: 351, amount: 3920, status: 'Paid' },
  { month: 'Mar', year: 2026, units: 302, amount: 3340, status: 'Paid' },
  { month: 'Feb', year: 2026, units: 261, amount: 2860, status: 'Paid' },
  { month: 'Jan', year: 2026, units: 244, amount: 2650, status: 'Paid' },
  { month: 'Dec', year: 2025, units: 279, amount: 3040, status: 'Paid' },
  { month: 'Nov', year: 2025, units: 291, amount: 3180, status: 'Paid' },
  { month: 'Oct', year: 2025, units: 329, amount: 3550, status: 'Paid' },
  { month: 'Sep', year: 2025, units: 384, amount: 4210, status: 'Paid' },
  { month: 'Aug', year: 2025, units: 436, amount: 4890, status: 'Paid' },
  { month: 'Jul', year: 2025, units: 451, amount: 5120, status: 'Paid' },
  { month: 'Jun', year: 2025, units: 429, amount: 4760, status: 'Paid' }
];

const BILLS_PREV = [
  { month: 'May', units: 452, amount: 5140 },
  { month: 'Apr', units: 388, amount: 4320 },
  { month: 'Mar', units: 328, amount: 3680 }
];

const SCORE_DIMS = [
  { name: 'Cooling Efficiency', score: 61, label: 'Good', icon: '❄', action: 'Raise bedroom AC from 22°C to 24°C after midnight.' },
  { name: 'Appliance Efficiency', score: 72, label: 'Strong', icon: '⚡', action: 'No AC replacement surfaced — your main unit is already inverter-grade.' },
  { name: 'Lighting Efficiency', score: 88, label: 'Excellent', icon: '💡', action: 'Replace the last 6 tube lights with LEDs when they fail.' },
  { name: 'Standby Waste', score: 54, label: 'Watch', icon: '🔌', action: 'Switch off set-top box and microwave at the plug overnight.' },
  { name: 'Energy Transition', score: 67, label: 'Good', icon: '🌀', action: 'BLDC fans give the fastest renter-friendly payback at 23 months.' },
  { name: 'Bill Management', score: 79, label: 'Strong', icon: '📋', action: 'Pay before 18/05/2026 to maintain your on-time streak.' }
];

const ROADMAP = [
  { title: 'Raise AC thermostat to 24°C', saving: '₹4,560/yr', cost: '₹0', breakeven: 'Instant', diff: 'Free',
    rationale: 'Based on two 3-star ACs running 7.5 hours/night in Velachery. Each degree above 22°C reduces runtime ~6%. Specific to your Velachery household heat-load profile.' },
  { title: 'Replace 4 regular fans with BLDC', saving: '₹5,900/yr', cost: '₹11,200', breakeven: '23 months', diff: 'Easy',
    rationale: 'Your fan inventory lists 4 regular (60W) fans with no BLDC units. Replacing all four with 5-star BLDC (28W each) saves ~53% fan power running at 10 hrs/day in Chennai.' },
  { title: 'Check refrigerator door gasket', saving: '₹1,850/yr', cost: '₹1,200', breakeven: '8 months', diff: 'Easy',
    rationale: 'Your frost-free 260–350L fridge shows harder cycling in Chennai summers — a classic gasket-wear signal. Minimal replacement cost; compressor gains account for the saving.' },
  { title: 'RWA common-area solar discussion', saving: 'Maintenance saving', cost: 'Society-led', breakeven: 'Later', diff: 'Moderate',
    rationale: 'Individual rooftop solar is suppressed for flats. Many societies in Chennai are adopting common-area solar for shared lighting, which reduces maintenance levy costs.' }
];

const PROPERTY_TYPES = [
  { id: 'flat', label: 'Flat / Apartment', icon: '🏢', desc: 'In a building or society' },
  { id: 'house', label: 'Independent House', icon: '🏡', desc: 'Standalone with own compound' },
  { id: 'rowhouse', label: 'Row House', icon: '🏘', desc: 'Shared-wall, own entrance' }
];

const BHK_OPTIONS = [
  { id: 'studio', label: 'Studio', sqft: '250–400 sq ft' },
  { id: '1bhk', label: '1 BHK', sqft: '450–700 sq ft' },
  { id: '2bhk', label: '2 BHK', sqft: '750–1100 sq ft' },
  { id: '3bhk', label: '3 BHK', sqft: '1100–1600 sq ft' },
  { id: '4bhk', label: '4 BHK', sqft: '1600–2200 sq ft' },
  { id: '5bhk', label: '5 BHK+', sqft: '2200+ sq ft' }
];

const USAGE_Q = [
  { id: 'ac', q: 'When do you run air conditioners?',
    opts: ['Nights only (8pm–8am)', 'Afternoons and nights', 'All day when hot', 'Rarely'] },
  { id: 'occ', q: 'Is someone home during working hours?',
    opts: ['Yes — home most weekdays', 'Partly — some WFH', 'Rarely — out 9–6', 'Varies'] },
  { id: 'care', q: 'Specific thermal comfort needs?',
    opts: ['Young children (under 5)', 'Elderly family members', 'Both present', 'Neither'] },
  { id: 'cook', q: 'Primary cooking fuel?',
    opts: ['LPG / Piped gas', 'Induction only', 'Both LPG and induction', 'Other'] }
];

const LOCALITIES = {
  Chennai: ['Velachery', 'Adyar', 'Anna Nagar', 'T. Nagar', 'Porur', 'Chromepet'],
  Mumbai: ['Andheri', 'Bandra', 'Powai', 'Thane', 'Kurla', 'Borivali'],
  Bengaluru: ['Indiranagar', 'Koramangala', 'Whitefield', 'HSR Layout', 'Jayanagar', 'Marathahalli'],
  Delhi: ['Lajpat Nagar', 'Dwarka', 'Rohini', 'Saket', 'Noida Sector 18', 'Gurugram'],
  Hyderabad: ['Hitech City', 'Banjara Hills', 'Kukatpally', 'Madhapur', 'Secunderabad', 'Gachibowli']
};

// ═══════════════════════════════════════════════════════════════
// 2. STATE
// ═══════════════════════════════════════════════════════════════

const S = {
  screen: 'auth',
  step: 0,
  tab: 'Home',
  historyView: 'Analytics',
  sheet: null,

  // Auth
  authInput: '',
  otpSent: false,
  otpDigits: ['','','','','',''],
  otpTimer: 30,
  otpDone: false,
  name: '',

  // Onboarding
  language: 'English',
  city: null,
  locality: '',
  propType: null,
  bhk: '3bhk',
  tenure: 'owner',
  hasRooftop: null,
  billingCycle: 'bi-monthly',
  method: null,
  cycleStart: 1,
  appliances: {
    fans: { qty: 4, type: 'Regular (75–80W)' },
    ac: { qty: 2, stars: 3, type: 'Inverter' },
    fridge: { present: true, stars: 3, type: 'Frost-Free' },
    washer: { present: true, type: 'Front-Load', freq: 'Daily' },
    geyser: { present: true, type: 'Storage (25L)' },
    other: ['Electric Oven / Microwave', 'Home Office Setup']
  },
  openAppliance: null,
  usage: { ac: 'Nights only (8pm–8am)', occ: 'Partly — some WFH', care: 'Neither', cook: 'LPG / Piped gas' },

  // App (demo profile)
  profileCity: 'Chennai',
  profileName: 'Ananya',
  billToDate: 3780,
  daysLeft: 11,
  units: 418,
  projected: 592,
  alertActive: true,
  roadmapOpen: null,
  payMethod: 'UPI'
};

let _otpTimer = null;

function set(patch) {
  Object.assign(S, patch);
  render();
}

// ═══════════════════════════════════════════════════════════════
// 3. UTILS
// ═══════════════════════════════════════════════════════════════

const root = document.getElementById('root');

function inr(v) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
}

function arc(val, sz = 154, sw = 11, color = 'var(--accent)') {
  const r = (sz - sw) / 2, c = 2 * Math.PI * r;
  const dash = c * 0.74, off = dash - (dash * val) / 100;
  return `<svg class="arc-svg" width="${sz}" height="${sz}" viewBox="0 0 ${sz} ${sz}">
    <circle cx="${sz/2}" cy="${sz/2}" r="${r}" stroke="rgba(255,255,255,.08)" stroke-width="${sw}" fill="none"
      stroke-dasharray="${dash} ${c}" stroke-linecap="round" transform="rotate(137 ${sz/2} ${sz/2})"/>
    <circle class="arc-active" cx="${sz/2}" cy="${sz/2}" r="${r}" stroke="${color}"
      stroke-width="${sw}" fill="none" stroke-dasharray="${dash} ${c}"
      stroke-dashoffset="${off}" stroke-linecap="round" transform="rotate(137 ${sz/2} ${sz/2})"/>
  </svg>`;
}

function scoreColor(s) {
  return s >= 80 ? '#4DCA78' : s >= 65 ? '#a8e060' : s >= 50 ? '#FFB84D' : '#FF5555';
}

function appCity() { return CITIES[S.profileCity] || CITIES.Chennai; }

// ═══════════════════════════════════════════════════════════════
// 4. RENDER ENTRY
// ═══════════════════════════════════════════════════════════════

function render() {
  const c = (S.city ? CITIES[S.city] : null) || CITIES[S.profileCity] || CITIES.Chennai;
  let content = '';
  if (S.screen === 'auth') content = screenAuth();
  else if (S.screen === 'language') content = screenLanguage();
  else if (S.screen === 'onboarding') content = screenOnboarding();
  else content = screenApp();

  root.innerHTML = `<div class="app" style="--primary:${c.primary};--accent:${c.accent}"><div class="grain"></div>${content}</div>`;
  bind();
  root.querySelectorAll('.stagger-list > *').forEach((el, i) => {
    el.style.animationDelay = `${40 + i * 65}ms`;
  });
}

// ═══════════════════════════════════════════════════════════════
// 5. AUTH SCREEN
// ═══════════════════════════════════════════════════════════════

function screenAuth() {
  return `
  <div class="auth-wrap">
    <div class="auth-glow"></div>
    <div class="auth-brand slide-up">
      <div class="logo-mark">गृ</div>
      <div class="logo-text">
        <span class="logo-name">Griha</span>
        <span class="logo-sub">Financial OS for the Indian Home</span>
      </div>
    </div>
    <div class="auth-card glass slide-up" style="animation-delay:.08s">
      ${!S.otpDone ? (!S.otpSent ? `
        <h2>Sign in or create account</h2>
        <p class="auth-desc">Mobile number or email. No password needed.</p>
        <div class="field-wrap">
          <input id="authInput" type="text" class="field-input" placeholder="Mobile number or email"
            value="${S.authInput}" autocomplete="off" autocapitalize="off" inputmode="tel"/>
        </div>
        <button class="btn-primary btn-full" id="sendOtp" ${S.authInput.length < 5 ? 'disabled' : ''}>
          Get OTP →
        </button>
        <p class="consent">By continuing you agree to our <a href="#">Terms &amp; Privacy Policy</a>, compliant with the DPDP Act 2023.</p>
      ` : `
        <h2>Enter OTP</h2>
        <p class="auth-desc">Sent to <strong>${S.authInput}</strong></p>
        <div class="otp-row">
          ${[0,1,2,3,4,5].map(i => `
            <input type="tel" maxlength="1" inputmode="numeric"
              class="otp-box${S.otpDigits[i] ? ' filled' : ''}" data-oi="${i}" value="${S.otpDigits[i]}"/>
          `).join('')}
        </div>
        <div class="otp-actions">
          <span id="otpTimerEl">${S.otpTimer > 0 ? `Resend in 00:${String(S.otpTimer).padStart(2,'0')}` : ''}</span>
          ${S.otpTimer <= 0 ? `<button class="link-btn" id="resendOtp">Resend OTP</button>` : ''}
          <button class="link-btn" id="changeNum">Change</button>
        </div>
        <button class="btn-primary btn-full" id="verifyOtp" ${S.otpDigits.join('').length < 6 ? 'disabled' : ''}>
          Verify →
        </button>
      `) : `
        <h2>What should we call you?</h2>
        <p class="auth-desc">First name only.</p>
        <div class="field-wrap">
          <input id="nameInput" type="text" class="field-input" placeholder="Your first name"
            value="${S.name}" autocapitalize="words"/>
        </div>
        <button class="btn-primary btn-full" id="submitName" ${S.name.length < 2 ? 'disabled' : ''}>
          Continue →
        </button>
      `}
    </div>
    <p class="auth-footer slide-up" style="animation-delay:.16s">Trusted by homes across Chennai, Mumbai, Bengaluru, Delhi &amp; Hyderabad</p>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════
// 6. LANGUAGE SCREEN
// ═══════════════════════════════════════════════════════════════

function screenLanguage() {
  return `
  <div class="onb-wrap">
    <div class="onb-top">
      <div class="onb-brand">गृ Griha</div>
      <div class="progress-rail"><div class="progress-fill" style="width:4%"></div></div>
    </div>
    <div class="onb-body">
      <h2 class="slide-up">Hi ${S.name || 'there'}, choose your language.</h2>
      <p class="slide-up" style="animation-delay:.05s">All coach messages, alerts, and insights will be in this language.</p>
      <div class="lang-grid stagger-list">
        ${LANGUAGES.map(([en, native]) => `
          <button class="lang-tile${S.language === en ? ' active' : ''}" data-lang="${en}">
            <span class="lang-native">${native}</span>
            <span class="lang-en">${en}</span>
          </button>
        `).join('')}
      </div>
      <p class="hint slide-up">You can change this anytime in Settings.</p>
      <button class="btn-primary btn-full slide-up" id="langContinue">Continue →</button>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════
// 7. ONBOARDING
// ═══════════════════════════════════════════════════════════════

function screenOnboarding() {
  const steps = [stepCity, stepCityWelcome, stepPhilosophy, stepLocation,
    stepProperty, stepBilling, stepConnection, stepAppliances, stepUsage, stepComplete];
  const pct = Math.round(((S.step + 1) / steps.length) * 100);
  const c = S.city ? CITIES[S.city] : null;
  const styleStr = c ? `style="--primary:${c.primary};--accent:${c.accent}"` : '';
  return `
  <div class="onb-wrap" ${styleStr}>
    <div class="onb-top">
      ${S.step > 0 ? `<button class="back-btn" id="onbBack">‹</button>` : '<div></div>'}
      <div class="onb-brand">गृ Griha</div>
      <div class="progress-rail" style="flex:1;max-width:130px">
        <div class="progress-fill" style="width:${pct}%"></div>
      </div>
    </div>
    <div class="onb-body">${steps[S.step]()}</div>
  </div>`;
}

function stepCity() {
  return `
  <h2 class="slide-up">Where is your home?</h2>
  <p class="slide-up" style="animation-delay:.04s">Used for tariff intelligence and peer benchmarking.</p>
  <div class="city-grid stagger-list">
    ${Object.entries(CITIES).map(([name, cd]) => `
      <button class="city-tile${S.city === name ? ' active' : ''}" data-city="${name}"
        ${S.city === name ? `style="background:${cd.primary}28;border-color:${cd.accent}"` : ''}>
        <b>${name}</b><span>${cd.state}</span><em>${cd.discom}</em>
      </button>
    `).join('')}
    <button class="city-tile coming" disabled><b>More cities</b><span>Coming soon</span></button>
  </div>
  ${S.city ? `<button class="btn-primary btn-full slide-up" id="onbNext">Continue with ${S.city} →</button>` : ''}`;
}

function stepCityWelcome() {
  const cd = CITIES[S.city];
  return `
  <div class="city-welcome-wrap" style="--primary:${cd.primary};--accent:${cd.accent}">
    <div class="cwelcome-top glass">
      <span class="city-greeting slide-up">${cd.greeting}, ${S.city}</span>
      <h2 class="slide-up" style="animation-delay:.06s">${cd.landmark}</h2>
      <p class="slide-up" style="animation-delay:.1s">${cd.tagline}</p>
    </div>
    <div class="city-stats stagger-list">
      ${cd.stats.map(s => `
        <div class="stat-pill glass"><b>${s.value}</b><span>${s.label}</span></div>
      `).join('')}
    </div>
    <div class="insight-card glass slide-up" style="animation-delay:.18s">
      <span class="eyebrow">📍 City insight</span>
      <p>${cd.insight}</p>
    </div>
    <div class="slide-up" style="animation-delay:.24s">
      <button class="btn-primary btn-full" id="onbNext">Connect my ${cd.discom} account →</button>
      <p class="security-note">🔐 Secure · Read-only · DPDP Act 2023 compliant</p>
    </div>
  </div>`;
}

function stepPhilosophy() {
  const items = [
    ['🚫', 'We never recommend a product you did not ask to see.'],
    ['⏰', 'We tell you before your bill jumps, not after.'],
    ['📊', 'Our forecasts show their assumptions. We acknowledge when they are wrong.'],
    ['☀', 'Solar suggestions only reach you if your home can actually have them.']
  ];
  return `
  <h2 class="slide-up">What Griha is built on.</h2>
  <p class="slide-up" style="animation-delay:.04s">Four commitments. Non-negotiable.</p>
  <div class="commit-list stagger-list">
    ${items.map(([icon, text]) => `
      <div class="commit-card glass"><span class="commit-icon">${icon}</span><p>${text}</p></div>
    `).join('')}
  </div>
  <button class="btn-primary btn-full slide-up" id="onbNext">I understand →</button>`;
}

function stepLocation() {
  const locs = LOCALITIES[S.city] || [];
  return `
  <h2 class="slide-up">Which part of ${S.city}?</h2>
  <p class="slide-up" style="animation-delay:.04s">Optional — compares you with neighbours, not just your city.</p>
  <div class="field-wrap slide-up" style="animation-delay:.08s">
    <input id="locInput" type="text" class="field-input"
      placeholder="E.g. Velachery, Koramangala…" value="${S.locality}"/>
  </div>
  <div class="chip-row stagger-list">
    ${locs.map(l => `
      <button class="chip${S.locality === l ? ' active' : ''}" data-loc="${l}">${l}</button>
    `).join('')}
  </div>
  <div class="btn-pair slide-up" style="animation-delay:.18s">
    <button class="btn-ghost" id="onbNext">Skip</button>
    <button class="btn-primary" id="onbNext">${S.locality ? `Use ${S.locality} →` : 'Skip →'}</button>
  </div>`;
}

function stepProperty() {
  return `
  <h2 class="slide-up">Tell us about your home.</h2>
  <div class="section-label slide-up" style="animation-delay:.04s">Type of home</div>
  <div class="prop-grid stagger-list">
    ${PROPERTY_TYPES.map(pt => `
      <button class="prop-tile${S.propType === pt.id ? ' active' : ''}" data-prop="${pt.id}">
        <span class="prop-icon">${pt.icon}</span>
        <b>${pt.label}</b><span>${pt.desc}</span>
      </button>
    `).join('')}
  </div>
  <div class="section-label slide-up">Rooms</div>
  <div class="bhk-grid slide-up" style="animation-delay:.06s">
    ${BHK_OPTIONS.map(b => `
      <button class="bhk-tile${S.bhk === b.id ? ' active' : ''}" data-bhk="${b.id}">
        <b>${b.label}</b><span>${b.sqft}</span>
      </button>
    `).join('')}
  </div>
  <div class="section-label slide-up">Ownership</div>
  <div class="tenure-row slide-up" style="animation-delay:.08s">
    <button class="tenure-btn${S.tenure === 'owner' ? ' active' : ''}" data-tenure="owner">🏠 I own this home</button>
    <button class="tenure-btn${S.tenure === 'renter' ? ' active' : ''}" data-tenure="renter">🔑 I rent this home</button>
  </div>
  ${S.propType === 'rowhouse' ? `
    <div class="question-card glass slide-up">
      <p>Exclusive rooftop access?</p>
      <div class="bool-row">
        <button class="bool-btn${S.hasRooftop === true ? ' active' : ''}" data-rooftop="yes">Yes, exclusively mine</button>
        <button class="bool-btn${S.hasRooftop === false ? ' active' : ''}" data-rooftop="no">No / Shared</button>
      </div>
    </div>
  ` : ''}
  <button class="btn-primary btn-full slide-up" id="onbNext" ${!S.propType ? 'disabled' : ''}>Continue →</button>`;
}

function stepBilling() {
  const cd = S.city ? CITIES[S.city] : null;
  return `
  <h2 class="slide-up">Billing cycle.</h2>
  <p class="slide-up" style="animation-delay:.04s">${cd?.discom || 'Your DISCOM'} typically bills ${cd?.billingCycle || 'monthly'}. Pre-filled — override if needed.</p>
  <div class="cycle-grid stagger-list">
    ${['monthly','bi-monthly','quarterly'].map(cy => `
      <button class="cycle-btn${S.billingCycle === cy ? ' active' : ''}" data-cycle="${cy}">
        <b>${cy.charAt(0).toUpperCase() + cy.slice(1)}</b>
        <span>${cy === 'monthly' ? 'Every 30 days' : cy === 'bi-monthly' ? 'Every 60 days' : 'Every 90 days'}</span>
      </button>
    `).join('')}
  </div>
  <div class="section-label slide-up">Current cycle starts around the</div>
  <div class="chip-row slide-up" style="animation-delay:.12s">
    ${[1,5,10,15,20,25].map(d => `
      <button class="chip${S.cycleStart === d ? ' active' : ''}" data-cstart="${d}">
        ${d}${d===1?'st':d===2?'nd':d===3?'rd':'th'}
      </button>
    `).join('')}
  </div>
  <button class="btn-primary btn-full slide-up" id="onbNext">Confirm →</button>`;
}

function stepConnection() {
  const cd = S.city ? CITIES[S.city] : null;
  const methods = [
    { id: 'consumerid', badge: 'Primary', icon: '🔗', title: 'Consumer ID Connection',
      desc: `Read-only fetch of 12 months from ${cd?.discom || 'your DISCOM'}. Most accurate.` },
    { id: 'ocr', badge: 'Secondary', icon: '📷', title: 'Upload Bill Photos',
      desc: 'AI OCR extraction. You verify every field before we store anything.' },
    { id: 'manual', badge: 'Manual', icon: '✏', title: 'Enter Bills Manually',
      desc: 'Up to 12 months of bill amounts and unit counts.' }
  ];
  return `
  <h2 class="slide-up">Connect your electricity account.</h2>
  <div class="method-list stagger-list">
    ${methods.map(m => `
      <div class="method-card glass${S.method === m.id ? ' active' : ''}" data-method="${m.id}">
        <div class="method-top">
          <span class="method-badge badge-${m.id}">${m.badge}</span>
          <span>${m.icon}</span>
        </div>
        <h3>${m.title}</h3>
        <p>${m.desc}</p>
        ${S.method === m.id && m.id === 'consumerid' ? `
          <div class="connect-stages">
            ${['Connecting','Authenticating','Fetching bills','Done'].map((s, i) => `
              <div class="stage${i < 3 ? ' done' : ' current'}">
                <div class="stage-dot"></div><span>${s}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `).join('')}
  </div>
  <label class="consent-check slide-up">
    <input type="checkbox" checked/>
    <span>I consent to read-only billing history fetch, stored encrypted. Revocable from Settings → Privacy.</span>
  </label>
  <button class="btn-primary btn-full slide-up" id="onbNext" ${!S.method ? 'disabled' : ''}>
    ${S.method ? 'Connected — Continue →' : 'Select a method to continue'}
  </button>`;
}

function stepAppliances() {
  const cats = [
    { id: 'fans', icon: '🌀', label: 'Ceiling Fans' },
    { id: 'ac', icon: '❄', label: 'Air Conditioners' },
    { id: 'fridge', icon: '🧊', label: 'Refrigerator' },
    { id: 'washer', icon: '👕', label: 'Washing Machine' },
    { id: 'geyser', icon: '🚿', label: 'Water Heater / Geyser' },
    { id: 'other', icon: '🔌', label: 'Other High-Consumption' }
  ];
  return `
  <h2 class="slide-up">What's in your home?</h2>
  <p class="slide-up" style="animation-delay:.04s">The single most accurate input for your Home Efficiency Score. Skip anything you're unsure about.</p>
  <div class="accord-list stagger-list">
    ${cats.map(cat => {
      const open = S.openAppliance === cat.id;
      const done = S.appliances[cat.id] !== undefined;
      return `
        <div class="accord-row glass${open ? ' open' : ''}" data-accord="${cat.id}">
          <div class="accord-head">
            <span class="accord-icon">${cat.icon}</span>
            <span class="accord-label">${cat.label}</span>
            <span class="accord-status${done ? ' done' : ''}">${done ? '✓' : open ? '−' : '+'}</span>
          </div>
          ${open ? `<div class="accord-body">${applianceDetail(cat.id)}</div>` : ''}
        </div>`;
    }).join('')}
  </div>
  <p class="hint slide-up">Skip anything you're unsure about — we'll use city averages.</p>
  <button class="btn-primary btn-full slide-up" id="onbNext">Continue →</button>`;
}

function applianceDetail(id) {
  const a = S.appliances;
  if (id === 'fans') return `
    <div class="app-field"><label>How many?</label>
      <div class="qty-ctrl">
        <button class="qty-btn" data-qcat="fans" data-dir="-">−</button>
        <span>${a.fans?.qty || 0}</span>
        <button class="qty-btn" data-qcat="fans" data-dir="+">+</button>
      </div>
    </div>
    <div class="app-field"><label>Type</label>
      <div class="pill-row">
        ${['Regular (75–80W)','BLDC (28–35W)','Mixed'].map(t => `
          <button class="pill-btn${a.fans?.type === t ? ' active' : ''}" data-fantype="${t}">${t}</button>
        `).join('')}
      </div>
    </div>`;
  if (id === 'ac') return `
    <div class="app-field"><label>How many ACs?</label>
      <div class="qty-ctrl">
        <button class="qty-btn" data-qcat="ac" data-dir="-">−</button>
        <span>${a.ac?.qty || 0}</span>
        <button class="qty-btn" data-qcat="ac" data-dir="+">+</button>
      </div>
    </div>
    <div class="app-field"><label>Star rating (BEE)</label>
      <div class="star-row">
        ${[1,2,3,4,5].map(s => `
          <button class="star-btn${(a.ac?.stars||0) >= s ? ' active' : ''}" data-acstars="${s}">★</button>
        `).join('')}
      </div>
    </div>
    <div class="app-field"><label>Type</label>
      <div class="pill-row">
        ${['Inverter','Non-Inverter'].map(t => `
          <button class="pill-btn${a.ac?.type === t ? ' active' : ''}" data-actype="${t}">${t}</button>
        `).join('')}
      </div>
    </div>`;
  if (id === 'other') return `
    <div class="check-list">
      ${['Electric Oven / Microwave','Air Purifier','EV Charger','Home Office Setup','Exercise Equipment'].map(item => `
        <label class="check-row">
          <input type="checkbox" data-other="${item}" ${(a.other||[]).includes(item) ? 'checked' : ''}/>
          <span>${item}</span>
        </label>
      `).join('')}
    </div>`;
  return `
    <div class="pill-row">
      <button class="pill-btn${S.appliances[id]?.present ? ' active' : ''}" data-present="${id}-yes">Present</button>
      <button class="pill-btn${S.appliances[id]?.present === false ? ' active' : ''}" data-present="${id}-no">Not in home</button>
    </div>`;
}

function stepUsage() {
  return `
  <h2 class="slide-up">Usage patterns.</h2>
  <p class="slide-up" style="animation-delay:.04s">Two minutes to make forecasts significantly more accurate. Completely optional.</p>
  <div class="usage-list stagger-list">
    ${USAGE_Q.map(q => `
      <div class="usage-q">
        <div class="usage-label">${q.q}</div>
        <div class="usage-opts">
          ${q.opts.map(o => `
            <button class="usage-opt${S.usage[q.id] === o ? ' active' : ''}" data-uq="${q.id}" data-uv="${o}">${o}</button>
          `).join('')}
        </div>
      </div>
    `).join('')}
  </div>
  <div class="btn-pair slide-up">
    <button class="btn-ghost" id="onbNext">Skip</button>
    <button class="btn-primary" id="onbNext">Build my profile →</button>
  </div>`;
}

function stepComplete() {
  const bhkLabel = BHK_OPTIONS.find(b => b.id === S.bhk)?.label || '3 BHK';
  const propLabel = PROPERTY_TYPES.find(p => p.id === S.propType)?.label || 'Flat';
  const methodLabel = S.method === 'consumerid' ? 'DISCOM import (12 months)' : S.method === 'ocr' ? 'Bill OCR' : 'Manual entry';
  return `
  <div class="complete-wrap">
    <div class="complete-pulse slide-up">
      <div class="pulse-ring r1"></div><div class="pulse-ring r2"></div>
      <div class="pulse-core">गृ</div>
    </div>
    <p class="complete-label slide-up" style="animation-delay:.1s">Building your home's intelligence profile…</p>
    <div class="summary-card glass slide-up" style="animation-delay:.18s">
      <h3>Your Home Profile</h3>
      ${[['City', S.city||'Chennai'],['Locality',S.locality||'Not specified'],
         ['Home',`${bhkLabel} ${propLabel}`],['Tenure',S.tenure==='owner'?'Owner-occupied':'Renting'],
         ['Appliances','6 categories added'],['Data source',methodLabel]
        ].map(([k,v]) => `<div class="sum-row"><span>${k}</span><b>${v}</b></div>`).join('')}
    </div>
    <div class="first-insight glass slide-up" style="animation-delay:.26s">
      <span class="eyebrow">🎯 Your first insight</span>
      <p>Based on your ${bhkLabel} flat in ${S.locality||S.city} with two 3-star ACs, cooling costs likely account for <strong>55–62% of your bill</strong> — above the ${S.city} flat average of 48%. This is your biggest savings opportunity.</p>
      <div class="insight-save-line">Your home can save an estimated <strong>${inr(18200)}/year</strong>.</div>
    </div>
    <button class="btn-primary btn-full slide-up" style="animation-delay:.34s" id="enterApp">
      Open my dashboard →
    </button>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════
// 8. APP SHELL
// ═══════════════════════════════════════════════════════════════

function screenApp() {
  const c = appCity();
  const tabFns = { Home: tabHome, 'Tariff Guard': tabTariffGuard, History: tabHistory, Coach: tabCoach };
  const ICONS = { Home: '⌂', 'Tariff Guard': '◈', History: '▥', Coach: '✦' };

  return `
  <div class="app-shell" style="--primary:${c.primary};--accent:${c.accent}">

    <!-- Desktop sidebar -->
    <aside class="sidebar glass">
      <div class="sidebar-brand">
        <div class="brand-mark-sm">गृ</div>
        <div>
          <div class="sidebar-name">Griha</div>
          <div class="sidebar-city">${S.profileCity} · ${c.discom}</div>
        </div>
      </div>
      <nav class="sidebar-nav">
        ${['Home','Tariff Guard','History','Coach'].map(t => `
          <button class="snav-item${S.tab === t ? ' active' : ''}" data-tab="${t}">
            <span class="snav-icon">${ICONS[t]}</span>
            <span>${t}</span>
            ${t === 'Tariff Guard' && S.alertActive ? '<span class="snav-dot"></span>' : ''}
          </button>
        `).join('')}
      </nav>
      <div class="sidebar-footer">
        <div class="city-switcher">
          ${Object.entries(CITIES).map(([name, cd]) => `
            <button class="csw-btn${S.profileCity === name ? ' active' : ''}" data-switchcity="${name}"
              ${S.profileCity === name ? `style="color:${cd.accent}"` : ''}>${name}</button>
          `).join('')}
        </div>
      </div>
    </aside>

    <!-- Phone frame -->
    <main class="phone-col">
      <div class="phone-frame">
        <header class="app-header" style="background:linear-gradient(180deg,${c.primary}3a 0%,transparent 100%)">
          <div class="hdr-left">
            <div class="hdr-greeting">Hi ${S.profileName}</div>
            <div class="hdr-city">${S.profileCity} · ${c.discom}</div>
          </div>
          <div class="hdr-right">
            <div class="hdr-bill-amt">${inr(S.billToDate)}</div>
            <div class="hdr-bill-lbl">est. this cycle · ${S.daysLeft}d left</div>
          </div>
        </header>

        ${S.alertActive ? `
          <div class="alert-banner" data-tab="Tariff Guard">
            <span class="alert-dot"></span>
            <span>Tariff Guard: 592 units projected — 28 above TANGEDCO threshold. ₹640 at risk.</span>
            <span class="alert-arr">›</span>
          </div>
        ` : ''}

        <div class="tab-content" id="tabContent">
          ${(tabFns[S.tab] || tabHome)()}
        </div>

        <nav class="bottom-nav glass">
          ${['Home','Tariff Guard','History','Coach'].map(t => `
            <button class="bnav-item${S.tab === t ? ' active' : ''}" data-tab="${t}">
              <span class="bnav-icon">${ICONS[t]}</span>
              <span class="bnav-label">${t === 'Tariff Guard' ? 'Guard' : t}</span>
              ${t === 'Tariff Guard' && S.alertActive ? '<span class="bnav-dot"></span>' : ''}
            </button>
          `).join('')}
        </nav>
      </div>
    </main>

    <!-- Right panel -->
    <aside class="right-panel">
      ${rightPanel(c)}
    </aside>

  </div>
  ${sheets(c)}`;
}

// ═══════════════════════════════════════════════════════════════
// 9. TAB: HOME
// ═══════════════════════════════════════════════════════════════

function tabHome() {
  const c = appCity();
  const avg = Math.round(BILLS.reduce((s, b) => s + b.amount, 0) / BILLS.length);
  const max = Math.max(...BILLS.map(b => b.amount));
  const reversed = [...BILLS].reverse();
  const pts = reversed.map((b, i) => `${(i/11)*100},${85-(b.amount/max)*72}`).join(' ');

  return `<div class="tab-scroll">
    <!-- Bill due card -->
    <div class="bill-card glass slide-up">
      <div class="bill-card-left">
        <div class="eyebrow">Estimated bill to date · est. <button class="info-btn" data-sheet="est-info">ⓘ</button></div>
        <div class="bill-big">${inr(S.billToDate)}</div>
        <div class="bill-meta">${S.units} units · ${S.daysLeft} days left</div>
      </div>
      <button class="pay-btn" data-sheet="pay">Pay ₹4,680</button>
    </div>

    <!-- Score card -->
    <button class="score-card glass slide-up" data-sheet="score">
      <div class="score-visual">
        ${arc(74, 128, 10)}
        <div class="score-num">74</div>
      </div>
      <div class="score-info">
        <div class="eyebrow">Home Efficiency Score</div>
        <div class="score-line">Good · room to improve cooling</div>
        <div class="score-save">Save <strong>${inr(18200)}/year</strong></div>
        <div class="score-rank">Top 43% of ${S.profileCity} 3 BHK flats</div>
      </div>
    </button>

    <!-- Consumption breakdown -->
    <div class="card glass slide-up">
      <div class="card-hdr">
        <h3>Consumption breakdown</h3>
        <span class="est-badge">est. <button class="info-btn" data-sheet="est-info">ⓘ</button></span>
      </div>
      ${[['Cooling (ACs)', 56],['Refrigeration', 13],['Fans', 11],['Lighting', 7],['Standby & others', 6]].map(([l, p]) => `
        <div class="bar-row">
          <span class="bar-lbl">${l}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${p}%"></div></div>
          <em>${p}%</em>
        </div>
      `).join('')}
      <p class="method-note">Estimated from appliance inventory, BEE ratings, city defaults, and 12-month bill calibration.</p>
    </div>

    <!-- Trend + quick stats -->
    <div class="card glass slide-up">
      <div class="card-hdr">
        <h3>12-month bill trend</h3>
        <span class="data-src-badge">DISCOM import</span>
      </div>
      <svg class="sparkline" viewBox="0 0 100 90" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--accent)" stop-opacity=".4"/>
            <stop offset="100%" stop-color="var(--accent)" stop-opacity=".02"/>
          </linearGradient>
        </defs>
        <polyline class="spark-line" points="${pts}" fill="none"/>
        <polygon points="0,90 ${pts} 100,90" fill="url(#sg)"/>
        <circle cx="${(reversed.findIndex(b=>b.amount===max)/11)*100}"
          cy="${85-(max/max)*72}" r="3.5" fill="var(--accent)" opacity=".9"/>
      </svg>
      <div class="chart-lbls">
        ${reversed.filter((_,i)=>i%3===0).map(b=>`<span>${b.month}</span>`).join('')}
      </div>
      <div class="quick-grid">
        <div class="qstat"><span>Year-on-year</span><b class="positive">↓ 9%</b></div>
        <div class="qstat"><span>Best month</span><b>Jan ₹2,650</b></div>
        <div class="qstat"><span>12-mo avg</span><b>${inr(avg)}</b></div>
        <div class="qstat"><span>City rank</span><b class="accent-text">Top 43%</b></div>
      </div>
    </div>

    <!-- Modules grid -->
    <div class="card glass slide-up">
      <div class="card-hdr">
        <h3>Home modules</h3>
        <span class="platform-badge">Platform roadmap</span>
      </div>
      <div class="modules-grid">
        ${MODULES.map(m => `
          <button class="mod-tile${m.active ? ' mod-active' : ''}"
            ${!m.active ? `data-sheet="interest:${m.name}"` : ''}>
            <span class="mod-icon">${m.icon}</span>
            <span class="mod-name">${m.name}</span>
            <span class="mod-status">${m.active ? 'Active' : 'Coming soon'}</span>
            ${m.active ? '<span class="live-dot"></span>' : ''}
          </button>
        `).join('')}
      </div>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════
// 10. TAB: TARIFF GUARD
// ═══════════════════════════════════════════════════════════════

function tabTariffGuard() {
  const c = appCity();
  const thresh = c.warningThreshold || 420;
  const pctNow = Math.min((S.units / 650) * 100, 99);
  const pctProj = Math.min((S.projected / 650) * 100, 99);

  return `<div class="tab-scroll">
    <div class="guard-card glass slide-up warning-state">
      <div class="guard-hdr">
        <span class="status-badge warn">⚠ Warning</span>
        <span class="guard-cycle">1 May – 30 Jun 2026</span>
      </div>
      <h2>You may cross the next slab this cycle.</h2>
      <div class="guard-metrics">
        <div class="gm"><b>${S.units}</b><span>units consumed</span></div>
        <div class="gm"><b>${S.daysLeft}</b><span>days remaining</span></div>
        <div class="gm"><b>${S.projected}</b><span>projected total</span></div>
        <div class="gm"><b>${S.projected - thresh}</b><span>units to threshold</span></div>
      </div>
      <div class="impact-box">Crossing this slab adds about <strong>₹640</strong> — TANGEDCO reprices marginal units at the higher rate.</div>
    </div>

    <div class="card glass slide-up">
      <div class="card-hdr"><h3>Slab meter</h3><span>● current &nbsp; | projected</span></div>
      <div class="slab-meter">
        <div class="slab-track">
          <div class="slab-seg" style="width:16%;background:linear-gradient(90deg,#2ecc71,#4DCA78)"></div>
          <div class="slab-seg" style="width:20%;background:linear-gradient(90deg,#a8d84c,#c8e060)"></div>
          <div class="slab-seg" style="width:20%;background:linear-gradient(90deg,#ffb84d,#ff9557)"></div>
          <div class="slab-seg" style="width:20%;background:linear-gradient(90deg,#ff7733,#ff5544)"></div>
          <div class="slab-seg" style="width:24%;background:linear-gradient(90deg,#dd2222,#aa1111)"></div>
        </div>
        <div class="slab-now" style="left:${pctNow}%">
          <div class="slab-dot-white"></div>
          <span class="slab-now-lbl">Now</span>
        </div>
        <div class="slab-proj" style="left:${pctProj}%">
          <div class="slab-proj-line"></div>
          <span class="slab-proj-lbl">Proj.</span>
        </div>
      </div>
      <div class="slab-legend">
        <span><i class="leg-dot w"></i> Current (${S.units}u)</span>
        <span><i class="leg-dot r"></i> Projected (${S.projected}u)</span>
      </div>
    </div>

    <div class="card glass slide-up">
      <div class="card-hdr"><h3>${c.discom} domestic slabs</h3></div>
      <div class="tariff-table">
        ${c.tariffs.map(t => `
          <div class="tariff-row${t.note.includes('You are here') ? ' current-slab' : t.note.includes('Next threshold') ? ' next-slab' : ''}">
            <span class="tr-range">${t.range}</span>
            <span class="tr-rate">${t.rate}/unit</span>
            <span class="tr-note">${t.note}</span>
          </div>
        `).join('')}
      </div>
      <p class="slab-note">${c.discom} uses progressive slab pricing — higher units are billed at higher rates. Crossing a boundary doesn't reprice earlier units.</p>
    </div>

    <div class="card glass slide-up">
      <h3>Ranked actions this week</h3>
      <p class="save-goal-line">Saving 2.8 units/day keeps you below the threshold.</p>
      ${[
        ['Raise AC to 24°C after midnight', '1.1 units/day'],
        ['Delay washing machine 2 days', '0.9 units/day'],
        ['Switch off standby cluster overnight', '0.4 units/day'],
        ['Lights off in unused rooms', '0.4 units/day']
      ].map(([a, s]) => `
        <div class="action-row">
          <div class="ar-info"><span class="ar-name">${a}</span><span class="ar-tag">Free</span></div>
          <span class="ar-save">${s}</span>
        </div>
      `).join('')}
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════
// 11. TAB: HISTORY
// ═══════════════════════════════════════════════════════════════

function tabHistory() {
  return `<div class="tab-scroll">
    <div class="seg-ctrl slide-up">
      ${['Bills','Analytics','Insights'].map(v => `
        <button class="${S.historyView === v ? 'active' : ''}" data-hv="${v}">${v}</button>
      `).join('')}
    </div>
    ${S.historyView === 'Bills' ? histBills() :
      S.historyView === 'Analytics' ? histAnalytics() : histInsights()}
  </div>`;
}

function histBills() {
  const avg = Math.round(BILLS.reduce((s, b) => s + b.amount, 0) / BILLS.length);
  return `<div class="card glass slide-up">
    ${BILLS.map(b => `
      <div class="bill-rec">
        <div class="br-left">
          <span class="br-month">${b.month} '${String(b.year).slice(2)}</span>
          <span class="br-units">${b.units} units</span>
        </div>
        <div class="br-mid">
          <span class="br-amount">${inr(b.amount)}</span>
          <span class="br-vs ${b.amount > avg ? 'above' : 'below'}">
            ${b.amount > avg ? '↑' : '↓'}${Math.abs(Math.round(((b.amount-avg)/avg)*100))}% avg
          </span>
        </div>
        <div class="br-right">
          ${b.status === 'Due'
            ? `<button class="pay-inline-btn" data-sheet="pay">Pay</button>`
            : `<span class="paid-tag">Paid</span>`}
        </div>
      </div>
    `).join('')}
  </div>`;
}

function histAnalytics() {
  const maxAmt = Math.max(...BILLS.map(b => b.amount));
  const reversed = [...BILLS].reverse();

  function heatColor(amt) {
    const t = (amt - 2650) / (5120 - 2650);
    const r = Math.round(91 + t * 164), g = Math.round(183 - t * 78), bl = Math.round(255 - t * 225);
    return `rgb(${r},${g},${bl})`;
  }

  return `
    <div class="card glass slide-up">
      <div class="card-hdr"><h3>12-month bills</h3><span class="card-note">Peak: Jul ₹5,120</span></div>
      <div class="bar-chart">
        ${reversed.map(b => `
          <div class="bc-col">
            <div class="bc-bar${b.amount === maxAmt ? ' peak' : ''}" style="height:${(b.amount/maxAmt)*100}%"></div>
            <span>${b.month[0]}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="card glass slide-up">
      <div class="card-hdr"><h3>Year-on-year comparison</h3></div>
      <div class="seasonal">
        ${BILLS_PREV.map(prev => {
          const curr = BILLS.find(b => b.month === prev.month && b.year === prev.year + 1);
          if (!curr) return '';
          const better = curr.amount < prev.amount;
          return `
            <div class="seas-col">
              <div class="seas-lbl">${prev.month}</div>
              <div class="seas-bars">
                <div class="seas-bar prev" style="height:${(prev.amount/6000)*100}%">
                  <span>₹${Math.round(prev.amount/1000)}k</span>
                </div>
                <div class="seas-bar curr" style="height:${(curr.amount/6000)*100}%">
                  <span>₹${Math.round(curr.amount/1000)}k</span>
                </div>
              </div>
              <div class="seas-delta ${better ? 'better' : 'worse'}">
                ${better ? '↓' : '↑'} ₹${Math.abs(curr.amount - prev.amount).toLocaleString('en-IN')}
              </div>
            </div>`;
        }).join('')}
        <div class="seas-legend">
          <span><i class="leg-dot prev"></i>2025</span>
          <span><i class="leg-dot curr"></i>2026</span>
        </div>
      </div>
    </div>

    <div class="card glass slide-up">
      <div class="card-hdr"><h3>Annual bill heat map</h3></div>
      <div class="heat-map">
        ${reversed.map(b => `
          <div class="heat-cell" style="background:${heatColor(b.amount)}">
            <span class="hc-month">${b.month}</span>
            <span class="hc-amt">₹${Math.round(b.amount/100)}k</span>
          </div>
        `).join('')}
      </div>
      <div class="heat-scale">
        <span>Lower</span>
        <div class="heat-grad"></div>
        <span>Higher</span>
      </div>
    </div>`;
}

function histInsights() {
  return `<div class="card glass slide-up">
    <div class="card-hdr"><h3>Generated observations</h3><span class="card-note">Updated with latest bill</span></div>
    ${[
      ['📉', 'Your May bill is ₹520 below last May despite similar heat — evening AC hours fell by 11%.'],
      ['📅', 'August remains your peak-risk month. Tariff Guard will activate the warning 6 days earlier.'],
      ['📊', 'Your 6-month unit trend is stable. The next saving lever is appliance mix, not behaviour.'],
      ['💡', 'Replacing 4 regular fans with BLDC now could reduce your next August bill by ~₹490.'],
      ['✅', 'Your on-time payment streak covers 11 consecutive bills, adding 4 points to Bill Management.']
    ].map(([icon, text]) => `
      <div class="insight-row"><span>${icon}</span><p>${text}</p></div>
    `).join('')}
  </div>`;
}

// ═══════════════════════════════════════════════════════════════
// 12. TAB: COACH
// ═══════════════════════════════════════════════════════════════

function tabCoach() {
  return `<div class="tab-scroll">
    <div class="coach-hero glass slide-up">
      <span class="coach-badge">🎉 Weekly Coach</span>
      <h2>You avoided about ₹520 this month.</h2>
      <p>Your evening AC runtime dropped 11% after you raised the thermostat. Directly attributable saving: ₹520 this billing cycle.</p>
      <div class="eco-note">You also avoided an estimated <strong>48 kg of CO₂</strong> — financial outcome first, sustainability is the reward.</div>
    </div>

    <div class="card glass slide-up">
      <div class="card-hdr"><h3>Next month forecast</h3><span class="est-badge">est.</span></div>
      <div class="forecast-range">
        <span class="fc-low">₹4,250</span>
        <div class="fc-band"><div class="fc-fill"></div></div>
        <span class="fc-high">₹4,780</span>
      </div>
      <p class="fc-assume">Assumes Chennai heat within 2°C of 5-year average · occupancy unchanged · current appliance mix.</p>
      <button class="btn-ghost btn-sm">Trim lower bound: reduce 1.8 units/day</button>
    </div>

    <div class="card glass slide-up">
      <div class="card-hdr"><h3>Prediction accuracy</h3></div>
      <div class="accuracy-row success">
        <span class="acc-icon">✓</span>
        <div><b>Last forecast was accurate</b>
          <p>Predicted ₹4,500–₹4,950. Actual: ₹4,680. Griha was within range — assumption set remains active.</p>
        </div>
      </div>
    </div>

    <div class="card glass slide-up">
      <div class="card-hdr"><h3>Action tracking</h3></div>
      <div class="action-track">
        <div class="at-rec">
          <span class="at-icon">❄</span>
          <div>
            <b>Raise AC thermostat to 24°C</b>
            <p>Since you logged this 3 weeks ago, your bill dropped ₹380 vs the same period last month.</p>
          </div>
        </div>
        <button class="btn-done">✓ Done</button>
      </div>
    </div>

    <div class="card glass slide-up">
      <div class="card-hdr"><h3>Upgrade roadmap</h3></div>
      <div class="roadmap-callout">Your home can realistically save <strong>${inr(18200)}/year</strong>. Here is the order that makes the most financial sense for you.</div>
      ${ROADMAP.map((item, i) => `
        <div class="road-item${S.roadmapOpen === i ? ' open' : ''}">
          <button class="road-hdr" data-road="${i}">
            <div class="road-title-row">
              <span>${item.title}</span>
              <span class="road-chev">${S.roadmapOpen === i ? '∧' : '∨'}</span>
            </div>
            <div class="road-meta">
              <span class="road-save">${item.saving}</span>
              <span class="road-cost">Cost: ${item.cost}</span>
              <span class="road-diff diff-${item.diff.toLowerCase()}">${item.diff}</span>
            </div>
          </button>
          ${S.roadmapOpen === i ? `
            <div class="road-body">
              <p>${item.rationale}</p>
              <div class="road-roi">
                <span>Break-even: ${item.breakeven}</span>
                <span>Annual saving: ${item.saving}</span>
              </div>
              ${item.cost !== '₹0' && item.cost !== 'Society-led' ? `
                <button class="btn-ghost">I'm ready — show me the best options</button>
              ` : ''}
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════
// 13. RIGHT PANEL
// ═══════════════════════════════════════════════════════════════

function rightPanel(c) {
  return `
  <div class="rp-content">
    <div class="rp-section slide-up">
      <div class="rp-title">SCORE BREAKDOWN</div>
      ${SCORE_DIMS.map(d => `
        <div class="rp-dim-row">
          <span class="rp-dim-name">${d.name}</span>
          <div class="rp-dim-bar"><div class="rp-dim-fill" style="width:${d.score}%;background:${scoreColor(d.score)}"></div></div>
          <span class="rp-dim-score" style="color:${scoreColor(d.score)}">${d.score}</span>
        </div>
      `).join('')}
    </div>

    <div class="rp-section slide-up" style="animation-delay:.1s">
      <div class="rp-title">EXPERIENCE ONBOARDING</div>
      <p class="rp-desc">Walk through the full registration and setup flow.</p>
      <button class="btn-primary btn-full" id="restartOnb">Preview onboarding →</button>
    </div>

    <div class="rp-section slide-up" style="animation-delay:.2s">
      <div class="rp-title">SWITCH CITY</div>
      <div class="rp-city-grid">
        ${Object.entries(CITIES).map(([name, cd]) => `
          <button class="rp-city-btn${S.profileCity === name ? ' active' : ''}" data-switchcity="${name}"
            ${S.profileCity === name ? `style="background:${cd.primary}28;border-color:${cd.accent};color:${cd.accent}"` : ''}>
            ${name}
          </button>
        `).join('')}
      </div>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════
// 14. SHEETS / MODALS
// ═══════════════════════════════════════════════════════════════

function sheets(c) {
  if (!S.sheet) return '';

  const wrap = (content) => `
    <div class="scrim" id="scrimEl">
      <div class="sheet">
        <div class="sheet-handle"></div>
        <button class="close-btn" data-close>×</button>
        ${content}
      </div>
    </div>`;

  if (S.sheet === 'score') return wrap(`
    <h2>Home Efficiency Score</h2>
    <p>Composite score weighted by consumption share. Cooling carries more weight in ${S.profileCity}. Solar Readiness replaced with Energy Transition Readiness for your rented flat.</p>
    <div class="dim-grid">
      ${SCORE_DIMS.map(d => `
        <div class="dim-card glass">
          <div class="dim-arc-wrap">
            ${arc(d.score, 86, 8, scoreColor(d.score))}
            <span class="dim-arc-num">${d.score}</span>
          </div>
          <span class="dim-icon">${d.icon}</span>
          <h4>${d.name}</h4>
          <span class="dim-lbl" style="color:${scoreColor(d.score)}">${d.label}</span>
          <p>${d.action}</p>
        </div>
      `).join('')}
    </div>
    <div class="sheet-saving">Total annual savings available: <strong>${inr(18200)}</strong></div>`);

  if (S.sheet === 'pay') return wrap(`
    <h2>Pay TANGEDCO bill</h2>
    <div class="pay-rows">
      ${[['Payee','TANGEDCO'],['Consumer ID','09-245-118-771'],['Bill month','May 2026'],['Amount due','₹4,680'],['Due date','18/05/2026']].map(([k,v]) => `
        <div class="pay-row"><span>${k}</span><b>${v}</b></div>
      `).join('')}
    </div>
    <div class="pay-methods">
      ${['UPI','Net Banking','Card'].map(m => `
        <button class="pay-mth${S.payMethod === m ? ' active' : ''}" data-pm="${m}">${m}</button>
      `).join('')}
    </div>
    <button class="btn-primary btn-full" data-paid>Pay ₹4,680 →</button>
    <p class="pay-footer">No convenience fee · RBI regulated · Secured by BBPS</p>`);

  if (S.sheet === 'paid') return wrap(`
    <div class="success-wrap">
      <div class="success-ring">✓</div>
      <h2>Payment successful</h2>
      <p>Transaction ref: <strong>BBPS-GRIHA-260510-8842</strong></p>
      <p>Receipt sent to your WhatsApp and email.</p>
      <div class="success-alert">
        <span class="eyebrow">Tariff Guard still active</span>
        <p>Payment complete, but usage still projects 28 units above threshold. Keep trimming 2.2 units/day.</p>
      </div>
      <button class="btn-primary btn-full" data-close>Done</button>
    </div>`);

  if (S.sheet === 'est-info') return wrap(`
    <h3>About this estimate</h3>
    <p>Derived from your appliance inventory (BEE star ratings and wattage), city-specific usage defaults, and 12-month billing data as a calibration anchor. Never presented as a direct measurement. Smart meter integration is out of scope for this release.</p>
    <button class="btn-primary" data-close>Understood</button>`);

  if (S.sheet?.startsWith('interest:')) {
    const mod = S.sheet.split(':').slice(1).join(':');
    return wrap(`
      <h2>${mod} is coming to Griha.</h2>
      <p>This module is in development. Register interest and your priorities will shape when it launches and what it covers first.</p>
      <p>All data collection for this module will require a separate consent at launch.</p>
      <button class="btn-primary btn-full" data-close>Notify me →</button>
      <button class="btn-ghost btn-full" data-close>Maybe later</button>`);
  }
  return '';
}

// ═══════════════════════════════════════════════════════════════
// 15. BIND
// ═══════════════════════════════════════════════════════════════

function bind() {
  // Generic tab navigation
  root.querySelectorAll('[data-tab]').forEach(el => {
    el.onclick = e => { e.stopPropagation(); set({ tab: el.dataset.tab, sheet: null }); };
  });

  // History sub-views
  root.querySelectorAll('[data-hv]').forEach(el => {
    el.onclick = () => set({ historyView: el.dataset.hv });
  });

  // Open sheets
  root.querySelectorAll('[data-sheet]').forEach(el => {
    el.onclick = e => { e.stopPropagation(); set({ sheet: el.dataset.sheet }); };
  });

  // Close sheets
  root.querySelectorAll('[data-close]').forEach(el => {
    el.onclick = () => set({ sheet: null });
  });
  const scrim = root.querySelector('#scrimEl');
  if (scrim) scrim.onclick = e => { if (e.target === scrim) set({ sheet: null }); };

  // Alert banner → Tariff Guard
  root.querySelector('.alert-banner')?.addEventListener('click', () => set({ tab: 'Tariff Guard', sheet: null }));

  // Auth input
  const authInput = root.querySelector('#authInput');
  if (authInput) {
    authInput.addEventListener('input', e => {
      S.authInput = e.target.value;
      const btn = root.querySelector('#sendOtp');
      if (btn) btn.disabled = S.authInput.length < 5;
    });
    setTimeout(() => authInput.focus(), 50);
  }

  // Send OTP
  root.querySelector('#sendOtp')?.addEventListener('click', () => {
    set({ otpSent: true, otpTimer: 30 });
    startOtpTimer();
  });

  // OTP digit inputs
  root.querySelectorAll('.otp-box').forEach((inp, i) => {
    inp.addEventListener('input', e => {
      const val = e.target.value.replace(/\D/g, '').slice(-1);
      e.target.value = val;
      const d = [...S.otpDigits]; d[i] = val; S.otpDigits = d;
      if (val && i < 5) root.querySelectorAll('.otp-box')[i+1]?.focus();
      const vBtn = root.querySelector('#verifyOtp');
      if (vBtn) vBtn.disabled = d.join('').length < 6;
      e.target.classList.toggle('filled', !!val);
    });
    inp.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !inp.value && i > 0) {
        const prev = root.querySelectorAll('.otp-box')[i-1];
        if (prev) { prev.focus(); prev.value = ''; }
        const d = [...S.otpDigits]; d[i-1] = ''; S.otpDigits = d;
      }
    });
  });

  // Verify OTP
  root.querySelector('#verifyOtp')?.addEventListener('click', () => set({ otpDone: true }));
  root.querySelector('#changeNum')?.addEventListener('click', () => set({ otpSent: false, otpDigits: ['','','','','',''] }));
  root.querySelector('#resendOtp')?.addEventListener('click', () => { set({ otpTimer: 30 }); startOtpTimer(); });

  // Name input
  const nameInput = root.querySelector('#nameInput');
  if (nameInput) {
    nameInput.addEventListener('input', e => {
      S.name = e.target.value;
      const btn = root.querySelector('#submitName');
      if (btn) btn.disabled = S.name.length < 2;
    });
    setTimeout(() => nameInput.focus(), 50);
  }
  root.querySelector('#submitName')?.addEventListener('click', () => set({ screen: 'language' }));

  // Language
  root.querySelectorAll('[data-lang]').forEach(el => {
    el.onclick = () => set({ language: el.dataset.lang });
  });
  root.querySelector('#langContinue')?.addEventListener('click', () => set({ screen: 'onboarding', step: 0 }));

  // Onboarding back
  root.querySelector('#onbBack')?.addEventListener('click', () => {
    if (S.step > 0) set({ step: S.step - 1 });
    else set({ screen: 'language' });
  });

  // Onboarding next (all next buttons)
  root.querySelectorAll('#onbNext').forEach(el => {
    el.onclick = e => { e.stopPropagation(); if (S.step < 9) set({ step: S.step + 1 }); };
  });

  // City selection
  root.querySelectorAll('[data-city]').forEach(el => {
    el.onclick = () => { if (CITIES[el.dataset.city]) set({ city: el.dataset.city }); };
  });

  // Locality
  const locInput = root.querySelector('#locInput');
  if (locInput) locInput.addEventListener('input', e => { S.locality = e.target.value; });
  root.querySelectorAll('[data-loc]').forEach(el => {
    el.onclick = () => set({ locality: el.dataset.loc });
  });

  // Property
  root.querySelectorAll('[data-prop]').forEach(el => { el.onclick = () => set({ propType: el.dataset.prop }); });
  root.querySelectorAll('[data-bhk]').forEach(el => { el.onclick = () => set({ bhk: el.dataset.bhk }); });
  root.querySelectorAll('[data-tenure]').forEach(el => { el.onclick = () => set({ tenure: el.dataset.tenure }); });
  root.querySelectorAll('[data-rooftop]').forEach(el => { el.onclick = () => set({ hasRooftop: el.dataset.rooftop === 'yes' }); });

  // Billing
  root.querySelectorAll('[data-cycle]').forEach(el => { el.onclick = () => set({ billingCycle: el.dataset.cycle }); });
  root.querySelectorAll('[data-cstart]').forEach(el => { el.onclick = () => set({ cycleStart: +el.dataset.cstart }); });

  // Connection method
  root.querySelectorAll('[data-method]').forEach(el => { el.onclick = () => set({ method: el.dataset.method }); });

  // Appliance accordion
  root.querySelectorAll('[data-accord]').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.closest('.accord-body')) return;
      const id = el.dataset.accord;
      set({ openAppliance: S.openAppliance === id ? null : id });
    });
  });

  // Fan type
  root.querySelectorAll('[data-fantype]').forEach(el => {
    el.onclick = e => {
      e.stopPropagation();
      S.appliances = { ...S.appliances, fans: { ...S.appliances.fans, type: el.dataset.fantype } };
      render();
    };
  });

  // AC stars
  root.querySelectorAll('[data-acstars]').forEach(el => {
    el.onclick = e => {
      e.stopPropagation();
      S.appliances = { ...S.appliances, ac: { ...S.appliances.ac, stars: +el.dataset.acstars } };
      render();
    };
  });

  // AC type
  root.querySelectorAll('[data-actype]').forEach(el => {
    el.onclick = e => {
      e.stopPropagation();
      S.appliances = { ...S.appliances, ac: { ...S.appliances.ac, type: el.dataset.actype } };
      render();
    };
  });

  // Qty controls
  root.querySelectorAll('.qty-btn').forEach(el => {
    el.onclick = e => {
      e.stopPropagation();
      const cat = el.dataset.qcat, dir = el.dataset.dir === '+' ? 1 : -1;
      S.appliances = { ...S.appliances, [cat]: { ...S.appliances[cat], qty: Math.max(0, (S.appliances[cat]?.qty || 0) + dir) } };
      render();
    };
  });

  // Present toggles
  root.querySelectorAll('[data-present]').forEach(el => {
    el.onclick = e => {
      e.stopPropagation();
      const [cat, val] = el.dataset.present.split('-');
      S.appliances = { ...S.appliances, [cat]: { ...S.appliances[cat], present: val === 'yes' } };
      render();
    };
  });

  // Other checklist
  root.querySelectorAll('[data-other]').forEach(el => {
    el.onchange = e => {
      e.stopPropagation();
      const item = el.dataset.other;
      const list = [...(S.appliances.other || [])];
      const idx = list.indexOf(item);
      if (el.checked && idx < 0) list.push(item);
      else if (!el.checked && idx >= 0) list.splice(idx, 1);
      S.appliances = { ...S.appliances, other: list };
    };
  });

  // Usage questions
  root.querySelectorAll('[data-uq]').forEach(el => {
    el.onclick = () => set({ usage: { ...S.usage, [el.dataset.uq]: el.dataset.uv } });
  });

  // Enter app
  root.querySelector('#enterApp')?.addEventListener('click', () => {
    set({ screen: 'app', profileCity: S.city || 'Chennai', profileName: S.name || 'Ananya' });
  });

  // Restart onboarding
  root.querySelector('#restartOnb')?.addEventListener('click', () => {
    set({ screen: 'auth', otpSent: false, otpDone: false, otpDigits: ['','','','','',''], authInput: '', city: null, step: 0 });
  });

  // City switcher (right panel + sidebar)
  root.querySelectorAll('[data-switchcity]').forEach(el => {
    el.onclick = () => set({ profileCity: el.dataset.switchcity });
  });

  // Payment method
  root.querySelectorAll('[data-pm]').forEach(el => {
    el.onclick = e => { e.stopPropagation(); set({ payMethod: el.dataset.pm }); };
  });

  // Pay now
  root.querySelectorAll('[data-paid]').forEach(el => {
    el.onclick = () => set({ sheet: 'paid' });
  });

  // Pay inline
  root.querySelectorAll('.pay-inline-btn').forEach(el => {
    el.onclick = e => { e.stopPropagation(); set({ sheet: 'pay' }); };
  });

  // Roadmap items
  root.querySelectorAll('[data-road]').forEach(el => {
    el.onclick = e => {
      e.stopPropagation();
      const i = +el.dataset.road;
      set({ roadmapOpen: S.roadmapOpen === i ? null : i });
    };
  });

  // Animate arcs after render
  requestAnimationFrame(() => {
    root.querySelectorAll('.arc-active').forEach(el => {
      el.style.transition = 'stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1)';
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// 16. OTP TIMER
// ═══════════════════════════════════════════════════════════════

function startOtpTimer() {
  clearInterval(_otpTimer);
  _otpTimer = setInterval(() => {
    if (S.otpTimer > 0) {
      S.otpTimer--;
      const el = root.querySelector('#otpTimerEl');
      if (el) {
        if (S.otpTimer > 0) {
          el.textContent = `Resend in 00:${String(S.otpTimer).padStart(2, '0')}`;
        } else {
          el.outerHTML = `<button class="link-btn" id="resendOtp">Resend OTP</button>`;
          root.querySelector('#resendOtp')?.addEventListener('click', () => {
            set({ otpTimer: 30 }); startOtpTimer();
          });
        }
      }
    } else {
      clearInterval(_otpTimer);
    }
  }, 1000);
}

// ═══════════════════════════════════════════════════════════════
// 17. INIT
// ═══════════════════════════════════════════════════════════════

render();
