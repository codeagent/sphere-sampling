import { vec3 } from "gl-matrix";

export enum SamplingType {
  Random = "random",
  Regular = "regular",
  Icosphere = "icosphere"
}

export interface SamplingLayerOptions {
  id: string;
  type: SamplingType;
  color: string;
  samples?: number;
  divisions?: number;
  radius: number;
  angle: number;
  displayRays: boolean;
  displayDots: boolean;
  displaySphere: boolean;
}

export interface SamplingLayer {
  layerOptions: SamplingLayerOptions;
  samples: vec3[];
}
