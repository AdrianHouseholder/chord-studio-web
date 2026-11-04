import { useEffect, useRef, useState } from 'react';

type Props = {
  tempo: number;
  running: boolean;
  beatsPerMeasure: number;
  onBeatsPerMeasureChange: (beats: number) => void;
  onTempoChange: (tempo: number) => void;
  onRunningChange: (running: boolean) => void;
};

export default function Metronome({ tempo, running, beatsPerMeasure, onBeatsPerMeasureChange, onTempoChange, onRunningChange }: Props) {
  const audio = useRef<AudioContext | null>(null);
  const [draft, setDraft] = useState(String(tempo));
  const [beat, setBeat] = useState(0);
  useEffect(() => { setDraft(String(tempo)); }, [tempo]);

  useEffect(() => {
    if (!running || !audio.current) { setBeat(0); return; }
    const context = audio.current;
    let nextBeat = 1;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setBeat(nextBeat);
      const now = context.currentTime;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = nextBeat === 1 ? 1200 : 1000;
      nextBeat = nextBeat % beatsPerMeasure + 1;
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.04);
      timer = setTimeout(tick, 60000 / tempo);
    };
    tick();
    return () => clearTimeout(timer);
  }, [running, tempo, beatsPerMeasure]);

  useEffect(() => () => { audio.current?.close(); }, []);

  const toggle = () => {
    if (!running) {
      const context = audio.current ||= new (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!)();
      context.resume();
    }
    onRunningChange(!running);
  };

  return <div className="metronome" role="group" aria-label="Metronome">
    <label>METRONOME TEMPO <input aria-label="Metronome tempo" type="number" min="40" max="240" value={draft} onChange={e => {
      const value = e.currentTarget.valueAsNumber;
      setDraft(e.currentTarget.value);
      if (Number.isInteger(value) && value >= 40 && value <= 240) onTempoChange(value);
    }} onBlur={() => setDraft(String(tempo))}/></label><span>BPM</span>
    <label>BEATS PER MEASURE <select aria-label="Beats per measure" value={beatsPerMeasure} onChange={e => onBeatsPerMeasureChange(Number(e.target.value))}>{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}</select></label>
    <button type="button" onClick={toggle}>{running ? 'Stop metronome' : 'Start metronome'}</button>
    <span className="metronome-beat" data-testid="metronome-beat" data-beat={beat} aria-hidden="true">{Array.from({ length: beatsPerMeasure }, (_, i) => <span key={i} className={beat === i + 1 ? 'active' : undefined} />)}</span>
  </div>;
}
