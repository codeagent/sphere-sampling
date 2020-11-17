import { Component, Input, OnChanges, OnInit } from "@angular/core";
import { vec3 } from "gl-matrix";

import { SamplingLayer } from "../types";

const t = "    ";

@Component({
  selector: "samples-export",
  templateUrl: "./samples-export.component.html",
  styleUrls: ["./samples-export.component.css"]
})
export class SamplesExportComponent implements OnChanges {
  @Input()
  samplingLayers: SamplingLayer[] = [];

  tab: "glsl" | "array" | "float32" = "glsl";
  exports = {
    glsl: "",
    array: "",
    float32: ""
  };

  ngOnChanges() {
    this.exports.glsl = this.formatGlsl(this.samplingLayers);
    this.exports.array = this.formatArray(this.samplingLayers);
    this.exports.float32 = this.formatFloat32(this.samplingLayers);
  }

  private convertAxis(s: vec3) {
    return vec3.fromValues(s[2], s[0], s[1]);
  }

  private formatGlsl(samplingLayers: SamplingLayer[]): string {
    return (
      `vec3[] (` +
      samplingLayers
        .map(l => l.samples)
        .flat()
        .map(s => this.convertAxis(s))
        .map(
          (s: vec3) =>
            `vec3(${s[0].toFixed(2)}, ${s[1].toFixed(2)}, ${s[2].toFixed(2)})`
        )
        .map((s: string, i: number) => (i % 3 === 0 ? `\n${t}${s}` : s))
        .join(`, `) +
      `\n);`
    );
  }

  private formatArray(samplingLayers: SamplingLayer[]): string {
    return (
      `[` +
      samplingLayers
        .map(l => l.samples)
        .flat()
        .map(s => this.convertAxis(s))
        .map(
          (s: vec3) =>
            `[${s[0].toFixed(2)}, ${s[1].toFixed(2)}, ${s[2].toFixed(2)}]`
        )
        .map((s: string, i: number) => (i % 3 === 0 ? `\n${t}${s}` : s))
        .join(", ") +
      `\n];`
    );
  }

  private formatFloat32(samplingLayers: SamplingLayer[]): string {
    return (
      `Float32Array.of(` +
      samplingLayers
        .map(l => l.samples)
        .flat()
        .map(s => this.convertAxis(s))
        .map((s: vec3) => [...s])
        .flat()
        .map(s => s.toFixed(2))
        .map((s: string, i: number) => (i % 12 === 0 ? `\n${t}${s}` : s))
        .join(", ") +
      `\n);`
    );
  }
}
