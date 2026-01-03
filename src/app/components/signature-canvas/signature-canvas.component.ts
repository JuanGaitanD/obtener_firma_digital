import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DownloadService } from '../../services/download.service';

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
  
  private rect!: DOMRect;

  constructor(private downloadService: DownloadService) {}

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
    this.updateRect();
  }

  private updateRect(): void {
    this.rect = this.canvas.getBoundingClientRect();
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('mousedown', this.onMouseDown);
    this.canvas.addEventListener('mousemove', this.onMouseMove);
    this.canvas.addEventListener('mouseup', this.onMouseUp);
    this.canvas.addEventListener('mouseleave', this.onMouseUp);
    
    this.canvas.addEventListener('touchstart', this.onTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.onTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', this.onTouchEnd);
    
    window.addEventListener('resize', this.onResize);
  }

  private removeEventListeners(): void {
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('mouseup', this.onMouseUp);
    this.canvas.removeEventListener('mouseleave', this.onMouseUp);
    
    this.canvas.removeEventListener('touchstart', this.onTouchStart);
    this.canvas.removeEventListener('touchmove', this.onTouchMove);
    this.canvas.removeEventListener('touchend', this.onTouchEnd);
    
    window.removeEventListener('resize', this.onResize);
  }

  private onResize = (): void => {
    this.updateRect();
  }

  private getCoordinates(e: MouseEvent | TouchEvent): { x: number; y: number } | null {
    let clientX: number, clientY: number;
    
    if (e instanceof TouchEvent) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const scaleX = this.canvas.width / this.rect.width;
    const scaleY = this.canvas.height / this.rect.height;
    
    return {
      x: (clientX - this.rect.left) * scaleX,
      y: (clientY - this.rect.top) * scaleY
    };
  }

  private onMouseDown = (e: MouseEvent): void => {
    this.startDrawing(e);
  }

  private onMouseMove = (e: MouseEvent): void => {
    this.draw(e);
  }

  private onMouseUp = (): void => {
    this.stopDrawing();
  }

  private onTouchStart = (e: TouchEvent): void => {
    e.preventDefault();
    this.startDrawing(e);
  }

  private onTouchMove = (e: TouchEvent): void => {
    e.preventDefault();
    this.draw(e);
  }

  private onTouchEnd = (e: TouchEvent): void => {
    e.preventDefault();
    this.stopDrawing();
  }

  private startDrawing(e: MouseEvent | TouchEvent): void {
    const coords = this.getCoordinates(e);
    if (!coords) return;
    
    this.isDrawing = true;
    this.currentPath = [{ x: coords.x, y: coords.y }];
    this.ctx.beginPath();
    this.ctx.moveTo(coords.x, coords.y);
  }

  private draw(e: MouseEvent | TouchEvent): void {
    if (!this.isDrawing) return;
    
    const coords = this.getCoordinates(e);
    if (!coords) return;
    
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
    if (this.allPaths.length === 0 && this.currentPath.length === 0) return;
    this.downloadService.downloadAsPNG(this.canvas);
  }

  downloadSVG(): void {
    if (this.allPaths.length === 0 && this.currentPath.length === 0) return;
    const pathsToExport = [...this.allPaths];
    if (this.currentPath.length > 0) {
      pathsToExport.push([...this.currentPath]);
    }
    this.downloadService.downloadAsSVG(this.canvas, pathsToExport);
  }

  hasSignature(): boolean {
    return this.allPaths.length > 0 || this.currentPath.length > 0;
  }
}
