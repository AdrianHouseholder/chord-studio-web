# Playing Chord Studio

Hold a chord pad or its displayed key to play; release it to stop. Hold multiple pads or keys to layer chords. The seven pads represent I, ii, iii, IV, V, vi, and vii° in the selected major key.

## Tour and appearance

The guided tour opens on the first visit. Its eight steps cover, in order: audio visualizer, sound controls, chord joystick, pitch bend, keyboard bindings, playing chords, chord sustain, and stopping/resetting. Use Next and Back, or dismiss with Close, Finish, or Escape. Dismissal is saved when localStorage is available; otherwise it can reappear on reload. **Start guided tour** in the header reopens it at the beginning. Tour progress is not saved, and opening it does not stop audio.

Choose Mint, Salmon, Orange, Lavender, or Sky in the header. Mint is the default. The choice persists in localStorage when available; otherwise it lasts for the current session.

## Sound controls

| Control | Choices and behavior |
| --- | --- |
| Key | Any of the 12 major keys; changes sounding chords too. |
| Voice | Warm (triangle), Soft (sine), Bright (sawtooth), Pulse (square), Organ and Bell (distinct harmonic waveforms); changes sounding chords too. |
| Volume | Adjusts all currently playing notes and new notes. |
| Reverb | Off, Room, Hall, Dreamy; adds a wet tail to the dry sound and applies to playing chords. |
| Chord Color | Original triad, diatonic 7th, Sus4, Sus2, diatonic 6th, or Add9; changes sounding chords too. Added tones follow the selected major scale, so their intervals vary by chord. |

On reload these controls return to C major, Warm, volume 0.4, Off, and Original respectively.

## Pads, sustain, and bindings

- Drag a pressed pointer across pads to move between chords; leaving the pads releases that pointer's chord. Multiple input sources can hold a chord at once.
- Enable a chord's **Sustain** before playing to keep it sounding after release. Press the latched chord again to silence it without disabling Sustain. Turning Sustain off stops an unheld chord; a held chord stops when released.
- Right-click a pad, then press a key to bind it. Escape or Cancel dismisses the prompt. Bindings are case-insensitive; reusing a key unbinds its previous chord, shown as `—`. Modifier keys and modifier shortcuts are reserved. Changes persist when localStorage is available. Defaults are 1–7.
- A focused pad can also be held with Space or Enter. Keyboard input is ignored while editing a select or input. An arrow bound to a chord takes priority over the joystick.
- Losing window focus releases held inputs; sustained chords continue. The joystick returns to center.

## Chord joystick

Drag the joystick with a pointer or hold unassigned arrow keys. It affects every sounding chord. One vertical and one horizontal arrow combine into a diagonal; when opposite arrows are held, the last pressed on that axis wins until released.

| Direction | Change |
| --- | --- |
| Up | Toggle major/minor third. |
| Right | Add a diatonic seventh. |
| Left | Replace the third with a diatonic fourth. |
| Down | Add a diatonic sixth. |
| Up-right | Toggle the third and add a seventh. |
| Up-left | Replace the third with a diatonic second. |
| Down-left | Replace the third with a fourth and add a sixth. |
| Down-right | Add a seventh and a sixth. |

The chosen chord color remains in effect, with these exceptions: Up and Up-right replace a suspension with the toggled third; Up-left uses the second; Left and Down-left use the fourth unless the selected color is Sus2, which takes precedence. Extensions are deduplicated. **Sustain joystick** retains a dragged direction on pointer release; switching it off centers the joystick. Arrow keys center on release regardless of this setting. Pointer cancellation or window blur also centers it. This setting is separate from chord sustain.

## Pitch bend

The vertical **Pitch bend** slider to the right of the joystick adjusts pitch continuously from −2 to +2 semitones; 0 is normal pitch. It affects held and sustained chords immediately and applies to future notes. Use the arrow keys when the slider is focused; chord bindings and joystick arrows do not interfere. **Reset pitch bend** returns the slider and sounding notes to 0 immediately. The setting stays where placed until changed, including after Turn Everything Off, and resets to 0 on reload.

## Display and stop

The screen labels the actual intervals of the most recently activated sounding chord (including major sevenths and half-diminished sevenths), selected key, and color; it says **Ready to play** when no chord is active. Switch the visualizer between Waveform and Spectrum; it monitors the combined output without changing sound. Its animation pauses when the page is hidden. With reduced motion enabled, it draws on state or display changes rather than continuously.

**Turn Everything Off** silences chords and reverb tails, releases inputs, disables both kinds of sustain, and centers the joystick. It leaves sound settings, theme, and bindings unchanged; play again immediately.

**Reset Configuration** also stops sound and releases inputs, then restores the initial key, voice, volume, chord color, reverb, pitch, joystick, sustain, and keyboard bindings. Theme, tour dismissal, and unrelated browser storage are preserved. If storage is unavailable, default bindings apply for the current session.

[Back to overview](../README.md) · [Architecture and development](architecture.md)
