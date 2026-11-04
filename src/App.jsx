import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { chordNotes, chordName, noteNames } from './music/chords.js';
import GuidedTour from './components/GuidedTour.jsx';
import Visualizer from './components/Visualizer.jsx';

const roman = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
const keys = ['1', '2', '3', '4', '5', '6', '7'];
const bindingStorage = 'chord-bindings';
const readBindings = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(bindingStorage));
    if (Array.isArray(saved) && saved.length === keys.length && saved.every(k => k === null || (typeof k === 'string' && k.length > 0 && k === k.toLowerCase())) && new Set(saved.filter(k => k !== null)).size === saved.filter(k => k !== null).length) return saved;
  } catch { /* Use defaults if storage is unavailable or invalid. */ }
  return keys;
};
const themes = ['mint', 'salmon', 'orange', 'lavender', 'sky'];
const readTheme = () => {
  try { const saved = localStorage.getItem('chord-theme'); return themes.includes(saved) ? saved : 'mint'; }
  catch { return 'mint'; }
};
const voices = { Warm: 'triangle', Soft: 'sine', Bright: 'sawtooth', Pulse: 'square', Organ: [0, 1, 0.5, 0.25], Bell: [0, 1, 0, 0.4, 0, 0.2] };
const reverbs = { room: 0.7, hall: 1.8, dreamy: 3 };

function createReverbGraph(context, selected) {
  const input = context.createGain();
  const output = context.createAnalyser();
  input.connect(output); // The dry signal remains at unity, including when reverb is off.
  output.connect(context.destination);
  const wet = Object.entries(reverbs).map(([name, seconds], index) => {
    const convolver = context.createConvolver();
    const buffer = context.createBuffer(2, Math.floor(context.sampleRate * seconds), context.sampleRate);
    // Independent decaying noise in each channel produces a diffuse stereo impulse response.
    let seed = index + 1;
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < data.length; i++) {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        data[i] = (seed / 2147483648 - 1) * (1 - i / data.length) ** 2;
      }
    }
    convolver.buffer = buffer;
    const gain = context.createGain();
    gain.gain.value = selected === name ? 0.15 : 0;
    input.connect(convolver);
    convolver.connect(gain);
    gain.connect(output);
    return { name, gain };
  });
  return { input, output, wet };
}

