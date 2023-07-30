import { createSignal } from "solid-js";

export class Wave {
  waves: Uint8Array[];
  waveGap: number;
  loading: () => boolean;
  setLoading: (v: boolean) => void;
  playing: () => boolean;
  setPlaying: (v: boolean) => void;
  ended: () => boolean;
  setEnded: (v: boolean) => void;
  volume: () => number;
  setGain: (v: number) => void;
  intensity: () => number;
  setIntensity: (v: number) => void;
  audioContext: AudioContext;
  gainNode: GainNode;
  analyser: AnalyserNode;
  source: AudioBufferSourceNode;

  canvas: HTMLCanvasElement;
  canvasContext: CanvasRenderingContext2D;
  width: number;
  height: number;
  yOffset: number;
  ySpeed: number;
  time: number;

  loop: number | undefined;

  constructor(
    url: string | undefined,
    file: File | undefined,
    canvas: HTMLCanvasElement
  ) {
    const [loading, setLoading] = createSignal(false);
    const [playing, setPlaying] = createSignal(false);
    const [ended, setEnded] = createSignal(false);
    const [gain, setGain] = createSignal(100);
    const [intensity, setIntensity] = createSignal(4);

    this.loading = loading;
    this.setLoading = setLoading;
    this.playing = playing;
    this.setPlaying = setPlaying;
    this.ended = ended;
    this.setEnded = setEnded;
    this.volume = gain;
    this.setGain = setGain;
    this.intensity = intensity;
    this.setIntensity = setIntensity;

    this.waves = [];
    this.waveGap = 20;

    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.connect(this.audioContext.destination);
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.analyser);
    this.analyser.fftSize = 512;
    this.source = this.audioContext.createBufferSource();

    if (url) this.loadAudioFromUrl(url);
    if (file) this.loadAudioFromFile(file);

    this.canvas = canvas;
    this.canvasContext = canvas.getContext("2d")!;
    // https://stackoverflow.com/questions/4261090/html5-canvas-and-anti-aliasing
    this.canvasContext.translate(0.5, 0.5);
    this.width = canvas.width;
    this.height = canvas.height;
    this.yOffset = 0;
    this.ySpeed = 100;
    this.time = performance.now();
  }

  async loadAudioFromUrl(url: string) {
    const res = await fetch(url);
    const arrayBuffer = await res.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    this.source.buffer = audioBuffer;
    this.source.connect(this.gainNode);
    this.setLoading(false);
    this.source.onended = () => this.onEnded();

    this.time = performance.now();
    this.loop = requestAnimationFrame(this.step.bind(this));
  }
  
  async loadAudioFromFile(file: File) {
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    this.source.buffer = audioBuffer;
    this.source.connect(this.gainNode);
    this.setLoading(false);
    this.source.onended = () => this.onEnded();

    this.time = performance.now();
    this.loop = requestAnimationFrame(this.step.bind(this));
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

  step(currentTime: number) {
    const dt = currentTime - this.time;
    this.time = currentTime;
    this.draw(dt / 1000);
    requestAnimationFrame(this.step.bind(this));
  }

  updateWaves() {
    const bufferLength = this.analyser.frequencyBinCount;
    const buffer = new Uint8Array(bufferLength);
    this.analyser.getByteTimeDomainData(buffer);
    // this.analyser.getByteFrequencyData(buffer);

    this.waves.push(buffer);
    const maxWavesLength = this.height / this.waveGap + 1;
    if (maxWavesLength < this.waves.length) {
      this.waves.splice(0, this.waves.length - maxWavesLength);
    }
  }

  draw(dt: number) {
    const ctx = this.canvasContext;
    this.yOffset += this.ySpeed * dt;
    if (this.yOffset >= -this.waveGap) {
      this.yOffset -= this.waveGap;
      this.updateWaves();
    }

    const wavePaths: { stroke: Path2D; fill: Path2D }[] = [];
    const wavesLength = this.waves.length;
    this.waves.forEach((wave, _waveIndex) => {
      const length = wave.length;
      const waveIndex = wavesLength - _waveIndex - 1;

      const wavePath = new Path2D();
      wave.forEach((v, idx) => {
        const x = (this.width / (length - 1)) * idx;
        const y =
          this.height -
          (this.waveGap * waveIndex +
            (v / 255) * this.waveGap * this.intensity() +
            this.yOffset);

        if (idx === 0) {
          wavePath.moveTo(x, y);
        } else {
          wavePath.lineTo(x, y);
        }
      });
      const fillPath = new Path2D(wavePath);
      fillPath.lineTo(
        this.width,
        this.height - (this.waveGap * waveIndex + this.yOffset)
      );
      fillPath.lineTo(
        0,
        this.height - (this.waveGap * waveIndex + this.yOffset)
      );
      fillPath.closePath();
      wavePaths.push({ stroke: wavePath, fill: fillPath });
    });

    ctx.clearRect(0, 0, this.width, this.height);
    ctx.fillStyle = "#000";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    wavePaths.forEach(({ stroke, fill }) => {
      ctx.fill(fill);
      ctx.stroke(stroke);
    });
  }
}
