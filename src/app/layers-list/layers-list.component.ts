import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import randomColor from "randomcolor";

import { uniqueId } from "../uniqueid";
import { SamplingLayerOptions, SamplingType } from "../types";

@Component({
  selector: "layers-list",
  templateUrl: "./layers-list.component.html",
  styleUrls: ["./layers-list.component.css"]
})
export class LayersListComponent {
  @Input() layersList: SamplingLayerOptions[];
  @Output() layerCreated = new EventEmitter<SamplingLayerOptions>();
  @Output() layerRemoved = new EventEmitter<SamplingLayerOptions>();
  @Output() layerChanged = new EventEmitter<SamplingLayerOptions>();

  createLayer() {
    this.layerCreated.next({
      id: uniqueId(),
      color: randomColor({ luminosity: "dark" }),
      type: SamplingType.Regular,
      samples: 32,
      divisions: 2,
      radius: 1.0,
      angle: Math.PI * 0.5,
      displayRays: true,
      displayDots: true,
      displaySphere: true
    });
  }

  onLayerRemoved(layer: SamplingLayerOptions) {
    this.layerRemoved.emit(layer);
  }

  onLayerChanged(layer: SamplingLayerOptions) {
    this.layerChanged.emit(layer);
  }
}
