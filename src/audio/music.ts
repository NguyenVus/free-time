// =========================================================================
// 5. PROCEDURAL WEB AUDIO API SOUND ENGINE (Zero External Assets)
// =========================================================================
export const NOTE_FREQ = {
  B3: 246.94, C4: 261.63, E4: 329.63, F4: 349.23, A4: 440.0, B4: 493.88, C5: 523.25
};

// "Sakura Sakura", the traditional Japanese folk song (public domain). One [note, beats] per
// note; each bar has four beats.
export const SAKURA_MELODY = [
  ['A4', 1], ['A4', 1], ['B4', 2],
  ['A4', 1], ['A4', 1], ['B4', 2],
  ['A4', 1], ['B4', 1], ['C5', 1], ['B4', 1],
  ['A4', 1], ['B4', 0.5], ['A4', 0.5], ['F4', 2],
  ['E4', 1], ['C4', 1], ['E4', 1], ['F4', 1],
  ['E4', 1], ['E4', 0.5], ['C4', 0.5], ['B3', 2],
  ['A4', 1], ['B4', 1], ['C5', 1], ['B4', 1],
  ['A4', 1], ['B4', 0.5], ['A4', 0.5], ['F4', 2],
  ['E4', 1], ['C4', 1], ['E4', 1], ['F4', 1],
  ['E4', 1], ['E4', 0.5], ['C4', 0.5], ['B3', 2],
  ['A4', 1], ['A4', 1], ['B4', 2],
  ['A4', 1], ['A4', 1], ['B4', 2],
  ['E4', 1], ['F4', 1], ['B4', 0.5], ['A4', 0.5], ['F4', 1],
  ['E4', 4]
];
export const MUSIC_BEAT_SECONDS = 0.95;
export const MUSIC_SCHEDULE_AHEAD = 1.5;
export const MUSIC_INTERLUDE_BARS = 8;
export const INTERLUDE_RHYTHMS = [[1, 1, 2], [2, 2], [1, 1, 1, 1], [0.5, 0.5, 1, 2]];
export const BASS_ROOTS = [110.0, 82.41]; // A2, E2

export const noteToFrequency = (note) => {
  const [, letter, sharp, octave] = note.match(/^([A-G])(#?)(\d)$/);
  const semitone = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[letter] + (sharp ? 1 : 0);
  return 440 * Math.pow(2, (semitone + (Number(octave) - 4) * 12 - 9) / 12);
};

// Step patterns: every bar has 16 steps, separated by spaces, and "." is a rest.
// Original compositions for this game. "bass" uses R for the root and O for an octave above.
export const STEPS_PER_BAR = 16;
export const BASS_TONE = { wave: 'triangle', cutoff: 900, gain: 0.3, seconds: 0.24 };
export const BARS_PER_SECTION = 4;
export const MUSIC_TRACK_ORDER = ['festival', 'adventure', 'sakura'];
export const MUSIC_DEFAULT_TRACK = 'festival';
export const MUSIC_TRACK_STORAGE_KEY = 'cherry_music_track';
export const MUSIC_TRACKS = {
  festival: {
    label: '🥁 Nhạc: Lễ Hội',
    bpm: 132,
    lead: { wave: 'sawtooth', cutoff: 2600, gain: 0.17, seconds: 0.34 },
    stab: { wave: 'sawtooth', cutoff: 1500, gain: 0.05, seconds: 0.14 },
    arrangement: ['A', 'A', 'B', 'A'],
    melody: {
      A: [
        'A4 . . C5 . . D5 . E5 . . D5 . C5 . .',
        'A4 . C5 . D5 . C5 . A4 . G4 . E4 . . .',
        'A4 . . C5 . . D5 . E5 . . G5 . E5 . .',
        'D5 . E5 . D5 C5 . A4 . . G4 . A4 . . .'
      ],
      B: [
        'E5 . E5 G5 . E5 D5 . C5 . D5 . E5 . . .',
        'G5 . E5 . D5 . C5 . D5 . . E5 . . . .',
        'A5 . G5 . E5 . G5 . A5 . G5 E5 . D5 . .',
        'C5 . D5 . E5 . D5 C5 A4 . . . A4 . . .'
      ]
    },
    roots: ['A2', 'G2', 'F2', 'G2'],
    chords: [['A3', 'C4', 'E4'], ['G3', 'B3', 'D4'], ['F3', 'A3', 'C4'], ['G3', 'B3', 'D4']],
    bass: 'R . . R . . O . R . . R . O . .',
    stabs: '. . x . . . x . . . x . . . x .',
    kick: 'x . . x . . x . x . . x . . x .',
    snare: '. . . . x . . . . . . . x . . x',
    hat: 'x . x . x . x . x . x . x . x x'
  },
  adventure: {
    label: '🏃 Nhạc: Phiêu Lưu',
    bpm: 118,
    lead: { wave: 'square', cutoff: 3200, gain: 0.11, seconds: 0.3 },
    stab: { wave: 'triangle', cutoff: 2400, gain: 0.09, seconds: 0.2 },
    arrangement: ['A', 'B', 'A', 'B'],
    melody: {
      A: [
        'D5 . F#5 . A5 . F#5 . E5 . D5 . E5 . . .',
        'F#5 . E5 . D5 . B4 . A4 . . B4 . D5 . .',
        'D5 . F#5 . A5 . B5 . A5 . F#5 . E5 . . .',
        'D5 . E5 F#5 . E5 D5 . B4 . D5 . . . . .'
      ],
      B: [
        'A5 . . F#5 . . A5 . B5 . A5 . F#5 . . .',
        'E5 . . D5 . . E5 . F#5 . E5 . D5 . . .',
        'B4 . D5 . E5 . F#5 . A5 . F#5 . E5 . D5 .',
        'E5 . F#5 . E5 . D5 . D5 . . . . . . .'
      ]
    },
    roots: ['D3', 'A2', 'B2', 'G2'],
    chords: [['D4', 'F#4', 'A4'], ['C#4', 'E4', 'A4'], ['B3', 'D4', 'F#4'], ['B3', 'D4', 'G4']],
    bass: 'R . . . O . R . . . R . O . . .',
    stabs: '. . x . . . x . . . x . . x . .',
    kick: 'x . . . . . x . x . . . . . . .',
    snare: '. . . . x . . . . . . . x . . .',
    hat: 'x . x . x . x . x . x . x . x .'
  },
  sakura: { label: '🌸 Nhạc: Anh Đào', calm: true }
};
