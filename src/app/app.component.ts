import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignatureCanvasComponent } from './components/signature-canvas/signature-canvas.component';
import { LoaderComponent } from './components/loader/loader.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SignatureCanvasComponent, LoaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  isLoading = true;

  ngOnInit(): void {
    setTimeout(() => {
      this.isLoading = false;
    }, 800);
  }
}
