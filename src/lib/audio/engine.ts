"use client";

/**
 * CASEFILES sound engine — fully procedural WebAudio.
 *
 * Nothing here is a sample. Rain is shaped noise, thunder is a filtered
 * burst with a long tail, the score is a generative lo-fi noir progression
 * played on synthesized keys over a walking bass and vinyl crackle.
 * Every interaction sound is synthesized at call time.
 */

type WeatherKind = "rain" | "storm" | "fog" | "snow" | "clear" | "wind";
export type MusicMode = "noir" | "title" | "tension" | "off";

interface Levels {
  master: number;
  music: number;
  ambience: number;
  sfx: number;
}

const CHORDS: number[][] = [
  // Dm9        Gm7          Bbmaj7       A7b9
  [146.83, 220, 261.63, 329.63, 392],
  [196, 233.08, 293.66, 349.23],
  [233.08, 293.66, 349.23, 440],
  [220, 277.18, 329.63, 415.3],
];
const BASS_WALK: number[][] = [
  [73.42, 82.41, 87.31, 82.41],
  [98, 110, 116.54, 110],
  [116.54, 110, 98, 87.31],
  [110, 103.83, 98, 92.5],
];
const MELODY_POOL = [440, 523.25, 587.33, 698.46, 783.99, 880];

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private ambBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;

  private levels: Levels = { master: 0.8, music: 0.7, ambience: 0.8, sfx: 0.9 };
  private unlocked = false;

  private rainNodes: AudioNode[] = [];
  private rainGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private thunderTimer: ReturnType<typeof setTimeout> | null = null;
  private currentWeather: WeatherKind | null = null;
  /** while a stage is showing lightning, it owns the thunder too */
  private stormClaims = 0;

  private musicMode: MusicMode = "off";
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private crackleNodes: AudioNode[] = [];
  private chordIndex = 0;
  private nextBarTime = 0;

  /* -------------------------------------------------- lifecycle ---- */

  unlock() {
    if (typeof window === "undefined") return;
    if (this.unlocked && this.ctx?.state === "running") return;
    if (!this.ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
      this.musicBus = this.ctx.createGain();
      this.ambBus = this.ctx.createGain();
      this.sfxBus = this.ctx.createGain();
      this.musicBus.connect(this.master);
      this.ambBus.connect(this.master);
      this.sfxBus.connect(this.master);
      this.applyLevels();
    }
    void this.ctx.resume();
    this.unlocked = true;
    // restart whatever scene was requested before unlock
    if (this.currentWeather) this.setWeather(this.currentWeather, true);
    if (this.musicMode !== "off") this.setMusic(this.musicMode, true);
  }

  setLevels(levels: Partial<Levels>) {
    this.levels = { ...this.levels, ...levels };
    this.applyLevels();
  }

  private applyLevels() {
    if (!this.ctx || !this.master || !this.musicBus || !this.ambBus || !this.sfxBus) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.levels.master, t, 0.1);
    this.musicBus.gain.setTargetAtTime(this.levels.music * 0.5, t, 0.1);
    this.ambBus.gain.setTargetAtTime(this.levels.ambience * 0.6, t, 0.1);
    this.sfxBus.gain.setTargetAtTime(this.levels.sfx, t, 0.1);
  }

  /* -------------------------------------------------- ambience ----- */

  setWeather(kind: WeatherKind, force = false) {
    if (this.currentWeather === kind && !force) return;
    this.currentWeather = kind;
    if (!this.ctx || !this.ambBus) return;
    this.stopAmbience();

    const ctx = this.ctx;
    const noiseBuf = this.makeNoise(4);

    if (kind === "rain" || kind === "storm") {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      src.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 1800;
      bp.Q.value = 0.4;
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 400;
      const g = ctx.createGain();
      g.gain.value = 0;
      src.connect(bp).connect(hp).connect(g).connect(this.ambBus);
      src.start();
      g.gain.setTargetAtTime(kind === "storm" ? 0.5 : 0.32, ctx.currentTime, 1.2);
      this.rainNodes.push(src, bp, hp, g);
      this.rainGain = g;
      if (kind === "storm") this.scheduleThunder();
    }

    if (kind === "wind" || kind === "fog" || kind === "snow" || kind === "storm") {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      src.loop = true;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = kind === "fog" ? 160 : 320;
      const g = ctx.createGain();
      g.gain.value = 0;
      src.connect(lp).connect(g).connect(this.ambBus);
      src.start();
      g.gain.setTargetAtTime(kind === "fog" ? 0.35 : 0.22, ctx.currentTime, 2);
      // slow LFO on the filter for gusts
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.07;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = kind === "fog" ? 40 : 120;
      lfo.connect(lfoGain).connect(lp.frequency);
      lfo.start();
      this.rainNodes.push(src, lp, g, lfo, lfoGain);
      this.windGain = g;
    }

    if (kind === "clear") {
      // distant city hum
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      src.loop = true;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 120;
      const g = ctx.createGain();
      g.gain.value = 0;
      src.connect(lp).connect(g).connect(this.ambBus);
      src.start();
      g.gain.setTargetAtTime(0.12, ctx.currentTime, 2);
      this.rainNodes.push(src, lp, g);
    }
  }

  private scheduleThunder() {
    const fire = () => {
      if (this.currentWeather !== "storm") return;
      if (this.stormClaims === 0) this.thunder(0, 0.8);
      this.thunderTimer = setTimeout(fire, 9000 + Math.random() * 18000);
    };
    this.thunderTimer = setTimeout(fire, 3000 + Math.random() * 8000);
  }

  /** A stage that draws lightning claims the storm so flash and rumble line up. */
  claimStorm(): () => void {
    this.stormClaims++;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.stormClaims = Math.max(0, this.stormClaims - 1);
    };
  }

  /** Thunder after `delay` seconds — near strikes crack, far ones roll. */
  thunder(delay = 0, strength = 0.8) {
    if (!this.ctx || !this.ambBus || !this.unlocked) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + Math.max(0, delay);
    const dur = 2.2 + Math.random() * 2 + delay * 0.6;
    const src = ctx.createBufferSource();
    src.buffer = this.makeNoise(dur);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(delay < 0.6 ? 900 : 420, t0);
    lp.frequency.exponentialRampToValueAtTime(55, t0 + dur);
    const g = ctx.createGain();
    const peak = Math.max(0.05, Math.min(0.9, strength * (delay < 0.6 ? 1 : 0.7)));
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + (delay < 0.6 ? 0.03 : 0.25));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(lp).connect(g).connect(this.ambBus);
    src.start(t0);
    src.stop(t0 + dur + 0.1);
  }

  private stopAmbience() {
    if (this.thunderTimer) {
      clearTimeout(this.thunderTimer);
      this.thunderTimer = null;
    }
    for (const n of this.rainNodes) {
      try {
        if (n instanceof AudioBufferSourceNode || n instanceof OscillatorNode) n.stop();
        n.disconnect();
      } catch {
        /* node already stopped */
      }
    }
    this.rainNodes = [];
    this.rainGain = null;
    this.windGain = null;
  }

  /* -------------------------------------------------- music -------- */

  setMusic(mode: MusicMode, force = false) {
    if (this.musicMode === mode && !force) return;
    this.musicMode = mode;
    this.stopMusic();
    if (mode === "off" || !this.ctx || !this.musicBus) return;

    const ctx = this.ctx;

    // vinyl crackle bed
    const crackle = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() < 0.0015 ? (Math.random() * 2 - 1) * 0.6 : (Math.random() * 2 - 1) * 0.012;
    }
    crackle.buffer = buf;
    crackle.loop = true;
    const cg = ctx.createGain();
    cg.gain.value = 0.25;
    crackle.connect(cg).connect(this.musicBus);
    crackle.start();
    this.crackleNodes.push(crackle, cg);

    this.chordIndex = 0;
    this.nextBarTime = ctx.currentTime + 0.2;
    const barLen = mode === "tension" ? 3.2 : 4.0;
    this.musicTimer = setInterval(() => {
      if (!this.ctx) return;
      while (this.nextBarTime < this.ctx.currentTime + 0.5) {
        this.playBar(this.nextBarTime, barLen, mode);
        this.nextBarTime += barLen;
        this.chordIndex = (this.chordIndex + 1) % CHORDS.length;
      }
    }, 250);
  }

  private playBar(t: number, barLen: number, mode: MusicMode) {
    if (!this.ctx || !this.musicBus) return;
    const ctx = this.ctx;
    const chord = CHORDS[this.chordIndex];
    const bass = BASS_WALK[this.chordIndex];

    // keys — soft detuned triangles through a warm lowpass
    const pad = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = mode === "tension" ? 700 : 1100;
    pad.connect(lp).connect(this.musicBus);
    pad.gain.setValueAtTime(0.0001, t);
    pad.gain.linearRampToValueAtTime(mode === "title" ? 0.16 : 0.12, t + 0.4);
    pad.gain.setTargetAtTime(0.0001, t + barLen - 0.8, 0.4);
    for (const f of chord) {
      for (const det of [-4, 3]) {
        const o = ctx.createOscillator();
        o.type = "triangle";
        o.frequency.value = f;
        o.detune.value = det;
        o.connect(pad);
        o.start(t);
        o.stop(t + barLen);
      }
    }

    // walking bass — one note per beat
    const beat = barLen / 4;
    bass.forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = ctx.createGain();
      const t0 = t + i * beat;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.22, t0 + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + beat * 0.9);
      o.connect(g).connect(this.musicBus!);
      o.start(t0);
      o.stop(t0 + beat);
    });

    // brushed hats — filtered noise ticks on off-beats
    for (let i = 0; i < 4; i++) {
      if (Math.random() < 0.25) continue;
      const t0 = t + i * beat + beat / 2;
      const src = ctx.createBufferSource();
      src.buffer = this.makeNoise(0.08);
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 6000;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.05, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.07);
      src.connect(hp).connect(g).connect(this.musicBus!);
      src.start(t0);
      src.stop(t0 + 0.09);
    }

    // sparse melody — a lonely horn-ish note now and then
    if (Math.random() < (mode === "title" ? 0.55 : 0.35)) {
      const f = MELODY_POOL[Math.floor(Math.random() * MELODY_POOL.length)];
      const o = ctx.createOscillator();
      o.type = "sine";
      const o2 = ctx.createOscillator();
      o2.type = "triangle";
      o2.frequency.value = f;
      o.frequency.value = f;
      const g = ctx.createGain();
      const t0 = t + beat * (1 + Math.floor(Math.random() * 2));
      const len = beat * (1.2 + Math.random());
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.07, t0 + 0.15);
      g.gain.setTargetAtTime(0.0001, t0 + len * 0.6, 0.3);
      const vib = ctx.createOscillator();
      vib.frequency.value = 5;
      const vibG = ctx.createGain();
      vibG.gain.value = 4;
      vib.connect(vibG).connect(o.frequency);
      o.connect(g);
      o2.connect(g);
      g.connect(this.musicBus!);
      o.start(t0);
      o2.start(t0);
      vib.start(t0);
      o.stop(t0 + len);
      o2.stop(t0 + len);
      vib.stop(t0 + len);
    }
  }

  private stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    for (const n of this.crackleNodes) {
      try {
        if (n instanceof AudioBufferSourceNode) n.stop();
        n.disconnect();
      } catch {
        /* already stopped */
      }
    }
    this.crackleNodes = [];
  }

  /* -------------------------------------------------- sfx ---------- */

  ui(name:
    | "click" | "page" | "paper" | "evidence" | "statement" | "contradiction"
    | "pin" | "travel" | "type" | "wrong" | "reveal" | "hover" | "stamp" | "tick"
  ) {
    if (!this.ctx || !this.sfxBus || !this.unlocked) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const out = this.sfxBus;

    const blip = (freq: number, dur: number, gain: number, type: OscillatorType = "sine", slide = 0) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(out);
      o.start(t);
      o.stop(t + dur + 0.02);
    };
    const noise = (dur: number, gain: number, freq: number, type: BiquadFilterType = "bandpass") => {
      const src = ctx.createBufferSource();
      src.buffer = this.makeNoise(dur);
      const f = ctx.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f).connect(g).connect(out);
      src.start(t);
      src.stop(t + dur + 0.02);
    };

    switch (name) {
      case "click":
        blip(1200, 0.06, 0.12, "square", -400);
        break;
      case "hover":
        blip(1800, 0.03, 0.03, "sine");
        break;
      case "page":
        noise(0.16, 0.1, 3000, "highpass");
        break;
      case "paper":
        noise(0.25, 0.14, 2200, "bandpass");
        noise(0.12, 0.08, 5000, "highpass");
        break;
      case "type":
        blip(2400 + Math.random() * 800, 0.03, 0.05, "square", -800);
        break;
      case "tick":
        noise(0.014, 0.035, 3200 + Math.random() * 1400, "highpass");
        break;
      case "pin":
        blip(600, 0.05, 0.15, "square", 300);
        noise(0.06, 0.1, 4000, "highpass");
        break;
      case "evidence":
        blip(523.25, 0.35, 0.1);
        setTimeout(() => this.unlocked && this.ui("hover"), 60);
        blip(783.99, 0.45, 0.08);
        break;
      case "statement":
        blip(440, 0.3, 0.09);
        blip(659.25, 0.4, 0.07);
        break;
      case "contradiction": {
        blip(220, 0.5, 0.16, "sawtooth");
        blip(233.08, 0.5, 0.16, "sawtooth");
        noise(0.3, 0.08, 800);
        break;
      }
      case "travel":
        noise(0.8, 0.12, 500, "lowpass");
        break;
      case "wrong":
        blip(196, 0.7, 0.18, "triangle", -60);
        blip(185, 0.7, 0.12, "triangle", -60);
        break;
      case "stamp":
        noise(0.1, 0.3, 300, "lowpass");
        blip(120, 0.15, 0.25, "sine", -60);
        break;
      case "reveal": {
        [261.63, 311.13, 392, 523.25].forEach((f, i) => {
          const o = ctx.createOscillator();
          o.type = "triangle";
          o.frequency.value = f;
          const g = ctx.createGain();
          const t0 = t + i * 0.09;
          g.gain.setValueAtTime(0.0001, t0);
          g.gain.linearRampToValueAtTime(0.12, t0 + 0.05);
          g.gain.setTargetAtTime(0.0001, t0 + 0.8, 0.4);
          o.connect(g).connect(out);
          o.start(t0);
          o.stop(t0 + 2);
        });
        break;
      }
    }
  }

  /* -------------------------------------------------- utils -------- */

  private makeNoise(seconds: number): AudioBuffer {
    const ctx = this.ctx!;
    const buf = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * seconds)), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }
}

export const audio = new AudioEngine();