export default function App() {
  const [tourOpen, setTourOpen] = useState(() => {
    try { return localStorage.getItem('chord-tour-dismissed') !== 'true'; }
    catch { return true; }
  });
  const tourLaunch = useRef(null);
  const closeTour = () => {
    try { localStorage.setItem('chord-tour-dismissed', 'true'); } catch { /* Retry on a later visit. */ }
    setTourOpen(false);
    tourLaunch.current?.focus();
  };
  const [theme, setTheme] = useState(readTheme);
  const changeTheme = value => {
    setTheme(value);
    try { localStorage.setItem('chord-theme', value); } catch { /* Keep the selection for this session. */ }
  };
  useLayoutEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  const [key, setKey] = useState(0);
  const [variation, setVariation] = useState('triad');
  const [voice, setVoice] = useState('Warm');
  const [volume, setVolume] = useState(0.4);
  const [pitchBend, setPitchBend] = useState(0);
  const pitchBendRef = useRef(0);
  const [reverb, setReverb] = useState('off');
  const reverbRef = useRef('off');
  const [tail, setTail] = useState(false);
  const tailTimer = useRef(null);
  const [active, setActive] = useState([]);
  const [sustain, setSustain] = useState(() => Array(7).fill(false));
  const sustainRef = useRef(Array(7).fill(false));
  const [bindings, setBindings] = useState(readBindings);
  const [bindingDegree, setBindingDegree] = useState(null);
  const [joystickSustain, setJoystickSustain] = useState(false);
  const joystickPointer = useRef(null);
  const [direction, setDirection] = useState('center');
  const directionRef = useRef('center');
  const activeRef = useRef(new Map());
  const arrowHeld = useRef([]);
  const audio = useRef(null);
  const analyser = useRef(null);
  const reverbGraph = useRef(null);
  const changeReverb = value => {
    reverbRef.current = value;
    setReverb(value);
    if (!reverbGraph.current) return;
    const now = audio.current.currentTime;
    for (const { name, gain } of reverbGraph.current.wet) {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setTargetAtTime(name === value ? 0.15 : 0, now, 0.035);
    }
  };
  const playing = useRef(new Map());
  const held = useRef(new Map());
  const padPointers = useRef(new Map());
  const [draggingPads, setDraggingPads] = useState(false);
  const changeVolume = value => {
    setVolume(value);
    if (!audio.current) return;
    const now = audio.current.currentTime;
    for (const notes of playing.current.values()) {
      for (const { gain } of notes) {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setTargetAtTime(value * 0.12, now, 0.025);
      }
    }
  };
  const changePitchBend = value => {
    pitchBendRef.current = value;
    setPitchBend(value);
    for (const notes of playing.current.values()) {
      for (const { osc, frequency } of notes) osc.frequency.value = frequency * 2 ** (value / 12);
    }
  };
  const stop = degree => {
    const notes = playing.current.get(degree);
    if (!notes) return;
    const now = audio.current.currentTime;
    notes.forEach(({ osc, gain }) => {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setTargetAtTime(0, now, 0.045);
      osc.stop(now + 0.3);
    });
    playing.current.delete(degree);
    activeRef.current.delete(degree);
    setActive([...activeRef.current.keys()]);
    if (!activeRef.current.size && reverbRef.current !== 'off') {
      clearTimeout(tailTimer.current);
      setTail(true);
      tailTimer.current = setTimeout(() => setTail(false), 3300);
    }
  };
  const play = (degree, color = directionRef.current, settings = { key, variation, voice, volume }) => {
    stop(degree);
    const context = audio.current ||= new (window.AudioContext || window.webkitAudioContext)();
    context.resume();
    clearTimeout(tailTimer.current);
    setTail(false);
    reverbGraph.current ||= createReverbGraph(context, reverbRef.current);
    analyser.current = reverbGraph.current.output;
    const now = context.currentTime;
    const notes = [];
    chordNotes(settings.key, degree, settings.variation, color).forEach(note => {
      const osc = context.createOscillator();
      const gain = context.createGain();
      const waveform = voices[settings.voice];
      if (Array.isArray(waveform)) osc.setPeriodicWave(context.createPeriodicWave(new Float32Array(waveform.length), new Float32Array(waveform)));
      else osc.type = waveform;
      const frequency = 440 * 2 ** ((note - 69) / 12);
      osc.frequency.value = frequency * 2 ** (pitchBendRef.current / 12);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(settings.volume * 0.12, now + 0.025);
      osc.connect(gain);
      gain.connect(reverbGraph.current.input);
      osc.start(now);
      notes.push({ osc, gain, frequency });
    });
    playing.current.set(degree, notes);
    activeRef.current.set(degree, true);
    setActive([...activeRef.current.keys()]);
  };
  const updateSound = changes => {
    const settings = { key, variation, voice, volume, ...changes };
    [...activeRef.current.keys()].forEach(degree => play(degree, directionRef.current, settings));
  };
  const turnEverythingOff = () => {
    const pointers = [...padPointers.current.keys(), joystickPointer.current].filter(id => id !== null);
    held.current.clear(); padPointers.current.clear(); arrowHeld.current = [];
    joystickPointer.current = null; setDraggingPads(false);
    for (const element of document.querySelectorAll('.pad, .joystick')) {
      for (const id of pointers) if (element.hasPointerCapture(id)) element.releasePointerCapture(id);
    }
    sustainRef.current = Array(7).fill(false); setSustain(Array(7).fill(false));
    [...activeRef.current.keys()].forEach(stop);
    clearTimeout(tailTimer.current); setTail(false);
    // Discard the old convolution paths so a later preset cannot revive their tail.
    reverbGraph.current?.output.disconnect();
    reverbGraph.current = null; analyser.current = null;
    directionRef.current = 'center'; setDirection('center'); setJoystickSustain(false);
    setBindingDegree(null);
  };
  const resetConfiguration = () => {
    turnEverythingOff();
    setKey(0); setVariation('triad'); setVoice('Warm'); changeVolume(0.4);
    changePitchBend(0); changeReverb('off');
    setBindings(keys);
    try { localStorage.setItem(bindingStorage, JSON.stringify(keys)); } catch { /* Defaults remain active for this session. */ }
  };
  const press = (degree, source) => {
    const latched = !held.current.has(degree) && sustainRef.current[degree] && playing.current.has(degree);
    if (!held.current.has(degree)) held.current.set(degree, new Set());
    const sources = held.current.get(degree);
    if (sources.has(source)) return;
    sources.add(source);
    if (latched) stop(degree);
    else if (!playing.current.has(degree) && sources.size === 1) play(degree);
  };
  const release = (degree, source) => {
    const sources = held.current.get(degree);
    if (!sources?.delete(source)) return;
    if (!sources.size) {
      held.current.delete(degree);
      if (!sustainRef.current[degree]) stop(degree);
    }
  };
  const movePadPointer = event => {
    if (!padPointers.current.has(event.pointerId)) return;
    const previous = padPointers.current.get(event.pointerId);
    const pad = document.elementFromPoint(event.clientX, event.clientY)?.closest('.pad[data-degree]');
    const next = pad ? Number(pad.dataset.degree) : null;
    if (previous === next) return;
    const source = `pointer:${event.pointerId}`;
    if (previous !== null) release(previous, source);
    padPointers.current.set(event.pointerId, next);
    if (next !== null) press(next, source);
  };
  const endPadPointer = event => {
    if (!padPointers.current.has(event.pointerId)) return;
    const degree = padPointers.current.get(event.pointerId);
    padPointers.current.delete(event.pointerId);
    setDraggingPads(padPointers.current.size > 0);
    if (degree !== null) release(degree, `pointer:${event.pointerId}`);
  };
  const toggleSustain = degree => {
    const next = [...sustainRef.current];
    next[degree] = !next[degree];
    sustainRef.current = next;
    setSustain(next);
    if (!next[degree] && !held.current.has(degree)) stop(degree);
  };
  const changeDirection = next => {
    if (directionRef.current === next) return;
    directionRef.current = next;
    setDirection(next);
    [...activeRef.current.keys()].forEach(degree => play(degree, next));
  };
  const arrowDirection = () => {
    const last = axis => [...arrowHeld.current].reverse().find(key => axis.includes(key));
    const vertical = ({ arrowup: 'up', arrowdown: 'down' })[last(['arrowup', 'arrowdown'])];
    const horizontal = ({ arrowleft: 'left', arrowright: 'right' })[last(['arrowleft', 'arrowright'])];
    return [vertical, horizontal].filter(Boolean).join('-') || 'center';
  };
  const pointerDirection = event => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    if (Math.hypot(x, y) < 0.18) return changeDirection('center');
    const angle = Math.atan2(y, x);
    const sectors = ['right', 'down-right', 'down', 'down-left', 'left', 'up-left', 'up', 'up-right'];
    changeDirection(sectors[(Math.round(angle / (Math.PI / 4)) + 8) % 8]);
  };
  useEffect(() => {
    const down = event => {
      if (tourOpen && (event.key === 'Escape' || event.target.closest?.('.tour-panel'))) return;
      if (bindingDegree !== null) {
        event.preventDefault();
        if (event.key === 'Escape') { setBindingDegree(null); return; }
        if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || ['Shift', 'Control', 'Alt', 'Meta', 'Dead', 'Unidentified'].includes(event.key)) return;
        const pressed = event.key.toLowerCase();
        const next = bindings.map((binding, i) => i === bindingDegree ? pressed : binding === pressed ? null : binding);
        try { localStorage.setItem(bindingStorage, JSON.stringify(next)); } catch { /* Playback still works for this session. */ }
        setBindings(next);
        setBindingDegree(null);
        return;
      }
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.target.matches('input, select') || (event.target.matches('button') && (event.key === ' ' || event.key === 'Enter'))) return;
      const pressed = event.key.toLowerCase();
      const degree = bindings.indexOf(pressed);
      if (degree !== -1) { event.preventDefault(); press(degree, `key:${pressed}`); return; }
      const arrows = { arrowup: 'up', arrowright: 'right', arrowleft: 'left', arrowdown: 'down' };
      if (arrows[pressed]) { event.preventDefault(); arrowHeld.current.push(pressed); changeDirection(arrowDirection()); }
    };
    const up = event => {
      const pressed = event.key.toLowerCase();
      for (const degree of held.current.keys()) release(degree, `key:${pressed}`);
      if (arrowHeld.current.includes(pressed)) {
        arrowHeld.current = arrowHeld.current.filter(k => k !== pressed);
        changeDirection(arrowDirection());
      }
    };
    const blur = () => { padPointers.current.clear(); setDraggingPads(false); held.current.clear(); for (const degree of activeRef.current.keys()) if (!sustainRef.current[degree]) stop(degree); arrowHeld.current = []; joystickPointer.current = null; changeDirection('center'); };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', blur);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); };
  }, [key, variation, voice, volume, bindings, bindingDegree, tourOpen]);
  useEffect(() => () => { clearTimeout(tailTimer.current); audio.current?.close(); }, []);
  const displayName = active.length === 0 ? 'Ready to play' : chordName(chordNotes(key, active[active.length - 1], variation, direction));
  return <main><header><div className="brand"><span className="brand-mark">✳</span> POCKET STUDIO <span className="brand-sub">/ 01</span></div><div className="header-actions"><button type="button" className="tour-launch" ref={tourLaunch} onClick={() => setTourOpen(true)}>Start guided tour</button><span className="header-note">A LITTLE SPACE TO MAKE SOMETHING</span><label className="theme-picker">Theme <select value={theme} onChange={e => changeTheme(e.target.value)}>{themes.map(name => <option key={name} value={name}>{name[0].toUpperCase() + name.slice(1)}</option>)}</select></label></div></header>
    <section className="instrument" aria-label="Chord instrument"><div className="instrument-top"><div><span className="unit-label">POCKET STUDIO</span><h2>chord<span>01</span></h2><p>THE PLAY-ANYWHERE CHORD MACHINE</p></div><div className="power"><span/> AUDIO READY</div></div>
      <Visualizer analyser={analyser} active={active.length > 0 || tail} theme={theme}><div className="screen"><div className="screen-top"><span>NOW PLAYING</span><span>♫</span></div><strong aria-live="polite">{displayName}</strong><div className="screen-bottom"><span>KEY {noteNames[key]}</span><span>{variation.toUpperCase()}</span></div></div></Visualizer>
      <div className="control-grid"><div className="controls"><label>KEY <select value={key} onChange={e => { const value = Number(e.target.value); setKey(value); updateSound({ key: value }); }}>{noteNames.map((n,i)=><option key={n} value={i}>{n} major</option>)}</select></label><label>VOICE <select value={voice} onChange={e => { const value = e.target.value; setVoice(value); updateSound({ voice: value }); }}>{Object.keys(voices).map(v=><option key={v}>{v}</option>)}</select></label><label className="volume">VOLUME <input type="range" min="0" max="0.7" step="0.01" value={volume} onChange={e=>changeVolume(Number(e.target.value))}/></label><label>Reverb <select value={reverb} onChange={e => changeReverb(e.target.value)}>{[['off','Off'],['room','Room'],['hall','Hall'],['dreamy','Dreamy']].map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>CHORD COLOR <select value={variation} onChange={e => { const value = e.target.value; setVariation(value); updateSound({ variation: value }); }}>{[['triad','Original'],['seventh','7th'],['sus4','Sus4'],['sus2','Sus2'],['sixth','6th'],['add9','Add9']].map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label></div>
      <div className="joystick-control"><span className="section-label">CHORD JOYSTICK</span><div className="joystick" role="application" aria-label="Chord joystick" aria-describedby="joystick-status" onPointerDown={e=>{ if (e.button !== 0 || joystickPointer.current !== null) return; joystickPointer.current = e.pointerId; e.currentTarget.setPointerCapture(e.pointerId); pointerDirection(e); }} onPointerMove={e=>{if (joystickPointer.current === e.pointerId && e.currentTarget.hasPointerCapture(e.pointerId)) pointerDirection(e);}} onPointerUp={e=>{if (joystickPointer.current === e.pointerId) { joystickPointer.current = null; if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); if (!joystickSustain) changeDirection('center'); }}} onPointerCancel={e=>{if (joystickPointer.current === e.pointerId) { joystickPointer.current = null; changeDirection('center'); }}} onLostPointerCapture={e=>{if (joystickPointer.current === e.pointerId) { joystickPointer.current = null; changeDirection('center'); }}}><span className="joy-up">↑</span><span className="joy-right">→</span><span className="joy-down">↓</span><span className="joy-left">←</span>{['up-left', 'up-right', 'down-left', 'down-right'].map(d => <span key={d} data-direction={d} aria-hidden="true" className={'joy-diagonal joy-' + d + (direction === d ? ' active' : '')} />)}<span className={'joy-knob '+direction}/></div><button type="button" className="sustain joystick-sustain" aria-label="Sustain joystick" aria-pressed={joystickSustain} onClick={() => { const next = !joystickSustain; setJoystickSustain(next); if (!next) changeDirection('center'); }}><span>Sustain joystick</span><span className="toggle-track" aria-hidden="true"><span className="toggle-thumb" /></span></button><span id="joystick-status" className="joy-status" aria-live="polite">{direction}</span></div><div className="pitch-bend"><span className="section-label">PITCH BEND</span><input aria-label="Pitch bend" aria-valuetext={`${pitchBend > 0 ? '+' : ''}${pitchBend} semitones`} type="range" min="-2" max="2" step="0.01" value={pitchBend} onChange={e => changePitchBend(Number(e.target.value))}/><output>{pitchBend > 0 ? '+' : ''}{pitchBend} semitones</output><button type="button" onClick={() => changePitchBend(0)}>Reset pitch bend</button></div></div>
      <div className="chord-header"><span className="section-label">PLAY A CHORD</span><span>HOLD TO PLAY · RIGHT-CLICK TO BIND</span></div><div className={'pads' + (draggingPads ? ' dragging' : '')}>{roman.map((label,i)=><div className="pad-group" key={label}><button className={'pad '+(active.includes(i)?'active':'')} onContextMenu={e=>{e.preventDefault(); e.currentTarget.blur(); setBindingDegree(i);}} data-degree={i} onPointerDown={e=>{if (e.button !== 0) return; e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); padPointers.current.set(e.pointerId, i); setDraggingPads(true); press(i, `pointer:${e.pointerId}`);}} onPointerMove={movePadPointer} onPointerUp={endPadPointer} onPointerCancel={endPadPointer} onLostPointerCapture={endPadPointer} onKeyDown={e=>{if ((e.key===' ' || e.key==='Enter') && !e.repeat) { e.preventDefault(); press(i, `pad:${e.key}`); }}} onKeyUp={e=>{if(e.key===' ' || e.key==='Enter') release(i, `pad:${e.key}`);}} onBlur={()=>{release(i, 'pad: '); release(i, 'pad:Enter');}} aria-label={`Play chord ${label}`}><span>{label}</span><small>{bindings[i] === ' ' ? 'Space' : bindings[i] ?? '—'}</small></button><button type="button" className="sustain" aria-label={`Sustain chord ${label}`} aria-pressed={sustain[i]} onClick={()=>toggleSustain(i)}>Sustain</button></div>)}</div>{bindingDegree !== null && <div className="binding-overlay"><div className="binding-dialog" role="dialog" aria-modal="true" aria-label={`Bind chord ${roman[bindingDegree]}`}><strong>Bind chord {roman[bindingDegree]}</strong><p>Press a keyboard key to assign it. An existing assignment will be replaced.</p><p>Press Escape to cancel.</p><button type="button" onClick={()=>setBindingDegree(null)}>Cancel</button></div></div>}<div className="reset-actions"><button type="button" className="reset-configuration" onClick={turnEverythingOff}>Turn Everything Off</button><button type="button" className="reset-configuration" onClick={resetConfiguration}>Reset Configuration</button></div><div className="instrument-bottom"><span>MADE FOR PLAYING AROUND</span><span>✳ &nbsp; SOUND ON, WORLD OFF</span></div></section>
    {tourOpen && <GuidedTour onClose={closeTour}/>}</main>;
}
