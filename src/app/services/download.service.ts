import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DownloadService {

  constructor() { }

  downloadAsPNG(canvas: HTMLCanvasElement): void {
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = this.getFileName('png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    }, 'image/png');
  }

  downloadAsSVG(canvas: HTMLCanvasElement, paths: Array<{x: number, y: number}[]>): void {
    const svg = this.crearSVG(canvas.width, canvas.height);

    paths.forEach(path => {
      if (path.length < 2) return;
      
      const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      let pathData = `M ${path[0].x} ${path[0].y}`;
      
      for (let i = 1; i < path.length; i++) {
        pathData += ` L ${path[i].x} ${path[i].y}`;
      }
      
      pathElement.setAttribute('d', pathData);
      pathElement.setAttribute('stroke', '#000000');
      pathElement.setAttribute('stroke-width', '2');
      pathElement.setAttribute('fill', 'none');
      pathElement.setAttribute('stroke-linecap', 'round');
      pathElement.setAttribute('stroke-linejoin', 'round');
      svg.appendChild(pathElement);
    });

    this.guardarSVG(svg);
  }

  /** Firma escrita: el texto ya viene convertido a trazados (`d`), así no depende de ninguna fuente. */
  downloadTextAsSVG(width: number, height: number, d: string): void {
    const svg = this.crearSVG(width, height);
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', '#000000');
    svg.appendChild(path);
    this.guardarSVG(svg);
  }

  private crearSVG(width: number, height: number): SVGSVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width.toString());
    svg.setAttribute('height', height.toString());
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    return svg;
  }

  private guardarSVG(svg: SVGSVGElement): void {
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = this.getFileName('svg');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private getFileName(extension: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `firma-digital-${year}${month}${day}-${hours}${minutes}${seconds}.${extension}`;
  }
}
