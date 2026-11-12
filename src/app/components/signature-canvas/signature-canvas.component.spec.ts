import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SignatureCanvasComponent } from './signature-canvas.component';
import { DownloadService } from '../../services/download.service';

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
