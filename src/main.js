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

// ── Interface translations (core chrome; coach content ships after native review) ──
// Keys stay in English; missing keys fall back to English.
const I18N = {
  Hindi: { nav_home:'होम', nav_guard:'गार्ड', nav_history:'इतिहास', nav_coach:'कोच', hes:'गृह दक्षता स्कोर', bill_to_date:'अब तक का अनुमानित बिल', days_left:'{n} दिन शेष', pay:'भुगतान करें', breakdown:'खपत का विश्लेषण', trend:'12 महीने का बिल रुझान', modules:'होम मॉड्यूल', cont:'आगे बढ़ें →', hi:'नमस्ते', save_line:'{amt}/वर्ष बचाएँ', score_good:'अच्छा · कूलिंग में सुधार की गुंजाइश', guard_title:'इस चक्र में आप अगले स्लैब को पार कर सकते हैं।', m_units:'यूनिट खपत', m_days:'दिन शेष', m_proj:'अनुमानित कुल', m_thresh:'सीमा तक यूनिट' },
  Tamil: { nav_home:'முகப்பு', nav_guard:'காப்பு', nav_history:'வரலாறு', nav_coach:'கோச்', hes:'வீட்டு திறன் மதிப்பெண்', bill_to_date:'இதுவரை மதிப்பிடப்பட்ட பில்', days_left:'{n} நாட்கள் மீதம்', pay:'செலுத்து', breakdown:'நுகர்வு பகுப்பாய்வு', trend:'12 மாத பில் போக்கு', modules:'வீட்டு தொகுதிகள்', cont:'தொடரவும் →', hi:'வணக்கம்', save_line:'ஆண்டுக்கு {amt} சேமிக்கலாம்', score_good:'நன்று · குளிரூட்டலில் மேம்பாடு சாத்தியம்', guard_title:'இந்த சுழற்சியில் அடுத்த அடுக்கை நீங்கள் கடக்கக்கூடும்.', m_units:'யூனிட் நுகர்வு', m_days:'நாட்கள் மீதம்', m_proj:'எதிர்பார்க்கும் மொத்தம்', m_thresh:'வரம்பிற்கு யூனிட்கள்' },
  Telugu: { nav_home:'హోమ్', nav_guard:'గార్డ్', nav_history:'చరిత్ర', nav_coach:'కోచ్', hes:'ఇంటి సామర్థ్య స్కోరు', bill_to_date:'ఇప్పటివరకు అంచనా బిల్లు', days_left:'{n} రోజులు మిగిలాయి', pay:'చెల్లించండి', breakdown:'వినియోగ విశ్లేషణ', trend:'12 నెలల బిల్లు ధోరణి', modules:'హోమ్ మాడ్యూళ్లు', cont:'కొనసాగించండి →', hi:'నమస్కారం', save_line:'సంవత్సరానికి {amt} ఆదా', score_good:'బాగుంది · కూలింగ్‌లో మెరుగుదల అవకాశం', guard_title:'ఈ సైకిల్‌లో మీరు తదుపరి స్లాబ్ దాటవచ్చు.', m_units:'యూనిట్ల వినియోగం', m_days:'రోజులు మిగిలాయి', m_proj:'అంచనా మొత్తం', m_thresh:'పరిమితికి యూనిట్లు' },
  Kannada: { nav_home:'ಹೋಮ್', nav_guard:'ಗಾರ್ಡ್', nav_history:'ಇತಿಹಾಸ', nav_coach:'ಕೋಚ್', hes:'ಮನೆ ದಕ್ಷತೆ ಸ್ಕೋರ್', bill_to_date:'ಇದುವರೆಗಿನ ಅಂದಾಜು ಬಿಲ್', days_left:'{n} ದಿನಗಳು ಬಾಕಿ', pay:'ಪಾವತಿಸಿ', breakdown:'ಬಳಕೆ ವಿಶ್ಲೇಷಣೆ', trend:'12 ತಿಂಗಳ ಬಿಲ್ ಪ್ರವೃತ್ತಿ', modules:'ಹೋಮ್ ಮಾಡ್ಯೂಲ್‌ಗಳು', cont:'ಮುಂದುವರಿಸಿ →', hi:'ನಮಸ್ಕಾರ', save_line:'ವರ್ಷಕ್ಕೆ {amt} ಉಳಿತಾಯ', score_good:'ಚೆನ್ನಾಗಿದೆ · ಕೂಲಿಂಗ್ ಸುಧಾರಿಸಬಹುದು', guard_title:'ಈ ಚಕ್ರದಲ್ಲಿ ನೀವು ಮುಂದಿನ ಸ್ಲ್ಯಾಬ್ ದಾಟಬಹುದು.', m_units:'ಯೂನಿಟ್ ಬಳಕೆ', m_days:'ದಿನಗಳು ಬಾಕಿ', m_proj:'ಅಂದಾಜು ಒಟ್ಟು', m_thresh:'ಮಿತಿಗೆ ಯೂನಿಟ್‌ಗಳು' },
  Malayalam: { nav_home:'ഹോം', nav_guard:'ഗാർഡ്', nav_history:'ചരിത്രം', nav_coach:'കോച്ച്', hes:'വീടിന്റെ കാര്യക്ഷമതാ സ്കോർ', bill_to_date:'ഇതുവരെയുള്ള ഏകദേശ ബിൽ', days_left:'{n} ദിവസം ബാക്കി', pay:'അടയ്ക്കുക', breakdown:'ഉപഭോഗ വിശകലനം', trend:'12 മാസത്തെ ബിൽ പ്രവണത', modules:'ഹോം മൊഡ്യൂളുകൾ', cont:'തുടരുക →', hi:'നമസ്കാരം', save_line:'വർഷം {amt} ലാഭിക്കാം', score_good:'നല്ലത് · കൂളിംഗിൽ മെച്ചപ്പെടുത്താം', guard_title:'ഈ സൈക്കിളിൽ അടുത്ത സ്ലാബ് കടന്നേക്കാം.', m_units:'യൂണിറ്റ് ഉപഭോഗം', m_days:'ദിവസം ബാക്കി', m_proj:'പ്രതീക്ഷിത ആകെ', m_thresh:'പരിധി വരെ യൂണിറ്റ്' },
  Marathi: { nav_home:'होम', nav_guard:'गार्ड', nav_history:'इतिहास', nav_coach:'कोच', hes:'गृह कार्यक्षमता गुण', bill_to_date:'आतापर्यंतचे अंदाजे बिल', days_left:'{n} दिवस शिल्लक', pay:'भरा', breakdown:'वापराचे विश्लेषण', trend:'१२ महिन्यांचा बिल कल', modules:'होम मॉड्यूल्स', cont:'पुढे जा →', hi:'नमस्कार', save_line:'वर्षाला {amt} बचत', score_good:'चांगले · कूलिंगमध्ये सुधारणा शक्य', guard_title:'या चक्रात तुम्ही पुढील स्लॅब ओलांडू शकता.', m_units:'युनिट वापर', m_days:'दिवस शिल्लक', m_proj:'अंदाजित एकूण', m_thresh:'मर्यादेपर्यंत युनिट्स' },
  Bengali: { nav_home:'হোম', nav_guard:'গার্ড', nav_history:'ইতিহাস', nav_coach:'কোচ', hes:'বাড়ির দক্ষতা স্কোর', bill_to_date:'এখন পর্যন্ত আনুমানিক বিল', days_left:'{n} দিন বাকি', pay:'পরিশোধ করুন', breakdown:'ব্যবহারের বিশ্লেষণ', trend:'১২ মাসের বিলের প্রবণতা', modules:'হোম মডিউল', cont:'এগিয়ে যান →', hi:'নমস্কার', save_line:'বছরে {amt} সাশ্রয়', score_good:'ভালো · কুলিং-এ উন্নতির সুযোগ', guard_title:'এই চক্রে আপনি পরবর্তী স্ল্যাব অতিক্রম করতে পারেন।', m_units:'ইউনিট ব্যবহার', m_days:'দিন বাকি', m_proj:'আনুমানিক মোট', m_thresh:'সীমা পর্যন্ত ইউনিট' },
  Gujarati: { nav_home:'હોમ', nav_guard:'ગાર્ડ', nav_history:'ઇતિહાસ', nav_coach:'કોચ', hes:'ઘર કાર્યક્ષમતા સ્કોર', bill_to_date:'અત્યાર સુધીનું અંદાજિત બિલ', days_left:'{n} દિવસ બાકી', pay:'ચૂકવો', breakdown:'વપરાશ વિશ્લેષણ', trend:'12 મહિનાનો બિલ ટ્રેન્ડ', modules:'હોમ મોડ્યુલ્સ', cont:'આગળ વધો →', hi:'નમસ્તે', save_line:'વર્ષે {amt} બચત', score_good:'સારું · કૂલિંગમાં સુધારો શક્ય', guard_title:'આ ચક્રમાં તમે આગળનો સ્લેબ પાર કરી શકો છો.', m_units:'યુનિટ વપરાશ', m_days:'દિવસ બાકી', m_proj:'અંદાજિત કુલ', m_thresh:'મર્યાદા સુધી યુનિટ' },
  Punjabi: { nav_home:'ਹੋਮ', nav_guard:'ਗਾਰਡ', nav_history:'ਇਤਿਹਾਸ', nav_coach:'ਕੋਚ', hes:'ਘਰ ਕੁਸ਼ਲਤਾ ਸਕੋਰ', bill_to_date:'ਹੁਣ ਤੱਕ ਦਾ ਅੰਦਾਜ਼ਨ ਬਿੱਲ', days_left:'{n} ਦਿਨ ਬਾਕੀ', pay:'ਭੁਗਤਾਨ ਕਰੋ', breakdown:'ਖਪਤ ਵਿਸ਼ਲੇਸ਼ਣ', trend:'12 ਮਹੀਨਿਆਂ ਦਾ ਬਿੱਲ ਰੁਝਾਨ', modules:'ਹੋਮ ਮੋਡੀਊਲ', cont:'ਅੱਗੇ ਵਧੋ →', hi:'ਸਤ ਸ੍ਰੀ ਅਕਾਲ', save_line:'ਸਾਲਾਨਾ {amt} ਬਚਤ', score_good:'ਚੰਗਾ · ਕੂਲਿੰਗ ਵਿੱਚ ਸੁਧਾਰ ਸੰਭਵ', guard_title:'ਇਸ ਚੱਕਰ ਵਿੱਚ ਤੁਸੀਂ ਅਗਲਾ ਸਲੈਬ ਪਾਰ ਕਰ ਸਕਦੇ ਹੋ।', m_units:'ਯੂਨਿਟ ਖਪਤ', m_days:'ਦਿਨ ਬਾਕੀ', m_proj:'ਅੰਦਾਜ਼ਨ ਕੁੱਲ', m_thresh:'ਹੱਦ ਤੱਕ ਯੂਨਿਟ' },
  Odia: { nav_home:'ହୋମ୍', nav_guard:'ଗାର୍ଡ', nav_history:'ଇତିହାସ', nav_coach:'କୋଚ୍', hes:'ଘର ଦକ୍ଷତା ସ୍କୋର', bill_to_date:'ଏପର୍ଯ୍ୟନ୍ତ ଆନୁମାନିକ ବିଲ୍', days_left:'{n} ଦିନ ବାକି', pay:'ପଇଠ କରନ୍ତୁ', breakdown:'ବ୍ୟବହାର ବିଶ୍ଳେଷଣ', trend:'12 ମାସର ବିଲ୍ ଧାରା', modules:'ହୋମ୍ ମଡ୍ୟୁଲ୍', cont:'ଆଗକୁ ବଢ଼ନ୍ତୁ →', hi:'ନମସ୍କାର', save_line:'ବର୍ଷକୁ {amt} ସଞ୍ଚୟ', score_good:'ଭଲ · କୁଲିଂରେ ଉନ୍ନତି ସମ୍ଭବ', guard_title:'ଏହି ଚକ୍ରରେ ଆପଣ ପରବର୍ତ୍ତୀ ସ୍ଲାବ୍ ପାର କରିପାରନ୍ତି।', m_units:'ୟୁନିଟ୍ ବ୍ୟବହାର', m_days:'ଦିନ ବାକି', m_proj:'ଆନୁମାନିକ ମୋଟ', m_thresh:'ସୀମା ପର୍ଯ୍ୟନ୍ତ ୟୁନିଟ୍' }
};
const I18N_EN = { nav_home:'Home', nav_guard:'Guard', nav_history:'History', nav_coach:'Coach', hes:'Home Efficiency Score', bill_to_date:'Estimated bill to date', days_left:'{n} days left', pay:'Pay', breakdown:'Consumption breakdown', trend:'12-month bill trend', modules:'Home modules', cont:'Continue →', hi:'Hi', save_line:'Save {amt}/year', score_good:'Good · room to improve cooling', guard_title:'You may cross the next slab this cycle.', m_units:'units consumed', m_days:'days remaining', m_proj:'projected total', m_thresh:'units to threshold' };

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
  { title: 'Replace 4 regular fans with BLDC', saving: '₹5,900/yr', cost: '₹11,200', breakeven: '23 months', diff: 'Easy', products: 'fans',
    rationale: 'Your fan inventory lists 4 regular (75–80W) fans with no BLDC units. Replacing all four with 5-star BLDC (28–35W each) saves ~53% fan power running at 10 hrs/day in Chennai.' },
  { title: 'Check refrigerator door gasket', saving: '₹1,850/yr', cost: '₹1,200', breakeven: '8 months', diff: 'Easy', products: 'gasket',
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

// ── Segments (one platform, three modes — shared identity, registry, tariff engine) ──
const SEGMENTS = [
  { id: 'personal', icon: '🏠', title: 'Personal Home',
    sub: 'For individuals and families',
    points: ['Bill monitoring & Tariff Guard', 'Appliance-level savings coach', 'Solar & upgrade guidance'],
    cta: 'Continue as a home user →', status: 'live' },
  { id: 'society', icon: '🏢', title: 'Housing Society',
    sub: 'For RWAs, societies & apartments',
    points: ['Common-area energy monitoring', 'Pump, lift & DG fuel intelligence', 'Lower maintenance bills for all flats'],
    cta: 'Continue as a society →', status: 'live' },
  { id: 'business', icon: '🏭', title: 'Business',
    sub: 'For offices, retail & enterprises',
    points: ['Multi-site energy visibility', 'Commercial tariff optimisation', 'ESG & compliance reporting'],
    cta: 'Register interest →', status: 'soon' }
];

const SOCIETY_PALETTE = { primary: '#0E6E5C', accent: '#00D4AA' };
const BUSINESS_PALETTE = { primary: '#2C3E68', accent: '#7FA6FF' };

const SOCIETY_ASSETS = [
  { name: 'Water pumps (4)', icon: '💧', share: 31, kw: 13.2, status: 'ok' },
  { name: 'Lifts (8)', icon: '🛗', share: 22, kw: 9.4, status: 'ok' },
  { name: 'Common lighting', icon: '💡', share: 18, kw: 7.7, status: 'ok' },
  { name: 'STP plant', icon: '♻', share: 15, kw: 6.4, status: 'ok' },
  { name: 'Clubhouse & gym', icon: '🏸', share: 9, kw: 3.8, status: 'ok' },
  { name: 'Others', icon: '🔌', share: 5, kw: 2.1, status: 'ok' }
];

const SOCIETY_ALERTS = [
  { sev: 'warn', icon: '⚠', text: 'Tower B booster pump ran 3.4 hrs today vs 1.9 hr average — possible float-valve failure. Est. waste if unfixed: ₹2,100/month.' },
  { sev: 'info', icon: '🕗', text: 'Shifting garden lighting off-time from 6:30 to 6:05 am would save ~₹860/month at current TANGEDCO commercial rates.' }
];

const SOCIETY_HARDWARE = [
  { name: 'Shelly 3EM — mains meter', detail: '3-phase, LT panel room', online: true },
  { name: 'Shelly 1PM ×6 — asset meters', detail: 'Pumps, lifts, lighting circuits', online: true },
  { name: 'Ultrasonic fuel sensor — DG tank', detail: '660 L diesel tank', online: true }
];

// ── Personal-mode hardware (Path B: measured circuits) ──
const AC_TONNAGES = ['1 T', '1.5 T', '2 T'];

const PRODUCTS = {
  fans: {
    title: 'Best BLDC fans for your home',
    context: 'Matched to your inventory: 4 regular ceiling fans, 1200 mm mount. Savings computed at your TANGEDCO marginal rate.',
    items: [
      { name: 'Atomberg Renesa 1200mm BLDC', spec: '28W · 5★ BEE · Remote control', price: '₹3,199', save: 'Saves ~₹1,475/yr vs your 78W fan' },
      { name: 'Crompton Energion HS 1200mm', spec: '35W · 5★ BEE · Remote control', price: '₹3,449', save: 'Saves ~₹1,320/yr vs your 78W fan' },
      { name: 'Havells Ambrose BLDC 1200mm', spec: '32W · 5★ BEE · Remote control', price: '₹3,650', save: 'Saves ~₹1,390/yr vs your 78W fan' }
    ]
  },
  gasket: {
    title: 'Refrigerator gasket replacement',
    context: 'For your frost-free 260–350L refrigerator. Includes OEM-compatible gasket and doorstep fitting.',
    items: [
      { name: 'OEM-compatible door gasket + fitting', spec: 'Urban Company / local service', price: '₹1,100–1,400', save: 'Recovers ~₹1,850/yr in compressor efficiency' }
    ]
  },
  sensors: {
    title: 'Measurement hardware for your circuits',
    context: 'Turns estimates into ±2% measured data. Start with your two heaviest circuits — AC and geyser.',
    items: [
      { name: 'Shelly EM + 50A CT clamp', spec: 'For hardwired circuits (AC, geyser) · Wi-Fi', price: '₹4,200', save: 'Makes one circuit MEASURED' },
      { name: 'Shelly Plug S / Qubo smart plug', spec: 'For plug-in appliances up to 10A · Wi-Fi', price: '₹1,099', save: 'Makes one appliance MEASURED' },
      { name: 'PZEM-004T DIY energy monitor', spec: 'For tinkerers · needs enclosure + electrician', price: '₹850', save: 'Budget single-circuit metering' }
    ]
  }
};

const PAIR_STEPS = [
  { title: 'Choose your hardware', desc: 'CT clamp (Shelly EM) for hardwired circuits like AC and geyser, or a smart plug for plug-in appliances.' },
  { title: 'Install at the distribution board', desc: 'An electrician clamps the CT around that circuit\'s wire — 30–45 min, live panel work. Smart plugs just plug in.' },
  { title: 'Join your Wi-Fi', desc: 'The device pairs once with your 2.4 GHz network, then streams continuously. No further setup.' },
  { title: 'Griha reads it live', desc: 'That circuit flips from ESTIMATED to MEASURED automatically the moment data flows.' }
];

// ═══════════════════════════════════════════════════════════════
// 2. STATE
// ═══════════════════════════════════════════════════════════════

const S = {
  screen: 'mode',
  mode: null,          // personal | society | business
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
    // Per-unit registry (IA §1.2): every AC is an individual record; fans split by type
    fans: { regular: 4, bldc: 0 },
    ac: { units: [
      { tonnage: '1.5 T', stars: 3, inv: true },
      { tonnage: '1.5 T', stars: 3, inv: true }
    ] },
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
  payMethod: 'UPI',

  // Society mode
  societyName: 'Lakshmi Gardens',
  societyCity: 'Chennai',
  societyTowers: 4,
  societyFlats: 96,
  societyTab: 'Dashboard',

  // Business mode
  bizCompany: '',
  bizEmail: '',
  bizDone: false,

  // DPDP consent registry — each category independently granted/revocable
  consents: {
    billing:   { label: 'Billing history fetch', desc: 'Read-only import of your DISCOM billing history', on: true,  ts: '14/05/2026 10:22', ver: 'v1.2' },
    ocr:       { label: 'Bill photo processing', desc: 'OCR extraction from uploaded bill images', on: false, ts: '—', ver: 'v1.2' },
    appliance: { label: 'Appliance inventory', desc: 'Storage of your per-unit appliance records', on: true,  ts: '14/05/2026 10:24', ver: 'v1.2' },
    locality:  { label: 'Locality data', desc: 'Neighbourhood-level peer benchmarking', on: true,  ts: '14/05/2026 10:23', ver: 'v1.2' },
    payment:   { label: 'Payment processing', desc: 'BBPS bill payment via licensed aggregator', on: true,  ts: '14/05/2026 10:25', ver: 'v1.2' },
    whatsapp:  { label: 'WhatsApp communication', desc: 'Alerts and summaries on WhatsApp', on: false, ts: '—', ver: 'v1.2' }
  },

  // Personal-mode hardware (Path B)
  devices: [
    { name: 'Shelly EM — Bedroom AC circuit', type: 'CT clamp · ±2%', online: true },
    { name: 'Qubo smart plug — Geyser', type: 'Smart plug · ±2%', online: true }
  ],
  pairing: false,
  pairStep: 0,

  // Live Shelly connect (self-test): credentials kept in localStorage only
  shelly: { proxy: '', server: '', deviceId: '', authKey: '' },
  shellyBusy: false,
  shellyResult: null
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

function t(key, vars) {
  let s = (I18N[S.language] && I18N[S.language][key]) || I18N_EN[key] || key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
  return s;
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
  let c = (S.city ? CITIES[S.city] : null) || CITIES[S.profileCity] || CITIES.Chennai;
  // Mode-specific palettes: society = teal, business = indigo (shared foundation, distinct identity)
  if (S.mode === 'society' && ['auth', 'societySetup', 'societyApp'].includes(S.screen)) c = { ...c, ...SOCIETY_PALETTE };
  if (S.screen === 'business') c = { ...c, ...BUSINESS_PALETTE };
  let content = '';
  if (S.screen === 'mode') content = screenModeSelect();
  else if (S.screen === 'auth') content = screenAuth();
  else if (S.screen === 'language') content = screenLanguage();
  else if (S.screen === 'onboarding') content = screenOnboarding();
  else if (S.screen === 'societySetup') content = screenSocietySetup();
  else if (S.screen === 'societyApp') content = screenSocietyApp();
  else if (S.screen === 'business') content = screenBusiness();
  else content = screenApp();

  root.innerHTML = `<div class="app" style="--primary:${c.primary};--accent:${c.accent}"><div class="grain"></div>${content}</div>`;
  bind();
  root.querySelectorAll('.stagger-list > *').forEach((el, i) => {
    el.style.animationDelay = `${40 + i * 65}ms`;
  });
}

// ═══════════════════════════════════════════════════════════════
// 4b. MODE SELECT — one platform, three segments
// ═══════════════════════════════════════════════════════════════

function screenModeSelect() {
  return `
  <div class="mode-wrap">
    <div class="auth-glow"></div>
    <div class="auth-brand slide-up">
      <div class="logo-mark">गृ</div>
      <div class="logo-text">
        <span class="logo-name">Griha</span>
        <span class="logo-sub">Home Energy Intelligence for India</span>
      </div>
    </div>
    <h2 class="mode-title slide-up" style="animation-delay:.06s">Who is Griha for today?</h2>
    <p class="mode-sub slide-up" style="animation-delay:.1s">One platform. Same intelligence. Built for how you use energy.</p>
    <div class="mode-grid stagger-list">
      ${SEGMENTS.map(sg => `
        <button class="mode-card glass mode-${sg.id}" data-mode="${sg.id}">
          ${sg.status === 'soon' ? '<span class="mode-soon">Early access</span>' : ''}
          <span class="mode-icon">${sg.icon}</span>
          <span class="mode-name">${sg.title}</span>
          <span class="mode-desc">${sg.sub}</span>
          <ul class="mode-points">
            ${sg.points.map(p => `<li>${p}</li>`).join('')}
          </ul>
          <span class="mode-cta">${sg.cta}</span>
        </button>
      `).join('')}
    </div>
    <p class="auth-footer slide-up" style="animation-delay:.3s">One account · Shared data foundation · Switch anytime</p>
  </div>`;
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
      ${S.mode ? `
        <div class="auth-mode-row">
          <span class="auth-mode-badge">${S.mode === 'society' ? '🏢 Housing Society account' : '🏠 Personal Home account'}</span>
          <button class="link-btn" data-gomode>Change</button>
        </div>
      ` : ''}
      ${!S.otpDone ? (!S.otpSent ? `
        <h2>Sign in or create account</h2>
        <p class="auth-desc">${S.mode === 'society' ? 'Management committee member or society manager mobile/email.' : 'Mobile number or email. No password needed.'}</p>
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
    <p class="unit-hint">Count each type separately — mixed inventories are normal.</p>
    <div class="app-field"><label>Regular fans (75–80W)</label>
      <div class="qty-ctrl">
        <button class="qty-btn" data-fanqty="regular" data-dir="-">−</button>
        <span>${a.fans?.regular ?? 0}</span>
        <button class="qty-btn" data-fanqty="regular" data-dir="+">+</button>
      </div>
    </div>
    <div class="app-field"><label>BLDC fans (28–35W)</label>
      <div class="qty-ctrl">
        <button class="qty-btn" data-fanqty="bldc" data-dir="-">−</button>
        <span>${a.fans?.bldc ?? 0}</span>
        <button class="qty-btn" data-fanqty="bldc" data-dir="+">+</button>
      </div>
    </div>`;
  if (id === 'ac') {
    const units = a.ac?.units || [];
    return `
    <p class="unit-hint">Each AC is tracked individually — tonnage, BEE stars, and inverter type per unit.</p>
    ${units.map((u, i) => `
      <div class="ac-unit">
        <div class="ac-unit-head">
          <b>AC ${i + 1}</b>
          <button class="ac-remove" data-acremove="${i}">Remove</button>
        </div>
        <div class="app-field"><label>Tonnage</label>
          <div class="pill-row">
            ${AC_TONNAGES.map(t => `
              <button class="pill-btn${u.tonnage === t ? ' active' : ''}" data-actonnage="${i}|${t}">${t}</button>
            `).join('')}
          </div>
        </div>
        <div class="app-field"><label>Star rating (BEE)</label>
          <div class="star-row">
            ${[1,2,3,4,5].map(s => `
              <button class="star-btn${u.stars >= s ? ' active' : ''}" data-acstars="${i}|${s}">★</button>
            `).join('')}
          </div>
        </div>
        <div class="app-field"><label>Compressor</label>
          <div class="pill-row">
            <button class="pill-btn${u.inv ? ' active' : ''}" data-acinv="${i}|yes">Inverter</button>
            <button class="pill-btn${!u.inv ? ' active' : ''}" data-acinv="${i}|no">Non-Inverter</button>
          </div>
        </div>
      </div>
    `).join('')}
    ${units.length < 5 ? `<button class="btn-ghost btn-sm" data-acadd>+ Add another AC</button>` : `<p class="unit-hint">Maximum 5 units.</p>`}`;
  }
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
// 7b. SOCIETY MODE — setup + MC dashboard
// ═══════════════════════════════════════════════════════════════

function screenSocietySetup() {
  return `
  <div class="onb-wrap">
    <div class="onb-top">
      <button class="back-btn" data-gomode>‹</button>
      <div class="onb-brand">गृ Griha · Society</div>
      <div class="progress-rail" style="flex:1;max-width:130px"><div class="progress-fill" style="width:60%"></div></div>
    </div>
    <div class="onb-body">
      <h2 class="slide-up">Set up your society.</h2>
      <p class="slide-up" style="animation-delay:.04s">Griha monitors common-area energy — pumps, lifts, lighting, STP, DG — and cuts the maintenance bill every flat shares.</p>
      <div class="field-wrap slide-up" style="animation-delay:.08s">
        <input id="socName" type="text" class="field-input" placeholder="Society name" value="${S.societyName}"/>
      </div>
      <div class="section-label slide-up">City</div>
      <div class="chip-row slide-up" style="animation-delay:.12s">
        ${Object.keys(CITIES).map(n => `
          <button class="chip${S.societyCity === n ? ' active' : ''}" data-soccity="${n}">${n}</button>
        `).join('')}
      </div>
      <div class="soc-nums slide-up" style="animation-delay:.16s">
        <div class="soc-num-field">
          <label>Towers</label>
          <div class="qty-ctrl">
            <button class="qty-btn" data-socqty="towers" data-dir="-">−</button>
            <span>${S.societyTowers}</span>
            <button class="qty-btn" data-socqty="towers" data-dir="+">+</button>
          </div>
        </div>
        <div class="soc-num-field">
          <label>Flats</label>
          <div class="qty-ctrl">
            <button class="qty-btn" data-socqty="flats" data-dir="-">−</button>
            <span>${S.societyFlats}</span>
            <button class="qty-btn" data-socqty="flats" data-dir="+">+</button>
          </div>
        </div>
      </div>
      <div class="insight-card glass slide-up" style="animation-delay:.2s">
        <span class="eyebrow">📦 What gets installed</span>
        <p>One Shelly 3EM mains meter, one Shelly 1PM per major asset, and an ultrasonic fuel sensor on the DG tank. Read-only, non-invasive, installed in under a day.</p>
      </div>
      <button class="btn-primary btn-full slide-up" id="socEnter" style="animation-delay:.24s">Open society dashboard →</button>
      <p class="security-note slide-up">₹15,000 one-time setup · ₹2,500/month · Cancel anytime</p>
    </div>
  </div>`;
}

function screenSocietyApp() {
  const totalKw = SOCIETY_ASSETS.reduce((s, a) => s + a.kw, 0).toFixed(1);
  const perFlat = Math.round(68400 / S.societyFlats);
  return `
  <div class="soc-shell">
    <header class="soc-header" style="background:linear-gradient(180deg,${SOCIETY_PALETTE.primary}42 0%,transparent 100%)">
      <div>
        <div class="hdr-greeting">${S.societyName}</div>
        <div class="hdr-city">${S.societyCity} · ${S.societyTowers} towers · ${S.societyFlats} flats · MC view</div>
      </div>
      <button class="chip" data-gomode>Switch segment</button>
    </header>

    <div class="tab-scroll soc-scroll">

      <!-- Live load -->
      <div class="bill-card glass slide-up">
        <div class="bill-card-left">
          <div class="eyebrow">Common-area live load <span class="live-pulse"></span></div>
          <div class="bill-big">${totalKw} kW</div>
          <div class="bill-meta">Shelly 3EM mains · updated 14 s ago</div>
        </div>
        <div class="soc-month-box">
          <b>₹68,400</b>
          <span>est. common bill this month</span>
          <em>≈ ${inr(perFlat)}/flat</em>
        </div>
      </div>

      <!-- Alerts -->
      ${SOCIETY_ALERTS.map(a => `
        <div class="soc-alert ${a.sev} slide-up">
          <span>${a.icon}</span>
          <p>${a.text}</p>
        </div>
      `).join('')}

      <!-- Asset breakdown -->
      <div class="card glass slide-up">
        <div class="card-hdr"><h3>Asset breakdown</h3><span class="data-src-badge">Shelly 1PM per asset</span></div>
        ${SOCIETY_ASSETS.map(a => `
          <div class="bar-row">
            <span class="bar-lbl">${a.icon} ${a.name}</span>
            <div class="bar-track"><div class="bar-fill" style="width:${a.share * 3}%"></div></div>
            <em>${a.kw} kW</em>
          </div>
        `).join('')}
        <p class="method-note">Live metered values — not estimates. Per-asset circuits metered individually.</p>
      </div>

      <!-- DG fuel -->
      <div class="card glass slide-up">
        <div class="card-hdr"><h3>DG fuel level</h3><span class="data-src-badge">Ultrasonic sensor</span></div>
        <div class="fuel-row">
          <div class="fuel-tank">
            <div class="fuel-fill" style="height:62%"></div>
          </div>
          <div class="fuel-info">
            <b>62% · 410 L</b>
            <span>of 660 L tank</span>
            <em>≈ 11 hrs full-load runtime</em>
            <p>Last refuel 22/06/26 · consumption normal. No pilferage anomaly detected in the last 30 days.</p>
          </div>
        </div>
      </div>

      <!-- Savings -->
      <div class="coach-hero glass slide-up">
        <span class="coach-badge">📉 This quarter</span>
        <h2>₹18,400 saved on common-area energy.</h2>
        <p>Pump scheduling moved to off-peak hours and lift standby optimisation in Towers A and C account for most of it. That's ₹${Math.round(18400 / S.societyFlats)} back per flat this quarter.</p>
      </div>

      <!-- Hardware status -->
      <div class="card glass slide-up">
        <div class="card-hdr"><h3>Hardware status</h3><span class="positive">All online</span></div>
        ${SOCIETY_HARDWARE.map(h => `
          <div class="hw-row">
            <span class="hw-dot ${h.online ? 'on' : 'off'}"></span>
            <div><b>${h.name}</b><span>${h.detail}</span></div>
            <em>${h.online ? 'Online' : 'Offline'}</em>
          </div>
        `).join('')}
      </div>

      <!-- Plan -->
      <div class="card glass slide-up">
        <div class="card-hdr"><h3>Your plan</h3></div>
        <div class="plan-row"><span>Setup (one-time)</span><b>₹15,000</b></div>
        <div class="plan-row"><span>Monitoring SaaS</span><b>₹2,500/month</b></div>
        <div class="plan-row"><span>Payback from savings</span><b class="positive">≈ 4 months</b></div>
        <p class="method-note">Savings this quarter (₹18,400) already exceed two quarters of subscription cost.</p>
      </div>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════
// 7c. BUSINESS MODE — enterprise stub with lead capture
// ═══════════════════════════════════════════════════════════════

function screenBusiness() {
  return `
  <div class="mode-wrap">
    <div class="auth-glow"></div>
    <div class="auth-brand slide-up">
      <div class="logo-mark">गृ</div>
      <div class="logo-text">
        <span class="logo-name">Griha for Business</span>
        <span class="logo-sub">Enterprise energy intelligence</span>
      </div>
    </div>
    <div class="auth-card glass slide-up biz-card" style="animation-delay:.08s">
      ${!S.bizDone ? `
        <span class="mode-soon" style="position:static;display:inline-block;margin-bottom:12px">Coming soon for enterprise</span>
        <h2>Multi-site energy visibility for your business.</h2>
        <ul class="biz-points">
          <li>⚡ Commercial & industrial tariff optimisation across locations</li>
          <li>📊 Single dashboard for offices, retail outlets and plants</li>
          <li>🌱 ESG and BRSR-ready energy & emissions reporting</li>
          <li>🔔 Demand-charge alerts before penalties hit your bill</li>
        </ul>
        <p class="auth-desc">We're onboarding early enterprise partners now. Register and our team will reach out.</p>
        <div class="field-wrap">
          <input id="bizCompany" type="text" class="field-input" placeholder="Company name" value="${S.bizCompany}"/>
        </div>
        <div class="field-wrap">
          <input id="bizEmail" type="text" class="field-input" placeholder="Work email" value="${S.bizEmail}"/>
        </div>
        <button class="btn-primary btn-full" id="bizSubmit">Register interest →</button>
      ` : `
        <div class="success-wrap">
          <div class="success-ring">✓</div>
          <h2>You're on the list.</h2>
          <p>Thanks${S.bizCompany ? ', ' + S.bizCompany : ''} — we'll reach out as enterprise onboarding opens in your region.</p>
        </div>
      `}
      <button class="btn-ghost btn-full" data-gomode>← Back to segments</button>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════
// 8. APP SHELL
// ═══════════════════════════════════════════════════════════════

function screenApp() {
  const c = appCity();
  const tabFns = { Home: tabHome, 'Tariff Guard': tabTariffGuard, History: tabHistory, Coach: tabCoach };
  const ICONS = { Home: '⌂', 'Tariff Guard': '◈', History: '▥', Coach: '✦' };
  const TABKEYS = { Home: 'nav_home', 'Tariff Guard': 'nav_guard', History: 'nav_history', Coach: 'nav_coach' };

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
        ${['Home','Tariff Guard','History','Coach'].map(tb => `
          <button class="snav-item${S.tab === tb ? ' active' : ''}" data-tab="${tb}">
            <span class="snav-icon">${ICONS[tb]}</span>
            <span>${t(TABKEYS[tb])}</span>
            ${tb === 'Tariff Guard' && S.alertActive ? '<span class="snav-dot"></span>' : ''}
          </button>
        `).join('')}
      </nav>
      <div class="sidebar-footer">
        <button class="snav-item" data-sheet="privacy">
          <span class="snav-icon">🛡</span><span>Privacy & consent</span>
        </button>
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
            <div class="hdr-greeting">${t('hi')} ${S.profileName}</div>
            <div class="hdr-city">${S.profileCity} · ${c.discom}</div>
          </div>
          <div class="hdr-right">
            <div class="hdr-bill-amt">${inr(S.billToDate)}</div>
            <div class="hdr-bill-lbl">est. · ${t('days_left', { n: S.daysLeft })}</div>
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
          ${['Home','Tariff Guard','History','Coach'].map(tb => `
            <button class="bnav-item${S.tab === tb ? ' active' : ''}" data-tab="${tb}">
              <span class="bnav-icon">${ICONS[tb]}</span>
              <span class="bnav-label">${t(TABKEYS[tb])}</span>
              ${tb === 'Tariff Guard' && S.alertActive ? '<span class="bnav-dot"></span>' : ''}
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
    ${S.language !== 'English' ? `
      <div class="lang-note slide-up">🌐 ${S.language} interface preview — coach messages ship after native review.</div>
    ` : ''}
    <!-- Bill due card -->
    <div class="bill-card glass slide-up">
      <div class="bill-card-left">
        <div class="eyebrow">${t('bill_to_date')} · est. <button class="info-btn" data-sheet="est-info">ⓘ</button></div>
        <div class="bill-big">${inr(S.billToDate)}</div>
        <div class="bill-meta">${S.units} units · ${t('days_left', { n: S.daysLeft })}</div>
      </div>
      <button class="pay-btn" data-sheet="pay">${t('pay')} ₹4,680</button>
    </div>

    <!-- Score card -->
    <button class="score-card glass slide-up" data-sheet="score">
      <div class="score-visual">
        ${arc(74, 128, 10)}
        <div class="score-num">74</div>
      </div>
      <div class="score-info">
        <div class="eyebrow">${t('hes')}</div>
        <div class="score-line">${t('score_good')}</div>
        <div class="score-save">${t('save_line', { amt: `<strong>${inr(18200)}</strong>` })}</div>
        <div class="score-rank">Top 43% of ${S.profileCity} 3 BHK flats</div>
      </div>
    </button>

    <!-- Consumption breakdown: measured (hardware) vs estimated (inventory) -->
    <div class="card glass slide-up">
      <div class="card-hdr">
        <h3>${t('breakdown')}</h3>
        <button class="info-btn" data-sheet="est-info">ⓘ methodology</button>
      </div>
      ${[
        ['Cooling (ACs)', 52, true],
        ['Water heating', 8, true],
        ['Refrigeration', 13, false],
        ['Fans', 11, false],
        ['Lighting', 7, false],
        ['Standby & others', 9, false]
      ].map(([l, p, measured]) => `
        <div class="bar-row bar-row-src">
          <span class="bar-lbl">${l}</span>
          <div class="bar-track"><div class="bar-fill${measured ? '' : ' bar-est'}" style="width:${p}%"></div></div>
          <span class="src-pill ${measured ? 'measured' : 'estimated'}">${measured ? 'MEASURED' : 'est.'}</span>
          <em>${p}%</em>
        </div>
      `).join('')}
      <p class="method-note">Solid bars come from your installed sensors (±2%). Faded bars are modelled from appliance inventory and bill calibration (±20–30%) — never presented as measurement.</p>
    </div>

    <!-- Hardware & devices -->
    <button class="hw-card glass slide-up" data-sheet="devices">
      <div class="hw-card-left">
        <div class="eyebrow">Hardware · Path B</div>
        <div class="hw-card-line"><b>${S.devices.filter(d => d.online).length} devices online</b> · 60% of your bill is measured, not estimated</div>
        <div class="hw-card-sub">Shelly EM on AC circuit · smart plug on geyser</div>
      </div>
      <span class="hw-card-cta">Manage →</span>
    </button>

    <!-- Trend + quick stats -->
    <div class="card glass slide-up">
      <div class="card-hdr">
        <h3>${t('trend')}</h3>
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
        <h3>${t('modules')}</h3>
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

    <!-- Privacy entry (DPDP) -->
    <button class="privacy-entry glass slide-up" data-sheet="privacy">
      <span>🛡</span>
      <div><b>Privacy & consent</b><em>6 consent categories · DPDP Act 2023 · independently revocable</em></div>
      <span class="hw-card-cta">→</span>
    </button>
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
      <h2>${t('guard_title')}</h2>
      <div class="guard-metrics">
        <div class="gm"><b>${S.units}</b><span>${t('m_units')}</span></div>
        <div class="gm"><b>${S.daysLeft}</b><span>${t('m_days')}</span></div>
        <div class="gm"><b>${S.projected}</b><span>${t('m_proj')}</span></div>
        <div class="gm"><b>${S.projected - thresh}</b><span>${t('m_thresh')}</span></div>
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
              ${item.products ? `
                <button class="btn-ghost" data-sheet="products:${item.products}">I'm ready — show me the best options</button>
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
    <h3>Measured vs estimated</h3>
    <p><strong style="color:#2FCBA3">MEASURED</strong> circuits have a CT clamp or smart plug installed — real readings, accurate to roughly ±2%.</p>
    <p><strong style="color:#F2A93B">Estimated</strong> circuits are modelled from your appliance inventory (BEE ratings × wattage × usage hours), calibrated against your actual monthly bill — typically ±20–30%. An estimate is never presented as a measurement.</p>
    <p>Install a sensor on any circuit and it flips to MEASURED automatically.</p>
    <button class="btn-primary" data-sheet="devices">See my devices →</button>
    <button class="btn-ghost btn-full" data-close>Understood</button>`);

  if (S.sheet === 'privacy') return wrap(`
    <h2>Privacy & consent</h2>
    <p>DPDP Act 2023: each data category has its own consent, recorded with a timestamp and notice version, and independently revocable. Revoking stops processing for that category without affecting the rest.</p>
    ${Object.entries(S.consents).map(([k, cs]) => `
      <div class="consent-row">
        <div class="consent-info">
          <b>${cs.label}</b>
          <span>${cs.desc}</span>
          <em>${cs.on ? `Granted ${cs.ts} · notice ${cs.ver}` : 'Not granted'}</em>
        </div>
        <button class="toggle${cs.on ? ' on' : ''}" data-consent="${k}"><span class="knob"></span></button>
      </div>
    `).join('')}
    <div class="privacy-links">
      <p><strong>Your rights:</strong> access, correction, erasure, and grievance redressal under the DPDP Act 2023.</p>
      <p><strong>Grievance officer:</strong> grievance@griha.app · response within 7 days.</p>
      <p><strong>Data:</strong> encrypted at rest (AES-256) and in transit (TLS 1.3). Deleting your account erases all personal data within 30 days.</p>
    </div>
    <button class="btn-ghost btn-full danger-btn">Delete my account & data</button>`);

  if (S.sheet === 'devices') return wrap(`
    <h2>Your hardware</h2>
    <p>Griha is a hardware-software combination. Sensors turn ±20–30% estimates into ±2% measurements — circuit by circuit.</p>
    ${S.devices.map(d => `
      <div class="hw-row">
        <span class="hw-dot ${d.online ? 'on' : 'off'}"></span>
        <div><b>${d.name}</b><span>${d.type}</span></div>
        <em>${d.online ? 'Online' : 'Offline'}</em>
      </div>
    `).join('')}
    ${!S.pairing ? `
      <button class="btn-primary btn-full" data-pairstart>+ Connect a new device</button>
      <div class="path-compare">
        <div class="path-col">
          <span class="src-pill estimated">est.</span>
          <b>Path A — Inventory</b>
          <span>₹0 hardware · ±20–30% · static until you edit</span>
        </div>
        <div class="path-col">
          <span class="src-pill measured">MEASURED</span>
          <b>Path B — Sensors</b>
          <span>₹1,000–4,200/circuit · ±2% · real-time</span>
        </div>
      </div>
      <p class="method-note">Practical default: keep everything on Path A (free, day one) and upgrade your 2–3 heaviest circuits — AC, geyser, pump — to Path B. Small loads rarely justify the hardware spend.</p>
      <button class="btn-ghost btn-full" data-sheet="products:sensors">See recommended sensors →</button>
    ` : `
      <div class="pair-wizard">
        <h3>Connecting your device — step ${S.pairStep + 1} of ${PAIR_STEPS.length}</h3>
        ${PAIR_STEPS.map((st, i) => `
          <div class="pair-step${i < S.pairStep ? ' done' : i === S.pairStep ? ' current' : ''}">
            <span class="pair-num">${i < S.pairStep ? '✓' : i + 1}</span>
            <div><b>${st.title}</b><p>${st.desc}</p></div>
          </div>
        `).join('')}
        ${S.pairStep < PAIR_STEPS.length - 1
          ? `<button class="btn-primary btn-full" data-pairnext>Next →</button>`
          : `<button class="btn-primary btn-full" data-pairdone>Device connected ✓</button>`}
        <button class="btn-ghost btn-full" data-paircancel>Cancel</button>
      </div>
    `}
    <div class="shelly-connect">
      <h3>Live connect — test with your own Shelly</h3>
      <p class="unit-hint">Enter your Shelly Cloud credentials (Shelly app → Settings → Authorization cloud key). Browsers block direct calls to Shelly Cloud, so a free relay is needed — see <code>docs/shelly-proxy-worker.js</code> in the repo for a 10-minute Cloudflare Worker setup.</p>
      <input class="field-input shelly-field" id="shProxy" placeholder="Relay URL (your Cloudflare Worker)" value="${S.shelly.proxy}"/>
      <input class="field-input shelly-field" id="shServer" placeholder="Shelly server, e.g. https://shelly-56-eu.shelly.cloud" value="${S.shelly.server}"/>
      <input class="field-input shelly-field" id="shDevice" placeholder="Device ID" value="${S.shelly.deviceId}"/>
      <input class="field-input shelly-field" id="shKey" type="password" placeholder="Cloud auth key" value="${S.shelly.authKey}"/>
      <button class="btn-primary btn-full" data-shellytest ${S.shellyBusy ? 'disabled' : ''}>${S.shellyBusy ? 'Connecting…' : 'Test live connection'}</button>
      ${S.shellyResult ? `
        <div class="shelly-result ${S.shellyResult.ok ? 'ok' : 'err'}">
          ${S.shellyResult.ok
            ? `✓ Live! Current power: <b>${S.shellyResult.power} W</b> — this device can now feed your MEASURED circuits.`
            : `✕ ${S.shellyResult.error}`}
        </div>
      ` : ''}
    </div>`);

  if (S.sheet?.startsWith('products:')) {
    const cat = PRODUCTS[S.sheet.split(':')[1]];
    if (cat) return wrap(`
      <h2>${cat.title}</h2>
      <p>${cat.context}</p>
      ${cat.items.map(p => `
        <div class="prod-card glass">
          <div class="prod-info">
            <b>${p.name}</b>
            <span>${p.spec}</span>
            <em>${p.save}</em>
          </div>
          <div class="prod-buy">
            <span class="prod-price">${p.price}</span>
            <div class="prod-links">
              <button class="prod-link">Amazon ↗</button>
              <button class="prod-link">Flipkart ↗</button>
            </div>
          </div>
        </div>
      `).join('')}
      <p class="affiliate-note">You buy on the retailer's site at their price — payment happens there, not in Griha. Griha earns a small commission at no extra cost to you, only when you arrive from this screen. We never rank products by commission.</p>`);
  }

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
  // Segment selection
  root.querySelectorAll('[data-mode]').forEach(el => {
    el.onclick = () => {
      const m = el.dataset.mode;
      if (m === 'business') set({ mode: 'business', screen: 'business', bizDone: false });
      else set({ mode: m, screen: 'auth', otpSent: false, otpDone: false, otpDigits: ['','','','','',''], authInput: '' });
    };
  });

  // Back to segment picker
  root.querySelectorAll('[data-gomode]').forEach(el => {
    el.onclick = () => set({ screen: 'mode', mode: null });
  });

  // Society setup
  const socName = root.querySelector('#socName');
  if (socName) socName.addEventListener('input', e => { S.societyName = e.target.value; });
  root.querySelectorAll('[data-soccity]').forEach(el => {
    el.onclick = () => set({ societyCity: el.dataset.soccity });
  });
  root.querySelectorAll('[data-socqty]').forEach(el => {
    el.onclick = () => {
      const dir = el.dataset.dir === '+' ? 1 : -1;
      if (el.dataset.socqty === 'towers') set({ societyTowers: Math.max(1, S.societyTowers + dir) });
      else set({ societyFlats: Math.max(4, S.societyFlats + dir * 4) });
    };
  });
  root.querySelector('#socEnter')?.addEventListener('click', () => set({ screen: 'societyApp' }));

  // Business lead capture
  const bizCompany = root.querySelector('#bizCompany');
  if (bizCompany) bizCompany.addEventListener('input', e => { S.bizCompany = e.target.value; });
  const bizEmail = root.querySelector('#bizEmail');
  if (bizEmail) bizEmail.addEventListener('input', e => { S.bizEmail = e.target.value; });
  root.querySelector('#bizSubmit')?.addEventListener('click', () => set({ bizDone: true }));

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
  root.querySelector('#submitName')?.addEventListener('click', () => {
    if (S.mode === 'society') set({ screen: 'societySetup' });
    else set({ screen: 'language' });
  });

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

  // Fan counts per type (regular / BLDC)
  root.querySelectorAll('[data-fanqty]').forEach(el => {
    el.onclick = e => {
      e.stopPropagation();
      const key = el.dataset.fanqty, dir = el.dataset.dir === '+' ? 1 : -1;
      const fans = { ...S.appliances.fans };
      fans[key] = Math.max(0, (fans[key] || 0) + dir);
      S.appliances = { ...S.appliances, fans };
      render();
    };
  });

  // Per-unit AC controls
  const acUnits = () => (S.appliances.ac?.units || []).map(u => ({ ...u }));
  root.querySelectorAll('[data-actonnage]').forEach(el => {
    el.onclick = e => {
      e.stopPropagation();
      const [i, t] = el.dataset.actonnage.split('|');
      const units = acUnits(); units[+i].tonnage = t;
      S.appliances = { ...S.appliances, ac: { units } };
      render();
    };
  });
  root.querySelectorAll('[data-acstars]').forEach(el => {
    el.onclick = e => {
      e.stopPropagation();
      const [i, s] = el.dataset.acstars.split('|');
      const units = acUnits(); units[+i].stars = +s;
      S.appliances = { ...S.appliances, ac: { units } };
      render();
    };
  });
  root.querySelectorAll('[data-acinv]').forEach(el => {
    el.onclick = e => {
      e.stopPropagation();
      const [i, v] = el.dataset.acinv.split('|');
      const units = acUnits(); units[+i].inv = v === 'yes';
      S.appliances = { ...S.appliances, ac: { units } };
      render();
    };
  });
  root.querySelectorAll('[data-acremove]').forEach(el => {
    el.onclick = e => {
      e.stopPropagation();
      const units = acUnits(); units.splice(+el.dataset.acremove, 1);
      S.appliances = { ...S.appliances, ac: { units } };
      render();
    };
  });
  root.querySelector('[data-acadd]')?.addEventListener('click', e => {
    e.stopPropagation();
    const units = acUnits();
    if (units.length < 5) units.push({ tonnage: '1.5 T', stars: 3, inv: true });
    S.appliances = { ...S.appliances, ac: { units } };
    render();
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

  // Restart onboarding from segment picker
  root.querySelector('#restartOnb')?.addEventListener('click', () => {
    set({ screen: 'mode', mode: null, otpSent: false, otpDone: false, otpDigits: ['','','','','',''], authInput: '', city: null, step: 0 });
  });

  // City switcher (right panel + sidebar)
  root.querySelectorAll('[data-switchcity]').forEach(el => {
    el.onclick = () => set({ profileCity: el.dataset.switchcity });
  });

  // Payment method
  root.querySelectorAll('[data-pm]').forEach(el => {
    el.onclick = e => { e.stopPropagation(); set({ payMethod: el.dataset.pm }); };
  });

  // DPDP consent toggles
  root.querySelectorAll('[data-consent]').forEach(el => {
    el.onclick = () => {
      const k = el.dataset.consent;
      const cs = { ...S.consents };
      const now = new Date();
      const stamp = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      cs[k] = { ...cs[k], on: !cs[k].on, ts: !cs[k].on ? stamp : cs[k].ts };
      set({ consents: cs });
    };
  });

  // Shelly live connect — real fetch against user's own device
  ['shProxy','shServer','shDevice','shKey'].forEach(id => {
    const el = root.querySelector('#' + id);
    if (el) el.addEventListener('input', e => {
      const map = { shProxy: 'proxy', shServer: 'server', shDevice: 'deviceId', shKey: 'authKey' };
      S.shelly = { ...S.shelly, [map[id]]: e.target.value.trim() };
      try { localStorage.setItem('griha_shelly', JSON.stringify(S.shelly)); } catch {}
    });
  });
  root.querySelector('[data-shellytest]')?.addEventListener('click', async () => {
    const sh = S.shelly;
    if (!sh.deviceId || !sh.authKey || !(sh.proxy || sh.server)) {
      set({ shellyResult: { ok: false, error: 'Fill in device ID, auth key, and a server or relay URL.' } });
      return;
    }
    set({ shellyBusy: true, shellyResult: null });
    try {
      const base = (sh.proxy || sh.server).replace(/\/$/, '');
      const res = await fetch(base + '/device/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `id=${encodeURIComponent(sh.deviceId)}&auth_key=${encodeURIComponent(sh.authKey)}`
      });
      const j = await res.json();
      const ds = j?.data?.device_status || {};
      // Gen1 (Shelly EM): emeters[].power · Gen2 (Plus/Pro): switch:0.apower or em:0
      const power =
        ds.emeters?.[0]?.power ??
        ds['switch:0']?.apower ??
        ds['em:0']?.total_act_power ??
        ds.meters?.[0]?.power;
      if (power === undefined) throw new Error('Connected, but no power reading found in response.');
      set({ shellyBusy: false, shellyResult: { ok: true, power: Math.round(power * 10) / 10 } });
    } catch (err) {
      const cors = String(err).includes('Failed to fetch');
      set({ shellyBusy: false, shellyResult: { ok: false, error: cors
        ? 'Request blocked (CORS or network). Deploy the relay from docs/shelly-proxy-worker.js and put its URL in the Relay field.'
        : 'Connection failed: ' + (err.message || err) } });
    }
  });

  // Device pairing wizard
  root.querySelector('[data-pairstart]')?.addEventListener('click', () => set({ pairing: true, pairStep: 0 }));
  root.querySelector('[data-pairnext]')?.addEventListener('click', () => set({ pairStep: S.pairStep + 1 }));
  root.querySelector('[data-paircancel]')?.addEventListener('click', () => set({ pairing: false, pairStep: 0 }));
  root.querySelector('[data-pairdone]')?.addEventListener('click', () => {
    set({
      devices: [...S.devices, { name: 'Shelly 1PM — Refrigerator circuit', type: 'CT clamp · ±2%', online: true }],
      pairing: false, pairStep: 0
    });
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

try {
  const saved = localStorage.getItem('griha_shelly');
  if (saved) S.shelly = { ...S.shelly, ...JSON.parse(saved) };
} catch {}

render();
