import { Component } from '@angular/core';
import { SignatureCanvasComponent } from './components/signature-canvas/signature-canvas.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SignatureCanvasComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {}
