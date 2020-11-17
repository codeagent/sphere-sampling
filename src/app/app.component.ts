import { Component, OnInit } from "@angular/core";
import randomColor from "randomcolor";
import { vec3 } from "gl-matrix";

import { uniqueId } from "./uniqueid";
import { SamplingLayer, SamplingLayerOptions, SamplingType } from "./types";
import { DistributionFunction, random, regular, icosphere } from "../graphics";
import { StorageService } from "./storage.service";

const STORAGE_KEY = "layers_list";

@Component({
  selector: "app",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent implements OnInit {
  layersList: SamplingLayer[];

  get layerOptionsList() {
    return this.layersList.map(l => l.layerOptions);
  }

  private distributionMap = new Map<SamplingType, DistributionFunction>([
    [SamplingType.Random, random],
    [SamplingType.Regular, regular],
    [SamplingType.Icosphere, icosphere]
  ]);

  constructor(private storageService: StorageService) {}

  ngOnInit() {
    const samplingOptions = this.storageService.get<SamplingLayerOptions[]>(
      STORAGE_KEY
    );
    if (!samplingOptions) {
      const layerOptions = {
        id: uniqueId(),
        color: randomColor({ luminosity: "dark" }),
        type: SamplingType.Regular,
        samples: 64,
        divisions: 2,
        radius: 1.0,
        angle: Math.PI * 0.5,
        displayRays: true,
        displayDots: true,
        displaySphere: true
      };
      const samples = this.createSamples(layerOptions);
      this.layersList = [{ layerOptions, samples }];
      this.saveOptions();
    } else {
      this.layersList = samplingOptions.map(layerOptions => ({
        layerOptions,
        samples: this.createSamples(layerOptions)
      }));
    }
  }

  onLayerCreated(layerOptions: SamplingLayerOptions) {
    this.layersList = [
      ...this.layersList,
      { layerOptions, samples: this.createSamples(layerOptions) }
    ];
    this.saveOptions();
  }

  onLayerRemoved(layerOptions: SamplingLayerOptions) {
    this.layersList.splice(
      this.layersList.findIndex(l => l.layerOptions.id === layerOptions.id),
      1
    );
    this.layersList = Array.from(this.layersList);
    this.saveOptions();
  }

  onLayerChanged(layerOptions: SamplingLayerOptions) {
    const layer = this.layersList.find(
      l => l.layerOptions.id === layerOptions.id
    );
    Object.assign(layer.layerOptions, layerOptions);
    layer.samples = this.createSamples(layer.layerOptions);
    this.layersList = Array.from(this.layersList);
    this.saveOptions();
  }

  private createSamples(layerOptions: SamplingLayerOptions): vec3[] {
    const generator = this.distributionMap.get(layerOptions.type);
    return generator(
      layerOptions.type === SamplingType.Icosphere
        ? layerOptions.divisions
        : layerOptions.samples,
      layerOptions.angle
    ).map(l => vec3.scale(l, l, layerOptions.radius));
  }

  private saveOptions() {
    this.storageService.set(
      STORAGE_KEY,
      this.layersList.map(l => l.layerOptions)
    );
  }
}
