import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

const tourSteps = [
  { title: 'Audio visualizer', anchor: '.visualizer', text: 'The display shows the current chord and the combined audio output. Switch between Waveform and Spectrum without changing the sound.' },
  { title: 'Sound controls', anchor: '.controls', text: 'Choose the major key, voice, volume, reverb and chord color. Changes also affect sounding chords.' },
  { title: 'Chord joystick', anchor: '.joystick-control', text: 'Drag the joystick or hold unassigned arrow keys to change sounding chords: up changes the third, right adds a seventh, left adds a suspension, and down adds a sixth. Diagonals combine colors. Joystick Sustain keeps a dragged direction after release.' },
  { title: 'Pitch bend', anchor: '.pitch-bend', text: 'Move the slider up or down by up to 2 semitones. It changes sounding chords live. The center is normal pitch; Reset pitch bend returns to center immediately.' },
  { title: 'Metronome', anchor: '.metronome', text: 'Start or stop the metronome and set its tempo in BPM and beats per measure. The lights follow each beat, and the first beat has a higher pitch.' },
  { title: 'Stopping and resetting', anchor: '.reset-actions', text: 'Turn Everything Off stops the metronome, silences chords and reverb tails, releases inputs, disables sustains and centers the joystick while preserving settings and bindings. Reset Configuration also restores instrument defaults, metronome tempo and beats per measure, and keyboard bindings; your theme and tour dismissal stay unchanged.' },
  { title: 'Keyboard bindings', anchor: '.chord-header', text: 'Right-click a chord pad and press a key to bind it. Reusing a key unbinds its previous chord; Escape cancels. Bindings are saved in this browser.' },
  { title: 'Play chords', anchor: '.pads', text: 'Hold a chord pad or its displayed keyboard binding to play. Hold multiple chords to layer them; drag across pads to move between chords.' },
  { title: 'Sustain chords', anchor: '.pad-group .sustain', text: 'Enable Sustain before playing to keep a chord sounding after release. Press the latched chord again to silence it, or turn Sustain off.' },
];

export default function GuidedTour({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [position, setPosition] = useState({ left: 8, top: 8 });
  const [spotlight, setSpotlight] = useState({ left: 0, top: 0, right: 0, bottom: 0 });
  const panel = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const target = document.querySelector(tourSteps[step].anchor);
    target?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
    if (tourSteps[step].anchor === '.pitch-bend' && target && panel.current) {
      const rect = target.getBoundingClientRect();
      if (rect.bottom + panel.current.offsetHeight + 18 > window.innerHeight && rect.top < panel.current.offsetHeight + 18) {
        window.scrollBy(0, rect.top - 8);
      }
    }
    const place = () => {
      if (!target || !panel.current) return;
      const rect = target.getBoundingClientRect(), box = panel.current.getBoundingClientRect();
      const clampX = (value: number) => Math.max(0, Math.min(window.innerWidth, value));
      const clampY = (value: number) => Math.max(0, Math.min(window.innerHeight, value));
      setSpotlight({ left: clampX(rect.left), top: clampY(rect.top), right: clampX(rect.right), bottom: clampY(rect.bottom) });
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - box.width - 8));
      const below = rect.bottom + 10, above = rect.top - box.height - 10;
      const top = below + box.height <= window.innerHeight - 8 ? below : above >= 8 ? above : Math.max(8, Math.min(below, window.innerHeight - box.height - 8));
      setPosition({ left, top });
    };
    place();
    window.addEventListener('scroll', place, true); window.addEventListener('resize', place);
    const observer = new ResizeObserver(place);
    if (target) observer.observe(target);
    if (panel.current) observer.observe(panel.current);
    return () => { observer.disconnect(); window.removeEventListener('scroll', place, true); window.removeEventListener('resize', place); };
  }, [step]);
  useEffect(() => { panel.current?.querySelector<HTMLElement>('[data-initial]')?.focus(); }, []);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); onClose(); } };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [onClose]);
  return <><div className="tour-backdrop" aria-hidden="true">
    <div className="tour-shade" style={{ left: 0, top: 0, right: 0, height: spotlight.top }} />
    <div className="tour-shade" style={{ left: 0, top: spotlight.top, width: spotlight.left, height: spotlight.bottom - spotlight.top }} />
    <div className="tour-shade" style={{ left: spotlight.right, top: spotlight.top, right: 0, height: spotlight.bottom - spotlight.top }} />
    <div className="tour-shade" style={{ left: 0, top: spotlight.bottom, right: 0, bottom: 0 }} />
    <div className="tour-spotlight" style={{ left: spotlight.left, top: spotlight.top, width: spotlight.right - spotlight.left, height: spotlight.bottom - spotlight.top }} />
  </div><div ref={panel} className="tour-panel" role="dialog" aria-label="Guided tour" aria-describedby="tour-description" style={position}>
    <p className="tour-progress">Step {step + 1} of {tourSteps.length}</p>
    <h2>{tourSteps[step].title}</h2><p id="tour-description">{tourSteps[step].text}</p>
    <div className="tour-actions"><button type="button" onClick={onClose}>Close</button><button type="button" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button>{step === tourSteps.length - 1 ? <button type="button" onClick={onClose}>Finish</button> : <button type="button" data-initial onClick={() => setStep(step + 1)}>Next</button>}</div>
  </div></>;
}
