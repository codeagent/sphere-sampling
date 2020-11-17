import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { BrowserModule } from "@angular/platform-browser";
import { ReactiveFormsModule } from "@angular/forms";

import { AppComponent } from "./app.component";
import { SamplingLayerComponent } from "./sampling-layer/sampling-layer.component";
import { LayersListComponent } from "./layers-list/layers-list.component";
import { ViewportComponent } from "./viewport/viewport.component";
import { SamplesExportComponent } from "./samples-export/samples-export.component";
import { SyntaxPipe } from "./syntax.pipe";
import { StorageService } from './storage.service';

@NgModule({
  imports: [CommonModule, BrowserModule, ReactiveFormsModule],
  declarations: [
    AppComponent,
    SamplingLayerComponent,
    LayersListComponent,
    ViewportComponent,
    SamplesExportComponent,
    SyntaxPipe
  ],
  bootstrap: [AppComponent],
  providers: [StorageService]
})
export class AppModule {}
