import { useState, useEffect, useCallback, useRef } from 'react';
import { generatePassword, generatePassphrase, generatePin, generateToken, generateMemorable, calculateStrength } from './utils/generatePassword';
import './styles.css';

const AnimatedPassword = ({ password, isGenerating, isMasked, mode }) => {
  if (isMasked && mode !== 'analyze') {
    return <span className="password-text masked">{'•'.repeat(password.length || 8)}</span>;
  }
  
  if (!password && mode !== 'analyze') {
    return <span className="password-text placeholder">Awaiting Generation...</span>;
  }

  return (
    <span className={`password-text ${isGenerating ? 'generating' : 'revealing'}`}>
      {password.split('').map((char, i) => (
        <span 
          key={`${char}-${i}`} 
          className="char" 
          style={{ animationDelay: `${Math.min(i * 15, 400)}ms` }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
};

const MODES = {
  random: { group: 'Primary', label: 'Random Password' },
  passphrase: { group: 'Primary', label: 'Passphrase' },
  pin: { group: 'Primary', label: 'Secure PIN' },
  token: { group: 'Developer', label: 'Secret Token' },
  memorable: { group: 'Utilities', label: 'Memorable Password' },
  analyze: { group: 'Utilities', label: 'Password Analyzer' },
};

function App() {
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState('random');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModeSelect, setShowModeSelect] = useState(false);
  const [isLockedIn, setIsLockedIn] = useState(false);
  const modeSelectRef = useRef(null);
  
  // Specific configurations
  const [randomOpts, setRandomOpts] = useState({ length: 24, uppercase: true, lowercase: true, numbers: true, symbols: true, excludeSimilar: false, excludeAmbiguous: false });
  const [passphraseOpts, setPassphraseOpts] = useState({ wordCount: 4, separator: '-', capitalize: false, includeNumber: false });
  const [pinOpts, setPinOpts] = useState({ length: 6, excludeRepeated: false, excludeSequential: false });
  const [tokenOpts, setTokenOpts] = useState({ length: 32, type: 'hex' }); 
  const [memorableOpts, setMemorableOpts] = useState({ wordCount: 3, includeNumber: true, includeSymbol: true });
  
  const [analyzeInput, setAnalyzeInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPassword, setShowPassword] = useState(true);
  const [showSecurityDetails, setShowSecurityDetails] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('keycrox-theme') || 'system');

  useEffect(() => {
    localStorage.setItem('keycrox-theme', theme);
    if (theme === 'system') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (modeSelectRef.current && !modeSelectRef.current.contains(event.target)) {
        setShowModeSelect(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getActiveOptions = () => {
    switch(mode) {
      case 'random': return randomOpts;
      case 'passphrase': return passphraseOpts;
      case 'pin': return pinOpts;
      case 'token': return tokenOpts;
      case 'memorable': return memorableOpts;
      default: return {};
    }
  };

  const strength = calculateStrength(mode === 'analyze' ? analyzeInput : password, getActiveOptions(), mode);

  const generate = useCallback(() => {
    if (mode === 'analyze') return;
    setIsGenerating(true);
    setIsLockedIn(false);
    
    setTimeout(() => {
      let newPassword = '';
      if (mode === 'random') newPassword = generatePassword(randomOpts.length, randomOpts);
      else if (mode === 'passphrase') newPassword = generatePassphrase(passphraseOpts.wordCount, passphraseOpts.separator, passphraseOpts.capitalize, passphraseOpts.includeNumber);
      else if (mode === 'pin') newPassword = generatePin(pinOpts.length, pinOpts.excludeRepeated, pinOpts.excludeSequential);
      else if (mode === 'token') newPassword = generateToken(tokenOpts.length, tokenOpts.type);
      else if (mode === 'memorable') newPassword = generateMemorable(memorableOpts.wordCount, memorableOpts.includeNumber, memorableOpts.includeSymbol);
      
      setPassword(newPassword);
      setCopied(false);
      setIsGenerating(false);
      
      // Trigger the "Lock-in" effect shortly after password reveal finishes
      setTimeout(() => setIsLockedIn(true), 300);
      setTimeout(() => setIsLockedIn(false), 1000);
      
    }, 200); // 200ms chamber preparation pulse
  }, [mode, randomOpts, passphraseOpts, pinOpts, tokenOpts, memorableOpts]);

  useEffect(() => {
    if (mode !== 'analyze') generate();
  }, [mode]);

  const generateInstantly = useCallback(() => {
    if (mode === 'analyze') return;
    let newPassword = '';
    if (mode === 'random') newPassword = generatePassword(randomOpts.length, randomOpts);
    else if (mode === 'passphrase') newPassword = generatePassphrase(passphraseOpts.wordCount, passphraseOpts.separator, passphraseOpts.capitalize, passphraseOpts.includeNumber);
    else if (mode === 'pin') newPassword = generatePin(pinOpts.length, pinOpts.excludeRepeated, pinOpts.excludeSequential);
    else if (mode === 'token') newPassword = generateToken(tokenOpts.length, tokenOpts.type);
    else if (mode === 'memorable') newPassword = generateMemorable(memorableOpts.wordCount, memorableOpts.includeNumber, memorableOpts.includeSymbol);
    
    setPassword(newPassword);
    setCopied(false);
  }, [mode, randomOpts, passphraseOpts, pinOpts, tokenOpts, memorableOpts]);

  useEffect(() => {
    if (password && mode !== 'analyze') generateInstantly();
  }, [randomOpts, passphraseOpts, pinOpts, tokenOpts, memorableOpts, generateInstantly, mode]);

  const handleCopy = async () => {
    const textToCopy = mode === 'analyze' ? analyzeInput : password;
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const updateOpts = (setter) => (key, value) => {
    setter(prev => ({ ...prev, [key]: value !== undefined ? value : !prev[key] }));
  };

  const applyPreset = (preset) => {
    if (mode === 'random') {
      if (preset === 'quick') setRandomOpts(prev => ({...prev, length: 12, uppercase: true, lowercase: true, numbers: true, symbols: false}));
      if (preset === 'strong') setRandomOpts(prev => ({...prev, length: 24, uppercase: true, lowercase: true, numbers: true, symbols: true}));
      if (preset === 'maximum') setRandomOpts(prev => ({...prev, length: 64, uppercase: true, lowercase: true, numbers: true, symbols: true}));
    } else if (mode === 'passphrase') {
      if (preset === 'quick') setPassphraseOpts(prev => ({...prev, wordCount: 3}));
      if (preset === 'strong') setPassphraseOpts(prev => ({...prev, wordCount: 6}));
      if (preset === 'maximum') setPassphraseOpts(prev => ({...prev, wordCount: 10}));
    } else if (mode === 'pin') {
      if (preset === 'quick') setPinOpts(prev => ({...prev, length: 4}));
      if (preset === 'strong') setPinOpts(prev => ({...prev, length: 6}));
      if (preset === 'maximum') setPinOpts(prev => ({...prev, length: 12}));
    } else if (mode === 'token') {
      if (preset === 'quick') setTokenOpts(prev => ({...prev, length: 32}));
      if (preset === 'strong') setTokenOpts(prev => ({...prev, length: 64}));
      if (preset === 'maximum') setTokenOpts(prev => ({...prev, length: 128}));
    } else if (mode === 'memorable') {
      if (preset === 'quick') setMemorableOpts(prev => ({...prev, wordCount: 2}));
      if (preset === 'strong') setMemorableOpts(prev => ({...prev, wordCount: 4}));
      if (preset === 'maximum') setMemorableOpts(prev => ({...prev, wordCount: 6}));
    }
  };

  const getPresetLabels = () => {
    return { quick: 'QUICK', strong: 'STRONG', maximum: 'MAXIMUM' };
  };

  return (
    <div className="page">
      {/* KEYCROX Visual World Layers */}
      <div className="bg-atmospheric"></div>
      <div className="bg-grid"></div>
      <div className={`bg-glow-hero ${isGenerating ? 'intensify' : ''}`}></div>
      <div className="bg-glow-bottom"></div>
      
      <div className="theme-toggle">
        <button className={`theme-btn ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')} title="Light Theme">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
        </button>
        <button className={`theme-btn ${theme === 'system' ? 'active' : ''}`} onClick={() => setTheme('system')} title="System Theme">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
        </button>
        <button className={`theme-btn ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')} title="Dark Theme">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
        </button>
      </div>

      <main className="shell">

        {/* HEADER */}
        <header className="header animate-stagger-1">
          <div className="brand-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="brand-icon">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
            </svg>
            <h1 className="title">KEYCROX</h1>
          </div>
          <p className="manifesto">Generate a password worth trusting.</p>
        </header>

        {/* MODE SELECTOR */}
        <section className="mode-selector-wrapper animate-stagger-2" ref={modeSelectRef}>
          <button className="mode-selector-btn" onClick={() => setShowModeSelect(!showModeSelect)}>
            <div className="mode-selector-current">
              <span className="mode-group-label">{MODES[mode].group}</span>
              <span className="mode-title-label">{MODES[mode].label}</span>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`chevron ${showModeSelect ? 'open' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
          
          <div className={`mode-dropdown ${showModeSelect ? 'open' : ''}`}>
            {['Primary', 'Developer', 'Utilities'].map(group => (
              <div key={group} className="mode-group">
                <div className="mode-group-title">{group}</div>
                {Object.entries(MODES).filter(([_, m]) => m.group === group).map(([key, m]) => (
                  <button 
                    key={key} 
                    className={`mode-option ${mode === key ? 'active' : ''}`}
                    onClick={() => { setMode(key); setShowModeSelect(false); }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </section>
        
        {/* GENERATION CHAMBER - The Signature Component */}
        <section className={`chamber-section animate-stagger-3 ${isGenerating ? 'generating' : ''} ${isLockedIn ? 'locked-in' : ''}`}>
          <div className="chamber-outer">
            <div className="chamber-inner">
              
              {/* Security Ring Layer */}
              <div className="security-ring-container">
                <div className="security-ring">
                  <div className="ring-markings">
                    <span>01</span><span>04</span><span>08</span><span>16</span><span>32</span><span>64</span><span>128</span>
                  </div>
                </div>
              </div>

              <div className="chamber-content">
                <div className="chamber-header">
                  <div className="secure-badge">
                    <span className="pulse-dot"></span>
                    {mode === 'analyze' ? 'LOCAL ANALYSIS' : 'GENERATED LOCALLY'}
                  </div>
                  {mode !== 'analyze' && (
                    <button className="icon-btn ghost" onClick={() => setShowPassword(!showPassword)} title={showPassword ? "Hide" : "Show"}>
                      {showPassword ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      )}
                    </button>
                  )}
                </div>

                <div className="password-display">
                  {mode === 'analyze' ? (
                    <input 
                      type="text" 
                      className="cyber-input" 
                      placeholder="Enter password..." 
                      value={analyzeInput}
                      onChange={(e) => setAnalyzeInput(e.target.value)}
                      autoComplete="off"
                      spellCheck="false"
                    />
                  ) : (
                    <AnimatedPassword password={password} isGenerating={isGenerating} isMasked={!showPassword} mode={mode} />
                  )}
                </div>

                {(password || analyzeInput) && (
                  <div className="chamber-metrics">
                    <div className="strength-segment-meter">
                      <div className="segments">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className={`segment ${i <= strength.score ? 'active' : ''}`} data-level={strength.score} />
                        ))}
                      </div>
                      <span className="strength-text" data-level={strength.score}>{strength.label.toUpperCase()}</span>
                    </div>
                    <div className="entropy-summary">
                      {strength.entropy} bits
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Chamber Actions */}
            <div className="chamber-actions">
              <button className={`btn-primary copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
                <div className="btn-content">
                  {copied ? (
                    <><div className="copy-pulse"></div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="success-icon"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied</>
                  ) : (
                    <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy {mode === 'analyze' ? 'Input' : 'Password'}</>
                  )}
                </div>
              </button>
              {mode !== 'analyze' && (
                <button className={`btn-secondary regen-btn ${isGenerating ? 'spinning' : ''}`} onClick={generate} title="Regenerate">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* CONTROLS */}
        <section className="controls-section animate-stagger-4">
          <div className="config-panel">
            
            {mode !== 'analyze' && (
              <div className="presets-row">
                <span className="group-label">PRESETS</span>
                <div className="preset-chips">
                  <button className="preset-chip" onClick={() => applyPreset('quick')}>{getPresetLabels().quick}</button>
                  <button className="preset-chip" onClick={() => applyPreset('strong')}>{getPresetLabels().strong}</button>
                  <button className="preset-chip" onClick={() => applyPreset('maximum')}>{getPresetLabels().maximum}</button>
                </div>
              </div>
            )}
            
            {mode === 'random' && (
              <>
                <div className="config-group">
                  <div className="slider-header"><label>LENGTH</label><span className="slider-value">{randomOpts.length}</span></div>
                  <div className="slider-track-wrapper">
                    <input type="range" min="8" max="128" value={randomOpts.length} onChange={(e) => updateOpts(setRandomOpts)('length', Number(e.target.value))} className="premium-slider" style={{ '--val': `${((randomOpts.length - 8) / (128 - 8)) * 100}%` }} />
                  </div>
                </div>

                <div className="config-group">
                  <label className="group-label">CHARACTER SET</label>
                  <div className="premium-toggles-grid">
                    {[
                      { key: 'uppercase', label: 'A-Z' },
                      { key: 'lowercase', label: 'a-z' },
                      { key: 'numbers', label: '0-9' },
                      { key: 'symbols', label: '#$' }
                    ].map(({ key, label }) => (
                      <button key={key} className={`premium-toggle-btn ${randomOpts[key] ? 'active' : ''}`} onClick={() => {
                        const newOpts = { ...randomOpts, [key]: !randomOpts[key] };
                        if (['uppercase', 'lowercase', 'numbers', 'symbols'].some(k => newOpts[k])) setRandomOpts(newOpts);
                      }}>
                        <span className="toggle-text">{label}</span>
                        <div className="toggle-indicator"></div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="advanced-accordion">
                  <button className="accordion-trigger" onClick={() => setShowAdvanced(!showAdvanced)}>
                    ADVANCED OPTIONS <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={showAdvanced ? 'open' : ''}><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </button>
                  <div className={`accordion-content ${showAdvanced ? 'expanded' : ''}`}>
                    <div className="accordion-inner">
                      <label className="premium-switch-item"><span className="switch-label">Exclude Similar (0/O/1/l/I)</span><div className="premium-switch"><input type="checkbox" checked={randomOpts.excludeSimilar} onChange={() => updateOpts(setRandomOpts)('excludeSimilar')} /><span className="switch-track"><span className="switch-thumb"></span></span></div></label>
                      <label className="premium-switch-item"><span className="switch-label">Exclude Ambiguous</span><div className="premium-switch"><input type="checkbox" checked={randomOpts.excludeAmbiguous} onChange={() => updateOpts(setRandomOpts)('excludeAmbiguous')} /><span className="switch-track"><span className="switch-thumb"></span></span></div></label>
                    </div>
                  </div>
                </div>
              </>
            )}

            {mode === 'passphrase' && (
              <>
                <div className="config-group">
                  <div className="slider-header"><label>WORDS</label><span className="slider-value">{passphraseOpts.wordCount}</span></div>
                  <input type="range" min="3" max="12" value={passphraseOpts.wordCount} onChange={(e) => updateOpts(setPassphraseOpts)('wordCount', Number(e.target.value))} className="premium-slider" style={{ '--val': `${((passphraseOpts.wordCount - 3) / (12 - 3)) * 100}%` }} />
                </div>
                <div className="config-group">
                  <label className="premium-switch-item"><span className="switch-label">Separator</span><select value={passphraseOpts.separator} onChange={(e) => updateOpts(setPassphraseOpts)('separator', e.target.value)} className="premium-select"><option value="-">Hyphen (-)</option><option value=" ">Space ( )</option><option value=".">Period (.)</option><option value="_">Underscore (_)</option><option value="">None</option></select></label>
                  <label className="premium-switch-item"><span className="switch-label">Capitalize Words</span><div className="premium-switch"><input type="checkbox" checked={passphraseOpts.capitalize} onChange={() => updateOpts(setPassphraseOpts)('capitalize')} /><span className="switch-track"><span className="switch-thumb"></span></span></div></label>
                  <label className="premium-switch-item"><span className="switch-label">Include Number</span><div className="premium-switch"><input type="checkbox" checked={passphraseOpts.includeNumber} onChange={() => updateOpts(setPassphraseOpts)('includeNumber')} /><span className="switch-track"><span className="switch-thumb"></span></span></div></label>
                </div>
              </>
            )}

            {mode === 'pin' && (
              <>
                <div className="config-group">
                  <div className="slider-header"><label>PIN LENGTH</label><span className="slider-value">{pinOpts.length}</span></div>
                  <input type="range" min="4" max="12" value={pinOpts.length} onChange={(e) => updateOpts(setPinOpts)('length', Number(e.target.value))} className="premium-slider" style={{ '--val': `${((pinOpts.length - 4) / (12 - 4)) * 100}%` }} />
                </div>
                <div className="config-group">
                  <label className="premium-switch-item"><span className="switch-label">Exclude Repeated (e.g. 111)</span><div className="premium-switch"><input type="checkbox" checked={pinOpts.excludeRepeated} onChange={() => updateOpts(setPinOpts)('excludeRepeated')} /><span className="switch-track"><span className="switch-thumb"></span></span></div></label>
                  <label className="premium-switch-item"><span className="switch-label">Exclude Sequential (e.g. 123)</span><div className="premium-switch"><input type="checkbox" checked={pinOpts.excludeSequential} onChange={() => updateOpts(setPinOpts)('excludeSequential')} /><span className="switch-track"><span className="switch-thumb"></span></span></div></label>
                </div>
              </>
            )}

            {mode === 'token' && (
              <>
                <div className="config-group">
                  <div className="slider-header"><label>TOKEN LENGTH</label><span className="slider-value">{tokenOpts.length}</span></div>
                  <input type="range" min="16" max="128" value={tokenOpts.length} onChange={(e) => updateOpts(setTokenOpts)('length', Number(e.target.value))} className="premium-slider" style={{ '--val': `${((tokenOpts.length - 16) / (128 - 16)) * 100}%` }} />
                </div>
                <div className="config-group">
                  <label className="premium-switch-item"><span className="switch-label">Format</span><select value={tokenOpts.type} onChange={(e) => updateOpts(setTokenOpts)('type', e.target.value)} className="premium-select"><option value="hex">Hexadecimal (0-9, a-f)</option><option value="base64url">Base64URL Safe</option><option value="alphanumeric">Alphanumeric (A-Z, a-z, 0-9)</option></select></label>
                </div>
              </>
            )}

            {mode === 'memorable' && (
              <>
                <div className="config-group">
                  <div className="slider-header"><label>WORD COUNT</label><span className="slider-value">{memorableOpts.wordCount}</span></div>
                  <input type="range" min="2" max="6" value={memorableOpts.wordCount} onChange={(e) => updateOpts(setMemorableOpts)('wordCount', Number(e.target.value))} className="premium-slider" style={{ '--val': `${((memorableOpts.wordCount - 2) / (6 - 2)) * 100}%` }} />
                </div>
                <div className="config-group">
                  <label className="premium-switch-item"><span className="switch-label">Include Numbers</span><div className="premium-switch"><input type="checkbox" checked={memorableOpts.includeNumber} onChange={() => updateOpts(setMemorableOpts)('includeNumber')} /><span className="switch-track"><span className="switch-thumb"></span></span></div></label>
                  <label className="premium-switch-item"><span className="switch-label">Include Symbols</span><div className="premium-switch"><input type="checkbox" checked={memorableOpts.includeSymbol} onChange={() => updateOpts(setMemorableOpts)('includeSymbol')} /><span className="switch-track"><span className="switch-thumb"></span></span></div></label>
                </div>
              </>
            )}

            {mode === 'analyze' && analyzeInput && (
              <div className="analysis-results">
                <div className="analysis-grid">
                  {strength.details.map((detail, idx) => (
                    <div key={idx} className={`analysis-card ${detail.warning ? 'warning' : ''} ${detail.pass ? 'pass' : detail.pass === false ? 'fail' : ''}`}>
                      <span className="card-label">{detail.label}</span>
                      <span className="card-value">{detail.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        </section>

        {/* PERMANENT SECURITY PANEL */}
        {mode !== 'analyze' && (
          <section className="security-panel animate-stagger-5">
            <div className="panel-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              Security Details
            </div>
            <div className="panel-inner grid-details">
              <div className="detail-item"><span className="detail-label">Entropy</span><span className="detail-value">{strength.entropy} bits</span></div>
              <div className="detail-item"><span className="detail-label">Pool Size</span><span className="detail-value">{strength.poolSize} {mode === 'passphrase' || mode === 'memorable' ? 'words' : 'chars'}</span></div>
              <div className="detail-item"><span className="detail-label">Generation</span><span className="detail-value">crypto.getRandomValues</span></div>
              <div className="detail-item"><span className="detail-label">Processing</span><span className="detail-value">Local browser</span></div>
            </div>
          </section>
        )}

        {/* SECURITY PRINCIPLE */}
        <section className="security-principle animate-stagger-5">
          <div className="principle-dot"></div>
          <span>LOCAL FIRST. Your generated credentials never leave this browser tab.</span>
        </section>

        <footer className="footer animate-stagger-5">
          <div className="footer-brand">
            <strong>KEYCROX</strong>
            <span className="footer-tagline sub">Secure Password Generator</span>
          </div>
          <div className="footer-creator">Crafted by <strong>RHLIVERSE</strong><br/>© 2026 KEYCROX</div>
        </footer>
      </main>
    </div>
  );
}

export default App;
