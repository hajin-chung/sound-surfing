import { createSignal } from "solid-js";
import { dispatch } from "./util";

export class Wave {
  loading: () => boolean;
  setLoading: (v: boolean) => void;
  playing: () => boolean;
  setPlaying: (v: boolean) => void;
  ended: () => boolean;
  setEnded: (v: boolean) => void;
  volume: () => number;
  setGain: (v: number) => void;
  audioContext: AudioContext;
  gainNode: GainNode;
  analyser: AnalyserNode;
  source: AudioBufferSourceNode;

  loop: number | undefined;

  constructor(url: string | undefined, file: File | undefined) {
    const [loading, setLoading] = createSignal(false);
    const [playing, setPlaying] = createSignal(false);
    const [ended, setEnded] = createSignal(false);
    const [gain, setGain] = createSignal(100);

    this.loading = loading;
    this.setLoading = setLoading;
    this.playing = playing;
    this.setPlaying = setPlaying;
    this.ended = ended;
    this.setEnded = setEnded;
    this.volume = gain;
    this.setGain = setGain;

    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.connect(this.audioContext.destination);
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.analyser);
    this.analyser.fftSize = 512;
    this.source = this.audioContext.createBufferSource();

    if (url) this.loadAudioFromUrl(url);
    if (file) this.loadAudioFromFile(file);

    setInterval(() => {
      this.updateWaves();
    }, 1000 / 10);
  }

  async loadAudioFromUrl(url: string) {
    const res = await fetch(url);
    const arrayBuffer = await res.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    this.source.buffer = audioBuffer;
    this.source.connect(this.gainNode);
    this.setLoading(false);
    this.source.onended = () => this.onEnded();
  }

  async loadAudioFromFile(file: File) {
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    this.source.buffer = audioBuffer;
    this.source.connect(this.gainNode);
    this.setLoading(false);
    this.source.onended = () => this.onEnded();
  }

  play() {
    if (this.loading()) return;
    if (this.playing()) return;

    this.setPlaying(true);
    this.audioContext.resume();
    this.source.start(this.audioContext.currentTime);
  }

  stop() {
    if (this.loading()) return;
    if (!this.playing()) return;

    this.setPlaying(false);
    this.audioContext.suspend();
  }

  setVolume(v: number) {
    this.setGain(v);
    this.gainNode.gain.value = v / 100;
  }

  onEnded() {
    this.setEnded(true);
    this.setPlaying(false);
  }

  updateWaves() {
    const bufferLength = this.analyser.frequencyBinCount;
    const buffer = new Uint8Array(bufferLength);
    this.analyser.getByteTimeDomainData(buffer);
    // this.analyser.getByteFrequencyData(buffer);

    dispatch("wave", buffer);
  }
}
