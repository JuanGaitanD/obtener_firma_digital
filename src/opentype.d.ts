// opentype.js 2.0 no trae tipos (se importa el módulo ESM de dist/ porque el campo browser apunta al UMD): solo se declara lo que usa la firma escrita.
declare module 'opentype.js/dist/opentype.mjs' {
  export interface BoundingBox { x1: number; y1: number; x2: number; y2: number }
  export interface PathCommand { type: 'M' | 'L' | 'C' | 'Q' | 'Z'; x?: number; y?: number; x1?: number; y1?: number; x2?: number; y2?: number }
  export class Path {
    fill: string | null;
    commands: PathCommand[];
    getBoundingBox(): BoundingBox;
    toPathData(decimalPlaces?: number): string;
    draw(ctx: CanvasRenderingContext2D): void;
  }
  export class Font {
    getPath(text: string, x: number, y: number, fontSize: number): Path;
    charToGlyphIndex(char: string): number;
  }
  export function parse(buffer: ArrayBuffer): Font;
}
