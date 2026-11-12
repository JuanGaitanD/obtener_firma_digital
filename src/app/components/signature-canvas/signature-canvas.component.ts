import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DownloadService } from '../../services/download.service';
import { TextSignatureService } from '../../services/text-signature.service';
import type { Font, Path } from 'opentype.js/dist/opentype.mjs';

@Component({
  selector: 'app-signature-canvas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './signature-canvas.component.html',
  styleUrl: './signature-canvas.component.css'
})
export class SignatureCanvasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private isDrawing = false;
  private currentPath: Array<{x: number, y: number}> = [];
  private allPaths: Array<Array<{x: number, y: number}>> = [];

  // Firma escrita: lo dibujado y lo escrito conviven; el modo solo decide cuál se ve y cuál se exporta
  modo: 'dibujar' | 'escribir' = 'dibujar';
  nombre = '';
  /** Trazado del nombre para la vista previa (coordenadas del lienzo); vacío si no hay nada que mostrar. */
  vista = '';
  viewBox = '';
  errorFuente = false;
  private fuente?: Font;
  private trazadosTexto: Path[] = [];

  constructor(private downloadService: DownloadService, private textoService: TextSignatureService) {}

  ngAfterViewInit(): void {
    this.canvas = this.canvasRef.nativeElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.setupCanvas();
    this.setupEventListeners();
  }

  ngOnDestroy(): void {
    this.removeEventListeners();
  }

  private setupCanvas(): void {
    const container = this.canvas.parentElement;
    if (container) {
      const containerWidth = container.clientWidth;
      const containerHeight = Math.min(containerWidth * 0.6, window.innerHeight * 0.5);
      
      this.canvas.width = Math.min(containerWidth - 32, 800);
      this.canvas.height = Math.min(containerHeight, 500);
      
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 2;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
    }
  }

  private setupEventListeners(): void {
    // Pointer Events unifican ratón, tacto y lápiz; con touch-action: none el navegador no hace scroll ni zoom
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerEnd);
    this.canvas.addEventListener('pointercancel', this.onPointerEnd);
    this.canvas.addEventListener('pointerleave', this.onPointerEnd);
  }

  private removeEventListeners(): void {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerEnd);
    this.canvas.removeEventListener('pointercancel', this.onPointerEnd);
    this.canvas.removeEventListener('pointerleave', this.onPointerEnd);
  }

  private getCoordinates(e: PointerEvent): { x: number; y: number } {
    // Se mide en cada evento: el scroll, el zoom y los cambios de disposición mueven el lienzo
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  private onPointerDown = (e: PointerEvent): void => {
    // Un solo puntero a la vez (el primero) y, con ratón, solo el botón principal
    if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault();
    try {
      // Con captura, el trazo sigue aunque el puntero salga del lienzo
      this.canvas.setPointerCapture(e.pointerId);
    } catch {
      // sin captura (evento sintético): pointerleave termina el trazo
    }
    this.startDrawing(e);
  }

  private onPointerMove = (e: PointerEvent): void => {
    if (e.isPrimary) this.draw(e);
  }

  private onPointerEnd = (): void => {
    this.stopDrawing();
  }

  private startDrawing(e: PointerEvent): void {
    const coords = this.getCoordinates(e);

    this.isDrawing = true;
    this.currentPath = [{ x: coords.x, y: coords.y }];
    this.ctx.beginPath();
    this.ctx.moveTo(coords.x, coords.y);
  }

  private draw(e: PointerEvent): void {
    if (!this.isDrawing) return;

    const coords = this.getCoordinates(e);

    this.currentPath.push({ x: coords.x, y: coords.y });
    this.ctx.lineTo(coords.x, coords.y);
    this.ctx.stroke();
  }

  private stopDrawing(): void {
    if (this.isDrawing && this.currentPath.length > 0) {
      this.allPaths.push([...this.currentPath]);
      this.currentPath = [];
    }
    this.isDrawing = false;
  }

  clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.allPaths = [];
    this.currentPath = [];
    this.isDrawing = false;
  }

  downloadPNG(): void {
    if (!this.hasSignature()) return;
    this.downloadService.downloadAsPNG(this.modo === 'escribir' ? this.lienzoDeTexto() : this.canvas);
  }

  downloadSVG(): void {
    if (!this.hasSignature()) return;
    if (this.modo === 'escribir') {
      this.downloadService.downloadTextAsSVG(this.canvas.width, this.canvas.height, this.vista);
      return;
    }
    const pathsToExport = [...this.allPaths];
    if (this.currentPath.length > 0) {
      pathsToExport.push([...this.currentPath]);
    }
    this.downloadService.downloadAsSVG(this.canvas, pathsToExport);
  }

  /** El estado vale para el modo activo: «Vacía» / «Firma lista». */
  hasSignature(): boolean {
    return this.modo === 'escribir' ? this.vista !== '' : this.hayTrazos();
  }

  private hayTrazos(): boolean {
    return this.allPaths.length > 0 || this.currentPath.length > 0;
  }

  /** Lienzo temporal del mismo tamaño que el de dibujo, transparente, con el nombre en tinta #000000. */
  private lienzoDeTexto(): HTMLCanvasElement {
    const lienzo = document.createElement('canvas');
    lienzo.width = this.canvas.width;
    lienzo.height = this.canvas.height;
    const ctx = lienzo.getContext('2d')!;
    this.trazadosTexto.forEach((t) => t.draw(ctx));
    return lienzo;
  }

  cambiarModo(modo: 'dibujar' | 'escribir'): void {
    this.modo = modo;
    this.ultimaDescarga = null;
    this.viewBox = `0 0 ${this.canvas.width} ${this.canvas.height}`;
    if (modo === 'escribir' && !this.fuente) {
      this.textoService.cargar().then(
        (f) => { this.fuente = f; this.errorFuente = false; this.recalcular(); },
        () => { this.errorFuente = true; },
      );
    }
  }

  escribir(valor: string): void {
    this.nombre = valor;
    this.ultimaDescarga = null;
    this.recalcular();
  }

  private recalcular(): void {
    if (!this.fuente) return;
    const { width, height } = this.canvas;
    this.trazadosTexto = this.textoService.disponer(this.fuente, this.nombre, width, height);
    this.vista = this.trazadosTexto.map((t) => t.toPathData(2)).join(' ');
  }

  /** Limpiar borra lo del modo activo; lo del otro modo se conserva. */
  limpiar(): void {
    if (this.modo === 'escribir') this.escribir('');
    else this.clearCanvas();
    this.ultimaDescarga = null;
  }

  formato: 'png' | 'svg' = 'png';
  ultimaDescarga: 'png' | 'svg' | null = null;

  /** Cambiar el formato retira el sello: el aviso de descarga habla del formato que se descargó. */
  cambiarFormato(valor: 'png' | 'svg'): void {
    this.formato = valor;
    this.ultimaDescarga = null;
  }

  descargar(): void {
    if (this.formato === 'png') this.downloadPNG(); else this.downloadSVG();
    this.ultimaDescarga = this.formato;
  }
}
