import { useEffect, useMemo, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';
const MEASUREMENTS = [
  { key: 'nitrogen', en: 'Nitrogen (N)', te: 'నైట్రోజన్ (N)', unit: 'kg/ha', min: 0, max: 300, step: 1 },
  { key: 'phosphorus', en: 'Phosphorus (P)', te: 'ఫాస్ఫరస్ (P)', unit: 'kg/ha', min: 0, max: 300, step: 1 },
  { key: 'potassium', en: 'Potassium (K)', te: 'పొటాషియం (K)', unit: 'kg/ha', min: 0, max: 300, step: 1 },
  { key: 'temperature', en: 'Average temperature', te: 'సగటు ఉష్ణోగ్రత', unit: '°C', min: -10, max: 60, step: 0.1 },
  { key: 'humidity', en: 'Humidity', te: 'తేమ', unit: '%', min: 0, max: 100, step: 0.1 },
  { key: 'ph', en: 'Soil pH', te: 'నేల pH', unit: '0–14', min: 0, max: 14, step: 0.1 },
  { key: 'rainfall', en: 'Seasonal rainfall', te: 'కాలానుగుణ వర్షపాతం', unit: 'mm', min: 0, max: 5000, step: 1 },
];

const COPY = {
  en: {
    navHow: 'How it works', navAbout: 'About the project', language: 'తెలుగు',
    eyebrow: 'FARMER-FIRST CROP INTELLIGENCE', heroTitle: 'A better harvest starts with', heroAccent: 'understanding your field.',
    heroText: 'Describe your farmland in your own words. Review the measurements we can identify, fill in what is missing, then explore a model-based crop shortlist.',
    start: 'Analyze my field', method: 'A transparent, three-step process', note: 'No guessed soil values. Your measurements stay in your hands.',
    step1: 'Tell your story', step1Text: 'Describe your soil, weather and farm conditions naturally.',
    step2: 'Review the facts', step2Text: 'Check extracted values and enter every missing measurement.',
    step3: 'Explore a shortlist', step3Text: 'Get a ranked result from a model trained on your supplied dataset.',
    workspace: 'FIELD ANALYSIS', workspaceTitle: 'Let’s understand your land', workspaceText: 'Start with what you know. You can edit every extracted value before recommendations are requested.',
    languageLabel: 'Interface language', english: 'English', telugu: 'తెలుగు', describe: 'Describe your field', placeholder: 'For example: My soil test shows nitrogen 80, phosphorus 40, potassium 35, pH 6.5. The average temperature is 26 C, humidity 70%, and seasonal rainfall is about 620 mm…',
    analyze: 'Extract field details', analyzing: 'Reading your description…', required: 'Please enter a description first.',
    narrativeNote: 'Narrative extraction currently supports English only. Telugu labels and guidance are translated; Telugu narrative extraction is not yet implemented.',
    review: 'Review extracted details', reviewText: 'Values found in your description are prefilled. Confirm them against your soil test or local measurements.',
    manualStart: 'Enter measurements directly', measured: 'MEASURED INPUTS', extracted: 'from your narrative', manual: 'please enter', units: 'Enter measured values within the displayed ranges. Season and field categories are optional context; the trained model uses the seven numeric values.',
    context: 'Soil, season and water', soil: 'Type of soil', water: 'Water abundance', rainfallLevel: 'Rainfall pattern', season: 'Growing season', notFound: 'Choose an option', choose: 'Select…',
    confirm: 'I reviewed and confirm these measurements.', recommend: 'Get crop shortlist', recommending: 'Checking the trained model…',
    confirmFirst: 'Complete and confirm all seven measurements to continue.', result: 'YOUR MODEL RESULTS', resultTitle: 'Crop shortlist', voteShare: 'tree vote share', confidenceNote: 'Vote share is not a calibrated probability or yield guarantee. Local agronomic advice is still important.',
    basedOn: 'Based on the measurements you confirmed and the supplied training dataset.', noResult: 'Recommendations appear here after a successful model response.',
    backendOffline: 'Could not reach the API. Start the Flask backend and try again.', analyzeFailure: 'Could not analyze the description. Please try again.', modelMissing: 'The model is not trained yet. Add your crop dataset, train the model, then retry.',
    apiOnline: 'API connected', apiOffline: 'API not connected', aboutEyebrow: 'ABOUT THIS PROJECT', aboutTitle: 'Natural language in. Evidence-led shortlist out.',
    aboutText: 'Fieldwise is a student project prototype combining conservative English keyword extraction with a Random Forest trained on the project’s crop dataset. It asks for missing measurements instead of silently filling them in.',
    techTitle: 'Built with', techText: 'React · Flask · Python · Pandas · scikit-learn · Random Forest · NLTK tokenization',
    dataTitle: 'About the data', dataText: 'The crop dataset is supplied by the project owner and must be inspected before training. Narrative examples are clearly marked synthetic and are not used to train the crop classifier. Model accuracy is reported only after a real dataset has been evaluated.',
    reset: 'Start over', footer: 'A college project prototype · Validate results with local agricultural experts.',
  },
  te: {
    navHow: 'విధానం', navAbout: 'ప్రాజెక్ట్ గురించి', language: 'English',
    eyebrow: 'రైతు-కేంద్రిత పంట సూచన', heroTitle: 'మంచి పంటకు మొదలు', heroAccent: 'మీ పొలాన్ని అర్థం చేసుకోవడం.',
    heroText: 'మీ పొలం పరిస్థితులను మీ మాటల్లో వివరించండి. గుర్తించిన కొలతలను పరిశీలించి, లేని వివరాలను నమోదు చేసిన తర్వాత మోడల్ ఆధారిత పంటల జాబితాను చూడండి.',
    start: 'నా పొలాన్ని విశ్లేషించండి', method: 'పారదర్శకమైన మూడు దశల ప్రక్రియ', note: 'నేల విలువలను ఊహించము. కొలతలు మీ నియంత్రణలోనే ఉంటాయి.',
    step1: 'మీ పొలం వివరించండి', step1Text: 'నేల, వాతావరణం, వ్యవసాయ పరిస్థితులను సహజంగా వివరించండి.',
    step2: 'వివరాలు పరిశీలించండి', step2Text: 'గుర్తించిన విలువలను తనిఖీ చేసి, లేని కొలతలను నమోదు చేయండి.',
    step3: 'పంటల జాబితా చూడండి', step3Text: 'మీరు అందించిన డేటాతో శిక్షణ పొందిన మోడల్ ఫలితాలను చూడండి.',
    workspace: 'పొలం విశ్లేషణ', workspaceTitle: 'మీ నేలను అర్థం చేసుకుందాం', workspaceText: 'మీకు తెలిసిన వివరాలతో ప్రారంభించండి. సూచనలకు ముందు గుర్తించిన విలువలను సవరించవచ్చు.',
    languageLabel: 'ఇంటర్‌ఫేస్ భాష', english: 'English', telugu: 'తెలుగు', describe: 'మీ పొలాన్ని వివరించండి', placeholder: 'ఉదాహరణ: నా నేల పరీక్షలో నైట్రోజన్ 80, ఫాస్ఫరస్ 40, పొటాషియం 35, pH 6.5 ఉన్నాయి. సగటు ఉష్ణోగ్రత 26 C, తేమ 70%, కాలానుగుణ వర్షపాతం సుమారు 620 mm…',
    analyze: 'పొలం వివరాలను గుర్తించండి', analyzing: 'వివరణను పరిశీలిస్తున్నాం…', required: 'ముందుగా మీ పొలం వివరణను నమోదు చేయండి.',
    narrativeNote: 'వివరణ నుంచి వివరాలను గుర్తించడం ప్రస్తుతం ఆంగ్లంలో మాత్రమే పనిచేస్తుంది. తెలుగు ఇంటర్‌ఫేస్ అందుబాటులో ఉంది; తెలుగు వివరణల గుర్తింపు ఇంకా అమలు కాలేదు.',
    review: 'గుర్తించిన వివరాలను పరిశీలించండి', reviewText: 'వివరణలో దొరికిన విలువలు ముందుగా నింపబడ్డాయి. నేల పరీక్ష లేదా స్థానిక కొలతలతో సరిపోల్చండి.',
    manualStart: 'కొలతలను నేరుగా నమోదు చేయండి', measured: 'కొలతల నమోదు', extracted: 'వివరణ నుంచి గుర్తించబడింది', manual: 'నమోదు చేయండి', units: 'చూపిన పరిధిలో కొలిచిన విలువలను నమోదు చేయండి. కాలం, పొలం వర్గాలు ఐచ్ఛిక వివరాలు; మోడల్ ఏడు సంఖ్యా విలువలనే ఉపయోగిస్తుంది.',
    context: 'నేల, కాలం మరియు నీరు', soil: 'నేల రకం', water: 'నీటి సమృద్ధి', rainfallLevel: 'వర్షపాతం తీరు', season: 'పంట కాలం', notFound: 'ఎంపిక చేయండి', choose: 'ఎంచుకోండి…',
    confirm: 'ఈ కొలతలను పరిశీలించి నిర్ధారించాను.', recommend: 'పంటల జాబితా పొందండి', recommending: 'శిక్షణ పొందిన మోడల్‌ను పరిశీలిస్తున్నాం…',
    confirmFirst: 'కొనసాగించడానికి ఏడు కొలతలన్నీ నమోదు చేసి నిర్ధారించండి.', result: 'మోడల్ ఫలితాలు', resultTitle: 'సూచించిన పంటల జాబితా', voteShare: 'చెట్ల ఓట్ల వాటా', confidenceNote: 'ఓట్ల వాటా ఖచ్చితమైన సంభావ్యత కాదు; దిగుబడి హామీ కూడా కాదు. స్థానిక వ్యవసాయ నిపుణుల సలహా ముఖ్యం.',
    basedOn: 'మీరు నిర్ధారించిన కొలతలు మరియు అందించిన శిక్షణ డేటా ఆధారంగా.', noResult: 'మోడల్ నుంచి ఫలితం వచ్చిన తర్వాత పంటల సూచనలు ఇక్కడ కనిపిస్తాయి.',
    backendOffline: 'APIని సంప్రదించలేకపోయాం. Flask backend ప్రారంభించి మళ్లీ ప్రయత్నించండి.', analyzeFailure: 'వివరణను విశ్లేషించలేకపోయాం. మళ్లీ ప్రయత్నించండి.', modelMissing: 'మోడల్ ఇంకా శిక్షణ పొందలేదు. పంటల డేటాసెట్‌ను జోడించి, మోడల్‌కు శిక్షణ ఇచ్చి మళ్లీ ప్రయత్నించండి.',
    apiOnline: 'API అనుసంధానమైంది', apiOffline: 'API అనుసంధానం లేదు', aboutEyebrow: 'ప్రాజెక్ట్ గురించి', aboutTitle: 'సహజ భాష నుంచి ఆధారాలతో కూడిన పంటల జాబితా వరకు.',
    aboutText: 'Fieldwise అనేది విద్యార్థుల ప్రాజెక్ట్ నమూనా. ఇది జాగ్రత్తగా రూపొందించిన ఆంగ్ల కీవర్డ్ గుర్తింపును, పంటల డేటాసెట్‌తో శిక్షణ పొందిన Random Forest మోడల్‌ను కలుపుతుంది. లేని కొలతలను ఊహించకుండా వినియోగదారుని అడుగుతుంది.',
    techTitle: 'సాంకేతికత', techText: 'React · Flask · Python · Pandas · scikit-learn · Random Forest · NLTK tokenization',
    dataTitle: 'డేటా వివరాలు', dataText: 'శిక్షణకు ముందు ప్రాజెక్ట్ యజమాని అందించే పంటల డేటాసెట్‌ను పరిశీలించాలి. కథనాల ఉదాహరణలు synthetic అని స్పష్టంగా గుర్తించబడ్డాయి; పంటల వర్గీకరణ శిక్షణలో అవి ఉపయోగించబడవు. నిజమైన డేటాసెట్‌పై పరీక్షించిన తర్వాతే ఖచ్చితత్వం చూపబడుతుంది.',
    reset: 'మళ్లీ ప్రారంభించండి', footer: 'కళాశాల ప్రాజెక్ట్ నమూనా · స్థానిక వ్యవసాయ నిపుణులతో ఫలితాలను నిర్ధారிக்கவும்.',
  },
};

function formatValue(value) {
  if (value === null || value === undefined || value === '') return null;
  return String(value);
}

export default function App() {
  const [language, setLanguage] = useState('en');
  const [description, setDescription] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [values, setValues] = useState({});
  const [contextValues, setContextValues] = useState({});
  const [confirmed, setConfirmed] = useState(false);
  const [results, setResults] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [apiOnline, setApiOnline] = useState(false);
  const t = COPY[language];

  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then((response) => setApiOnline(response.ok))
      .catch(() => setApiOnline(false));
  }, []);

  useEffect(() => {
    if (analysis) {
      document.getElementById('review')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [analysis]);

  const complete = useMemo(() => MEASUREMENTS.every(({ key, min, max }) => {
    const value = Number(values[key]);
    return values[key] !== '' && values[key] !== null && values[key] !== undefined && Number.isFinite(value) && value >= min && value <= max;
  }), [values]);

  async function analyzeField(event) {
    event.preventDefault();
    setError('');
    setResults(null);
    if (!description.trim()) {
      setError(t.required);
      return;
    }
    setBusy('analyze');
    try {
      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: description.trim(), language }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || t.analyzeFailure);
      setAnalysis(payload);
      setValues(Object.fromEntries(MEASUREMENTS.map(({ key }) => [key, formatValue(payload.extracted?.[key])])));
      setContextValues(Object.fromEntries([
        ['soil_type', payload.extracted?.soil_type],
        ['water_availability', payload.extracted?.water_availability],
        ['rainfall_level', payload.extracted?.rainfall_level],
        ['season', payload.extracted?.season],
      ]));
      setConfirmed(false);
    } catch (requestError) {
      setError(requestError.message === 'Failed to fetch' ? t.backendOffline : t.analyzeFailure);
    } finally {
      setBusy('');
    }
  }

  async function requestRecommendations() {
    setError('');
    if (!complete || !confirmed) {
      setError(t.confirmFirst);
      return;
    }
    setBusy('recommend');
    setResults(null);
    try {
      const response = await fetch(`${API_BASE}/api/recommend`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: Object.fromEntries(MEASUREMENTS.map(({ key }) => [key, Number(values[key])])) }),
      });
      const payload = await response.json();
      if (!response.ok) {
        if (payload.code === 'model_unavailable') throw new Error(t.modelMissing);
        throw new Error(payload.error || t.backendOffline);
      }
      setResults(payload);
    } catch (requestError) {
      setError(requestError.message === 'Failed to fetch' ? t.backendOffline : requestError.message);
    } finally {
      setBusy('');
    }
  }

  function updateValue(key, value) {
    setValues((current) => ({ ...current, [key]: value }));
    setConfirmed(false);
    setResults(null);
  }

  function reset() {
    setDescription(''); setAnalysis(null); setValues({}); setContextValues({}); setConfirmed(false); setResults(null); setError('');
  }

  const contextFields = [
    ['soil_type', t.soil], ['water_availability', t.water], ['rainfall_level', t.rainfallLevel], ['season', t.season],
  ];
  const contextOptions = {
    soil_type: [['sandy', 'Sandy', 'ఇసుక'], ['clay', 'Clay', 'బంకమట్టి'], ['loamy', 'Loamy', 'లోమీ'], ['silt', 'Silt', 'సిల్ట్'], ['black', 'Black soil', 'నల్ల నేల'], ['red', 'Red soil', 'ఎర్ర నేల']],
    water_availability: [['low', 'Low', 'తక్కువ'], ['medium', 'Moderate', 'మధ్యస్థం'], ['high', 'High', 'ఎక్కువ']],
    rainfall_level: [['low', 'Low', 'తక్కువ'], ['medium', 'Moderate', 'మధ్యస్థం'], ['high', 'High', 'ఎక్కువ']],
    season: [['kharif', 'Kharif', 'ఖరీఫ్'], ['rabi', 'Rabi', 'రబీ'], ['summer', 'Summer', 'వేసవి'], ['monsoon', 'Monsoon', 'వర్షాకాలం']],
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Fieldwise home"><span className="brand-mark">f</span><span>fieldwise<span className="brand-dot">.</span></span></a>
        <nav className="nav-links" aria-label="Main navigation"><a href="#process">{t.navHow}</a><a href="#about">{t.navAbout}</a></nav>
        <div className="top-actions">
          <span className={`api-status ${apiOnline ? 'online' : ''}`}><i />{apiOnline ? t.apiOnline : t.apiOffline}</span>
          <button className="language-switch" onClick={() => setLanguage(language === 'en' ? 'te' : 'en')} aria-label={`Switch language to ${t.language}`}>{t.language}</button>
        </div>
      </header>

      <main id="top">
        <section className="hero section-wrap">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-line" />{t.eyebrow}</div>
            <h1>{t.heroTitle}<br /><em>{t.heroAccent}</em></h1>
            <p className="hero-text">{t.heroText}</p>
            <a className="primary-button hero-button" href="#analyzer">{t.start}<span aria-hidden="true">↗</span></a>
            <div className="trust-note"><span className="check-icon">✓</span>{t.note}</div>
          </div>
          <div className="hero-art" aria-label="Illustration of healthy crop fields">
            <div className="sun-glow" /><div className="art-label"><span className="pulse-dot" /> FIELD NOTES <b>01 / 03</b></div>
            <div className="hill hill-back" /><div className="hill hill-mid" /><div className="hill hill-front" />
            <div className="plant plant-one"><i /><b /><span /></div><div className="plant plant-two"><i /><b /><span /></div><div className="plant plant-three"><i /><b /><span /></div>
            <div className="art-caption"><span>GROW WITH<br />CONFIDENCE</span><span className="caption-arrow">↗</span></div>
          </div>
        </section>

        <section className="process-section" id="process">
          <div className="section-wrap">
            <div className="section-heading"><div><div className="eyebrow">{t.workspace}</div><h2>{t.method}</h2></div><p>{t.note}</p></div>
            <div className="steps-grid">
              {[["01", t.step1, t.step1Text, '✳'], ["02", t.step2, t.step2Text, '⌕'], ["03", t.step3, t.step3Text, '↗']].map(([number, title, text, icon]) => (
                <article className="step-card" key={number}><div className="step-top"><span>{number}</span><b aria-hidden="true">{icon}</b></div><h3>{title}</h3><p>{text}</p></article>
              ))}
            </div>
          </div>
        </section>

        <section className="analyzer-section section-wrap" id="analyzer">
          <div className="analyzer-intro"><div className="eyebrow"><span className="eyebrow-line" />{t.workspace}</div><h2>{t.workspaceTitle}</h2><p>{t.workspaceText}</p>
            <a className="manual-entry-button" href="#review">{t.manualStart} <span aria-hidden="true">→</span></a>
            <div className="language-card"><span className="language-icon">文</span><div><b>{t.languageLabel}</b><small>{language === 'en' ? 'English interface' : 'తెలుగు ఇంటర్‌ఫేస్'}</small></div><div className="language-pills"><button className={language === 'en' ? 'selected' : ''} onClick={() => setLanguage('en')}>{t.english}</button><button className={language === 'te' ? 'selected' : ''} onClick={() => setLanguage('te')}>{t.telugu}</button></div></div>
          </div>
          <div className="work-card">
            <form onSubmit={analyzeField}>
              <label className="field-label" htmlFor="description">{t.describe}<span>01 — NARRATIVE</span></label>
              <textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={5000} placeholder={t.placeholder} />
              <div className="textarea-foot"><span>{t.narrativeNote}</span><small>{description.length}/5000</small></div>
              <div className="form-actions"><button className="primary-button" type="submit" disabled={busy === 'analyze'}>{busy === 'analyze' ? t.analyzing : t.analyze}<span aria-hidden="true">→</span></button><span className="secure-note">⌁ &nbsp;Private to this session</span></div>
            </form>
          </div>
        </section>

        <section className="review-section section-wrap" id="review">
          <div className="review-header"><div><div className="eyebrow"><span className="eyebrow-line" />02 — {t.review}</div><h2>{t.review}</h2><p>{analysis ? t.reviewText : t.units}</p></div><button className="text-button" onClick={reset}>{t.reset} ↺</button></div>
          <div className="review-layout">
            <div className="measure-card"><div className="card-heading"><div><span className="card-kicker">{t.measured}</span><h3>{t.review}</h3></div><span className="edit-tag">✎ &nbsp;EDITABLE</span></div>
              <p className="card-description">{t.units}</p>
              <div className="measurement-grid">{MEASUREMENTS.map(({ key, en, te, unit, min, max, step }) => {
                const value = values[key] ?? '';
                const found = analysis?.extracted?.[key] !== null && analysis?.extracted?.[key] !== undefined;
                return <label className="measurement-field" key={key} htmlFor={`value-${key}`}><span>{language === 'en' ? en : te}</span><div className="input-wrap"><input id={`value-${key}`} type="number" min={min} max={max} step={step} value={value} onChange={(event) => updateValue(key, event.target.value)} placeholder="—" /><small>{unit}</small></div><small className="input-hint">{found ? t.extracted : t.manual} · {min}–{max}</small></label>;
              })}</div>
              <div className="confirm-row"><label><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span>{t.confirm}</span></label><span className={`completion ${complete ? 'complete' : ''}`}>{complete ? '✓' : '•'} {MEASUREMENTS.filter(({ key, min, max }) => Number.isFinite(Number(values[key])) && values[key] !== '' && Number(values[key]) >= min && Number(values[key]) <= max).length}/7</span></div>
              <button className="primary-button recommend-button" onClick={requestRecommendations} disabled={!complete || !confirmed || busy === 'recommend'}>{busy === 'recommend' ? t.recommending : t.recommend}<span aria-hidden="true">→</span></button>
              {!complete || !confirmed ? <small className="action-hint">{t.confirmFirst}</small> : null}
            </div>
            <aside className="context-card"><div className="context-icon">⌁</div><div className="card-kicker">FIELD CONTEXT</div><h3>{t.context}</h3><div className="context-list">{contextFields.map(([key, label]) => <label className="context-row" key={key} htmlFor={`context-${key}`}><span>{label}</span><select id={`context-${key}`} className="context-select" value={contextValues[key] || ''} onChange={(event) => setContextValues((current) => ({ ...current, [key]: event.target.value }))}><option value="">{t.choose}</option>{contextOptions[key].map(([value, en, te]) => <option value={value} key={value}>{language === 'en' ? en : te}</option>)}</select></label>)}</div><div className="context-disclaimer">{analysis?.language_support}</div></aside>
          </div>
        </section>

        <section className="results-section section-wrap" aria-live="polite">
          <div className="results-head"><div><div className="eyebrow"><span className="eyebrow-line" />03 — {t.result}</div><h2>{t.resultTitle}</h2><p>{t.basedOn}</p></div><span className="result-stamp">✳ &nbsp;{results ? 'MODEL GENERATED' : 'AWAITING INPUT'}</span></div>
          {error && <div className="error-banner" role="alert"><span>!</span>{error}</div>}
          {results?.recommendations?.length ? <><div className="crop-grid">{results.recommendations.map((item, index) => <article className={`crop-card crop-${index + 1}`} key={item.crop}><div className="crop-card-top"><span className="rank">0{index + 1}</span><span className="crop-symbol">{index === 0 ? '✳' : index === 1 ? '❋' : '✣'}</span></div><h3>{item.crop}</h3><div className="score-line"><span>{t.voteShare}</span><b>{item.vote_share}%</b></div><div className="score-track"><i style={{ width: `${Math.min(item.vote_share, 100)}%` }} /></div></article>)}</div><div className="confidence-note"><span>i</span><p>{results.confidence_note || t.confidenceNote} {results.model_evaluation?.holdout_accuracy != null && <>Holdout accuracy measured on the supplied data: <b>{(results.model_evaluation.holdout_accuracy * 100).toFixed(1)}%</b> ({results.model_evaluation.holdout_rows} test rows).</>}</p></div><p className="model-explanation">{results.explanation}</p></> : <div className="empty-results"><div className="empty-icon">↗</div><p>{t.noResult}</p></div>}
        </section>

        <section className="about-section" id="about"><div className="section-wrap about-wrap"><div className="about-copy"><div className="eyebrow"><span className="eyebrow-line" />{t.aboutEyebrow}</div><h2>{t.aboutTitle}</h2><p>{t.aboutText}</p><div className="about-meta"><div><b>{t.techTitle}</b><p>{t.techText}</p></div><div><b>{t.dataTitle}</b><p>{t.dataText}</p></div></div></div><div className="about-mark"><span>F</span><small>FIELDWISE<br />AGRI INTELLIGENCE</small><div className="mark-orbit orbit-one"/><div className="mark-orbit orbit-two"/></div></div></section>
      </main>
      <footer className="footer section-wrap"><a className="brand" href="#top"><span className="brand-mark">f</span><span>fieldwise<span className="brand-dot">.</span></span></a><p>{t.footer}</p><a href="#top" className="back-top">↑</a></footer>
    </div>
  );
}
