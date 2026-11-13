import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SignatureCanvasComponent } from './signature-canvas.component';
import { DownloadService } from '../../services/download.service';
import { TextSignatureService, datosDeTrazado } from '../../services/text-signature.service';

type Punto = { x: number; y: number };

function puntero(tipo: string, x: number, y: number, pointerType = 'mouse'): PointerEvent {
  return new PointerEvent(tipo, {
    pointerId: 1, pointerType, isPrimary: true, button: 0, buttons: tipo === 'pointerup' ? 0 : 1,
    clientX: x, clientY: y, bubbles: true, cancelable: true,
  });
}

describe('SignatureCanvasComponent: trazado', () => {
  let fixture: ComponentFixture<SignatureCanvasComponent>;
  let canvas: HTMLCanvasElement;
  let descarga: jasmine.Spy;

  /** Traza una línea entre dos puntos de pantalla y devuelve los puntos que quedaron en el SVG. */
  function trazar(desde: Punto, hasta: Punto, tipo = 'mouse'): Punto[] {
    canvas.dispatchEvent(puntero('pointerdown', desde.x, desde.y, tipo));
    canvas.dispatchEvent(puntero('pointermove', hasta.x, hasta.y, tipo));
    canvas.dispatchEvent(puntero('pointerup', hasta.x, hasta.y, tipo));
    fixture.componentInstance.downloadSVG();
    return descarga.calls.mostRecent().args[1][0];
  }

  beforeEach(() => {
    descarga = spyOn(TestBed.inject(DownloadService), 'downloadAsSVG');
    fixture = TestBed.createComponent(SignatureCanvasComponent);
    fixture.detectChanges();
    canvas = fixture.nativeElement.querySelector('canvas');
  });

  it('traza con eventos de puntero y los convierte a coordenadas del lienzo', () => {
    const r = canvas.getBoundingClientRect();
    const k = canvas.width / r.width;
    const puntos = trazar({ x: r.left + 10, y: r.top + 20 }, { x: r.left + 60, y: r.top + 50 });
    expect(puntos.length).toBe(2);
    expect(puntos[0].x).toBeCloseTo(10 * k, 3);
    expect(puntos[0].y).toBeCloseTo(20 * k, 3);
    expect(puntos[1].x).toBeCloseTo(60 * k, 3);
    expect(fixture.componentInstance.hasSignature()).toBeTrue();
  });

  it('firma con ratón, tacto y lápiz sin depender de TouchEvent (Firefox de escritorio no lo define)', () => {
    const original = (window as any).TouchEvent;
    (window as any).TouchEvent = undefined;
    try {
      const r = canvas.getBoundingClientRect();
      for (const tipo of ['mouse', 'touch', 'pen']) {
        fixture.componentInstance.clearCanvas();
        const puntos = trazar({ x: r.left + 5, y: r.top + 5 }, { x: r.left + 25, y: r.top + 35 }, tipo);
        expect(puntos.length).withContext(tipo).toBe(2);
      }
    } finally {
      (window as any).TouchEvent = original;
    }
  });

  it('la tinta cae bajo el puntero aunque la página se haya desplazado después de cargar', () => {
    const relleno = document.createElement('div');
    relleno.style.height = '4000px';
    document.body.appendChild(relleno);
    try {
      const antes = canvas.getBoundingClientRect();
      window.scrollTo(0, 120);
      const r = canvas.getBoundingClientRect();
      expect(antes.top - r.top).withContext('la página se movió').toBeGreaterThan(50);
      const k = canvas.width / r.width;
      const puntos = trazar({ x: r.left + 10, y: r.top + 20 }, { x: r.left + 60, y: r.top + 50 });
      expect(puntos[0].x).toBeCloseTo(10 * k, 3);
      expect(puntos[0].y).toBeCloseTo(20 * k, 3);
    } finally {
      window.scrollTo(0, 0);
      relleno.remove();
    }
  });

  it('ignora los botones secundarios del ratón', () => {
    const r = canvas.getBoundingClientRect();
    canvas.dispatchEvent(new PointerEvent('pointerdown', {
      pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 2, clientX: r.left + 5, clientY: r.top + 5, bubbles: true,
    }));
    expect(fixture.componentInstance.hasSignature()).toBeFalse();
  });
});

describe('SignatureCanvasComponent: aviso de descarga', () => {
  it('retira el sello al cambiar de formato para que sello y aviso no se contradigan', () => {
    const fixture = TestBed.createComponent(SignatureCanvasComponent);
    fixture.detectChanges();
    const c = fixture.componentInstance;
    c.ultimaDescarga = 'svg';
    c.cambiarFormato('png');
    fixture.detectChanges();
    expect(c.ultimaDescarga).toBeNull();
    expect(fixture.nativeElement.querySelector('.sello')).toBeNull();
  });
});

