// types/gl-chromakey.d.ts
declare module 'gl-chromakey' {
    interface ChromaKeyOptions {
      video: HTMLVideoElement;
      canvas?: HTMLCanvasElement;
      color?: [number, number, number];
      similarity?: number;
      smoothness?: number;
      key?: string;
    }
  
    interface ChromaKeyInstance {
      start: () => void;
      stop: () => void;
      color: (color: [number, number, number]) => void;
      similarity: (similarity: number) => void;
      smoothness: (smoothness: number) => void;
    }
  
    function chromakey(opts: ChromaKeyOptions): ChromaKeyInstance;
  
    export default chromakey;
  }