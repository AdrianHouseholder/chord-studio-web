const scale = [0, 2, 4, 5, 7, 9, 11];
export const noteNames = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
const degreeNote = (degree) => scale[degree % 7] + 12 * Math.floor(degree / 7);
export function chordNotes(key, degree, variation = 'triad', direction = 'center') {
  const root = 60 + key;
  const notes = [degreeNote(degree), degreeNote(degree + 2), degreeNote(degree + 4)];
  if (variation === 'sus4' || direction === 'left' || direction === 'down-left') notes[1] = degreeNote(degree + 3);
  if (variation === 'sus2' || direction === 'up-left') notes[1] = degreeNote(degree + 1);
  if (direction === 'up' || direction === 'up-right') {
    const third = degreeNote(degree + 2) - notes[0];
    notes[1] = notes[0] + (third === 3 ? 4 : 3);
  }
  if (variation === 'seventh' || direction === 'right' || direction.endsWith('-right')) notes.push(degreeNote(degree + 6));
  if (variation === 'sixth' || direction === 'down' || direction.startsWith('down-')) notes.push(degreeNote(degree + 5));
  if (variation === 'add9') notes.push(degreeNote(degree + 8));
  return [...new Set(notes)].map(n => root + n);
}

export function chordName(notes) {
  const intervals = notes.slice(1).map(n => n - notes[0]);
  const third = intervals[0], fifth = intervals[1];
  const seventh = intervals.find(n => n === 10 || n === 11);
  let quality = third === 3 ? (fifth === 6 ? (seventh === 10 ? 'ø' : 'dim') : 'm') : '';
  if (third !== 3 && third !== 4) quality = third === 1 ? ' sus♭2' : third === 2 ? ' sus2' : third === 5 ? ' sus4' : ' sus♯4';
  const extension = seventh ? (quality === 'ø' ? '7' : seventh === 11 ? ' maj7' : ' 7') : '';
  const alteredFifth = fifth === 6 && quality !== 'dim' && quality !== 'ø' ? ' ♭5' : '';
  return `${noteNames[notes[0] % 12]}${quality}${extension}${alteredFifth}${intervals.includes(8) ? ' ♭6' : intervals.includes(9) ? ' 6' : ''}${intervals.includes(13) ? ' add♭9' : intervals.includes(14) ? ' add9' : intervals.includes(15) ? ' add♯9' : ''}`;
}
