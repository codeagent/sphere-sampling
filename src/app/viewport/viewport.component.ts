import {
  Component,
  ElementRef,
  AfterViewInit,
  ViewChild,
  Input,
  OnChanges
} from "@angular/core";
import { vec3, vec4 } from "gl-matrix";
import {
  Renderer,
  Shader,
  loadObj,
  ArcRotationCameraController,
  SceneControllerInterface,
  Camera,
  Drawable,
  Transform,
  Geometry
} from "../../graphics";
import {
  vertex as phongVertex,
  fragment as phongFragment
} from "../../shaders/phong";
import {
  vertex as flatVertex,
  fragment as flatFragment
} from "../../shaders/flat";

import ICOSPHERE from "../../objects/icosphere.obj";
import { SamplingLayer } from "../types";

@Component({
  selector: "viewport",
  templateUrl: "./viewport.component.html",
  styleUrls: ["./viewport.component.css"]
})
export class ViewportComponent implements AfterViewInit, OnChanges {
  @ViewChild("canvas", { static: true })
  private canvas: ElementRef;

  @Input()
  samplingLayers: SamplingLayer[] = [];

  private renderer: Renderer;

  private phongShader: Shader;
  private flatShader: Shader;
  private sphereGeometry: Geometry;
  private sampleGeometry: Geometry;
  private planeGeometry: Geometry;
  private lineGeometry: Geometry;
  private camera: Camera;
  private cameraController: SceneControllerInterface;
  private drawables: Drawable[] = [];

  ngOnChanges() {
    if (this.renderer) {
      this.drawables = this.createDrawables(this.samplingLayers);
    }
  }

  ngAfterViewInit() {
    const gl = this.canvas.nativeElement.getContext("webgl2", {
      preserveDrawingBuffer: true
    });
    this.renderer = new Renderer(gl);

    this.phongShader = this.renderer.createShader(phongVertex, phongFragment);
    this.flatShader = this.renderer.createShader(flatVertex, flatFragment);

    const meshCollection = loadObj(ICOSPHERE);
    this.sphereGeometry = this.renderer.createGeometry(
      meshCollection["Icosphere"]
    );
    this.sampleGeometry = this.renderer.createGeometry(
      meshCollection["Sample"]
    );
    this.planeGeometry = this.renderer.createGeometry(meshCollection["Plane"]);
    this.lineGeometry = this.createLinesGeometry([
      [vec3.fromValues(0.0, 0.0, 0.0), vec3.fromValues(0.0, 0.0, -1.0)]
    ]);
    this.camera = new Camera(
      45.0,
      this.renderer.context.canvas.width / this.renderer.context.canvas.height,
      0.025,
      10.0
    );
    this.camera.position = [2.0, 2.0, 2.0];

    this.cameraController = new ArcRotationCameraController(
      this.renderer,
      this.camera
    );

    this.drawables = this.createDrawables(this.samplingLayers);

    // Loop
    let t = Date.now();
    let dt = 0.0;
    const draw = () => {
      this.cameraController.update(dt);
      this.renderer.clear();
      for (const drawable of this.drawables) {
        this.renderer.drawGeometry(this.camera, drawable);
      }
      requestAnimationFrame(draw);
      dt = (Date.now() - t) * 1.0e-3;
      t = Date.now();
    };
    draw();
  }

  private createLinesGeometry(lines: [vec3, vec3][]) {
    const size = lines.length * 2;

    const mesh = {
      verticesCount: size,
      indicesCount: size * 2,
      vertexFormat: [
        {
          semantics: "position",
          size: 3,
          type: WebGL2RenderingContext.FLOAT,
          slot: 0,
          offset: 0,
          stride: 12
        }
      ],
      indexFormat: WebGL2RenderingContext.UNSIGNED_SHORT,
      vertexData: Float32Array.from(
        lines.map((line: [vec3, vec3]) => [...line[0], ...line[1]]).flat()
      ),
      indexData: Uint16Array.from(
        Array.from(Array(size * 2).keys()).map(
          (_, i) => (i % 2 === 0 ? i / 2 : Math.floor(i / 2) + 1) % size
        )
      )
    };

    return this.renderer.createGeometry(mesh, WebGL2RenderingContext.LINES);
  }

  private createDrawables(samplingLayers: SamplingLayer[]) {
    const drawables: Drawable[] = [
      {
        material: {
          shader: this.phongShader,
          uniforms: { albedo: vec4.fromValues(0.6, 0.6, 0.6, 1.0) },
          state: { cullFace: false }
        },
        geometry: this.planeGeometry,
        transform: new Transform()
      }
    ];

    const layers = [...samplingLayers].sort(
      (a, b) => a.layerOptions.radius - b.layerOptions.radius
    );

    for (const layer of layers) {
      const color = this.parseColor(layer.layerOptions.color);

      if (layer.layerOptions.displayRays) {
        drawables.push(
          ...layer.samples.map(s => {
            const p = vec3.fromValues(0.0, 0.0, 0.0);
            const sc = vec3.fromValues(
              layer.layerOptions.radius,
              layer.layerOptions.radius,
              layer.layerOptions.radius
            );
            const transform = new Transform(p, sc);
            transform.lookAt(vec3.fromValues(0.0, 0.0, 0.0), s);
            return {
              material: {
                shader: this.flatShader,
                uniforms: { albedo: vec4.fromValues(1.0, 1.0, 0.0, 0.15) }
              },
              geometry: this.lineGeometry,
              transform
            };
          })
        );
      }

      if (layer.layerOptions.displaySphere) {
        drawables.push({
          material: {
            shader: this.phongShader,
            uniforms: {
              albedo: vec4.fromValues(...color, 0.1)
            },
            state: { zWrite: false }
          },
          geometry: this.sphereGeometry,
          transform: new Transform(
            vec3.create(),
            vec3.fromValues(
              layer.layerOptions.radius,
              layer.layerOptions.radius,
              layer.layerOptions.radius
            )
          )
        });
      }

      if (layer.layerOptions.displayDots) {
        drawables.push(
          ...layer.samples.map(s => ({
            material: {
              shader: this.flatShader,
              uniforms: {
                albedo: vec4.fromValues(...color, 1.0)
              }
            },
            geometry: this.sampleGeometry,
            transform: new Transform(s)
          }))
        );
      }
    }

    return drawables;
  }

  private parseColor(color: string): [number, number, number] {
    const matches = color.match(/([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
    return [
      parseInt(matches[1], 16) / 255.0,
      parseInt(matches[2], 16) / 255.0,
      parseInt(matches[3], 16) / 255.0
    ];
  }
}