describe('SignatureCanvasComponent: escribir el nombre', () => {
  let fixture: ComponentFixture<SignatureCanvasComponent>;
  let c: SignatureCanvasComponent;
  let canvas: HTMLCanvasElement;
  let descargas: DownloadService;

  async function escribir(nombre: string): Promise<void> {
    c.cambiarModo('escribir');
    await TestBed.inject(TextSignatureService).cargar();
    c.escribir(nombre);
    fixture.detectChanges();
  }

  beforeEach(() => {
    descargas = TestBed.inject(DownloadService);
    spyOn(descargas, 'downloadAsPNG');
    spyOn(descargas, 'downloadAsSVG');
    spyOn(descargas, 'downloadTextAsSVG');
    fixture = TestBed.createComponent(SignatureCanvasComponent);
    fixture.detectChanges();
    c = fixture.componentInstance;
    canvas = fixture.nativeElement.querySelector('canvas');
  });

  it('sin nombre escrito no descarga una firma vacía', async () => {
    await escribir('   ');
    expect(c.hasSignature()).toBeFalse();
    c.downloadPNG();
    c.downloadSVG();
    expect(descargas.downloadAsPNG).not.toHaveBeenCalled();
    expect(descargas.downloadTextAsSVG).not.toHaveBeenCalled();
  });

  it('exporta el nombre (con tildes y ñ) en un lienzo del mismo tamaño, transparente y en tinta negra', async () => {
    await escribir('José Ñandú Íñiguez');
    expect(c.hasSignature()).toBeTrue();

    c.downloadPNG();
    const exportado = (descargas.downloadAsPNG as jasmine.Spy).calls.mostRecent().args[0] as HTMLCanvasElement;
    expect([exportado.width, exportado.height]).toEqual([canvas.width, canvas.height]);
    const px = exportado.getContext('2d')!.getImageData(0, 0, exportado.width, exportado.height).data;
    let opacos = 0;
    for (let i = 0; i < px.length; i += 4) {
      if (px[i + 3] === 255) { opacos++; expect([px[i], px[i + 1], px[i + 2]]).toEqual([0, 0, 0]); }
    }
    expect(opacos).toBeGreaterThan(200);
    expect(px[3]).withContext('esquina transparente').toBe(0);

    c.downloadSVG();
    const [ancho, alto, d] = (descargas.downloadTextAsSVG as jasmine.Spy).calls.mostRecent().args;
    expect([ancho, alto]).toEqual([canvas.width, canvas.height]);
    expect(d).toMatch(/^M/);
    expect(d.length).toBeGreaterThan(500);
  });

  it('el SVG de un nombre no se corta: sin NaN y con la misma caja que la tinta (María Fernanda a 800×450)', async () => {
    const servicio = TestBed.inject(TextSignatureService);
    const fuente = await servicio.cargar();
    for (const nombre of ['María Fernanda', 'José Ñandú Íñiguez', 'Ana']) {
      const trazados = servicio.disponer(fuente, nombre, 800, 450);
      const d = datosDeTrazado(trazados);
      expect(d).withContext(nombre).not.toContain('NaN');
      const numeros = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
      const ordenes = (d.match(/[MLCQZ]/g) ?? []).length;
      const esperadas = trazados.reduce((s, t) => s + t.commands.length, 0);
      expect(ordenes).withContext(nombre + ': todas las órdenes del trazado').toBe(esperadas);
      expect(numeros.every(Number.isFinite)).withContext(nombre).toBeTrue();
      const xs = numeros.filter((_, i) => i % 2 === 0);
      const caja = trazados.map((t) => t.getBoundingBox());
      expect(Math.max(...xs)).withContext(nombre + ': llega al final del nombre').toBeGreaterThan(Math.max(...caja.map((b) => b.x2)) - 1);
    }
  });

  it('un nombre largo cabe entero en el lienzo, en una o dos líneas', async () => {
    const servicio = TestBed.inject(TextSignatureService);
    const fuente = await servicio.cargar();
    const nombre = 'María Fernanda de los Ángeles Rodríguez Hernández de la Peña';
    for (const [ancho, alto] of [[800, 450], [324, 213], [274, 183]]) {
      const trazados = servicio.disponer(fuente, nombre, ancho, alto);
      expect(trazados.length).withContext(`${ancho}x${alto}`).toBeGreaterThan(0);
      for (const t of trazados) {
        const b = t.getBoundingBox();
        expect(b.x1).toBeGreaterThanOrEqual(0);
        expect(b.x2).toBeLessThanOrEqual(ancho);
        expect(b.y1).toBeGreaterThanOrEqual(0);
        expect(b.y2).toBeLessThanOrEqual(alto);
      }
    }
  });

  it('Limpiar borra el texto del modo activo y conserva lo dibujado; cambiar de modo no pierde nada', async () => {
    const r = canvas.getBoundingClientRect();
    canvas.dispatchEvent(puntero('pointerdown', r.left + 10, r.top + 10));
    canvas.dispatchEvent(puntero('pointermove', r.left + 80, r.top + 60));
    canvas.dispatchEvent(puntero('pointerup', r.left + 80, r.top + 60));
    expect(c.hasSignature()).toBeTrue();

    await escribir('Ana');
    expect(c.hasSignature()).toBeTrue();
    c.cambiarModo('dibujar');
    expect(c.hasSignature()).withContext('lo dibujado sigue ahí').toBeTrue();
    c.cambiarModo('escribir');
    expect(c.nombre).withContext('lo escrito sigue ahí').toBe('Ana');
    expect(c.hasSignature()).toBeTrue();

    c.limpiar();
    expect(c.nombre).toBe('');
    expect(c.hasSignature()).toBeFalse();
    c.cambiarModo('dibujar');
    expect(c.hasSignature()).withContext('Limpiar en «Escribir» no borra el dibujo').toBeTrue();
  });
});
