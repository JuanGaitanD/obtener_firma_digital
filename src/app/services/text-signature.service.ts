import { Injectable } from '@angular/core';
import type { Font, Path } from 'opentype.js/dist/opentype.mjs';

const n2 = (v: number | undefined): string => String(Math.round((v ?? 0) * 100) / 100);

/**
 * Datos de trazado SVG con dos decimales. No se usa `Path.toPathData(2)` de opentype.js 2.0.0:
 * con valores como 269.00000000000006 su redondeo devuelve NaN y corta la firma.
 */
export function datosDeTrazado(trazados: Path[]): string {
  const partes: string[] = [];
  for (const t of trazados) {
    for (const c of t.commands) {
      if (c.type === 'Z') partes.push('Z');
      else if (c.type === 'C') partes.push(`C${n2(c.x1)} ${n2(c.y1)} ${n2(c.x2)} ${n2(c.y2)} ${n2(c.x)} ${n2(c.y)}`);
      else if (c.type === 'Q') partes.push(`Q${n2(c.x1)} ${n2(c.y1)} ${n2(c.x)} ${n2(c.y)}`);
      else partes.push(`${c.type}${n2(c.x)} ${n2(c.y)}`);
    }
  }
  return partes.join('');
}

/** Tinta de la firma: la misma que el trazo dibujado. */
export const TINTA = '#000000';

const RUTA_FUENTE = 'fonts/la-belle-aurore-latin-400-normal.woff';

// Zona del lienzo (fracción del alto) donde se coloca la firma escrita:
// la línea de firma de la guía está al 72 %; arriba queda el campo de texto.
const BASE = 0.71;
const TOPE_ARRIBA = 0.4;
const TOPE_ABAJO = 0.97;
const MARGEN_X = 0.06;
const TAMANO_MAXIMO = 0.3; // del alto
const PASO_LINEAS = 0.9; // entre líneas, en em
const TAMANO_MINIMO_UNA_LINEA = 0.16; // por debajo, un nombre largo pasa a dos líneas

/**
 * Convierte un nombre en trazados (no en texto): la misma geometría alimenta la vista previa,
 * el PNG y el SVG, así que el SVG se ve igual sin tener la fuente instalada.
 * opentype.js (y la fuente) se descargan la primera vez que se pide escribir.
 */
@Injectable({ providedIn: 'root' })
export class TextSignatureService {
  private fuente?: Promise<Font>;

  cargar(): Promise<Font> {
    this.fuente ??= this.descargar().catch((e) => {
      this.fuente = undefined; // permite reintentar
      throw e;
    });
    return this.fuente;
  }

  private async descargar(): Promise<Font> {
    const [opentype, respuesta] = await Promise.all([import('opentype.js/dist/opentype.mjs'), fetch(RUTA_FUENTE)]);
    if (!respuesta.ok) throw new Error(`No se pudo cargar la tipografía (${respuesta.status})`);
    return opentype.parse(await respuesta.arrayBuffer());
  }

  /** Trazados del nombre ajustados a un lienzo de ancho × alto; vacío si no hay nada que dibujar. */
  disponer(font: Font, texto: string, ancho: number, alto: number): Path[] {
    const limpio = [...texto.normalize('NFC').replace(/\s+/g, ' ').trim()]
      .filter((c) => font.charToGlyphIndex(c) !== 0)
      .join('')
      .trim();
    if (!limpio) return [];

    const una = this.ajustar(font, [limpio], ancho, alto);
    const corte = this.puntoDeCorte(limpio);
    if (una.tamano >= TAMANO_MINIMO_UNA_LINEA * alto || corte < 0) return una.trazados;
    const dos = this.ajustar(font, [limpio.slice(0, corte), limpio.slice(corte + 1)], ancho, alto);
    return dos.tamano > una.tamano ? dos.trazados : una.trazados;
  }

  /** Espacio más cercano a la mitad del texto. */
  private puntoDeCorte(texto: string): number {
    let mejor = -1;
    for (let i = 0; i < texto.length; i++) {
      if (texto[i] === ' ' && (mejor < 0 || Math.abs(i - texto.length / 2) < Math.abs(mejor - texto.length / 2))) mejor = i;
    }
    return mejor;
  }

  private ajustar(font: Font, lineas: string[], ancho: number, alto: number): { tamano: number; trazados: Path[] } {
    const n = lineas.length;
    const medidas = lineas.map((l) => font.getPath(l, 0, 0, 100).getBoundingBox());
    const base = BASE * alto;
    const anchoMax = Math.max(...medidas.map((m) => m.x2 - m.x1));
    // distancia desde la última línea base hasta lo más alto de la tinta, y hasta lo más bajo
    const arriba = Math.max(...medidas.map((m, i) => (n - 1 - i) * PASO_LINEAS * 100 - m.y1));
    const abajo = Math.max(medidas[n - 1].y2, 1);
    const escala = Math.min(
      (ancho * (1 - 2 * MARGEN_X)) / anchoMax,
      (base - TOPE_ARRIBA * alto) / arriba,
      (TOPE_ABAJO * alto - base) / abajo,
      (TAMANO_MAXIMO * alto) / 100,
    );
    const tamano = 100 * escala;
    const trazados = lineas.map((l, i) => {
      const x = ancho / 2 - (escala * (medidas[i].x1 + medidas[i].x2)) / 2;
      const y = base - (n - 1 - i) * PASO_LINEAS * tamano;
      const trazado = font.getPath(l, x, y, tamano);
      trazado.fill = TINTA;
      return trazado;
    });
    return { tamano, trazados };
  }
}
