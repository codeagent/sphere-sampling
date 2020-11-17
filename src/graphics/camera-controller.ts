import { vec2, vec3 } from "gl-matrix";

import { Camera, Renderer } from "./rendering";

enum MouseButton {
  Left = 0,
  Middle = 1
}

const sphericalToCartesian = (phi: number, tetta: number): vec3 => {
  const sinTetta = Math.sin(tetta);
  return [sinTetta * Math.sin(phi), Math.cos(tetta), sinTetta * Math.cos(phi)];
};

const cartesianToSpherical = (p: vec3): vec2 => [
  Math.atan2(p[0], p[2]),
  Math.acos(p[1])
];

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(v, b));

export interface SceneControllerInterface {
  update(dt: number): void;
}

export class ArcRotationCameraController implements SceneControllerInterface {
  private canvas: HTMLCanvasElement;
  private distance: number;
  private lastPhi = 0.0;
  private lastTetta = 0.0;
  private phi = 0.0;
  private tetta = 0.0;
  private lastLookAt: vec3 = [0.0, 0.0, 0.0];
  private r = vec3.create();
  private click: vec2 = vec2.create();
  private button = MouseButton.Left;
  private mouseMoveHandler: (w: MouseEvent) => void;
  private mouseUpHandler: () => void;
  private target: HTMLElement;
  private aux0: vec3 = vec3.create();
  private aux1: vec3 = vec3.create();

  constructor(
    private renderer: Renderer,
    private camera: Camera,
    private lookAt: vec3 = [0.0, 0.0, 0.0],
    private rotSpeed = 1.0e-2,
    private moveSpeed = 0.25
  ) {
    this.canvas = this.renderer.context.canvas as HTMLCanvasElement;
    this.camera.lookAt(this.camera.position, lookAt);
    vec3.sub(this.r, this.camera.position, lookAt);
    this.distance = vec3.length(this.r);
    vec3.normalize(this.r, this.r);
    [this.phi, this.tetta] = cartesianToSpherical(this.r);

    this.canvas.addEventListener("mousedown", e => this.mouseDown(e));
    this.canvas.addEventListener("wheel", e => this.scroll(e));

    this.updateTransform();
  }

  update(dt: number) {
    this.camera.lookAt(this.r, this.lookAt);
  }

  private mouseDown(e: MouseEvent) {
    this.target = e.target as HTMLElement;
    this.target.style.cursor = "grabbing";
    document.addEventListener(
      "mousemove",
      (this.mouseMoveHandler = e => this.mouseMove(e))
    );
    document.addEventListener(
      "mouseup",
      (this.mouseUpHandler = () => this.mouseUp())
    );
    this.click[0] = e.pageX;
    this.click[1] = e.pageY;
    this.lastTetta = this.tetta;
    this.lastPhi = this.phi;
    this.lastLookAt = vec3.clone(this.lookAt);
    this.button = e.button;
    e.preventDefault();
  }

  private mouseMove(e: MouseEvent) {
    const dx = (this.click[0] - e.pageX) * this.rotSpeed;
    const dy = (this.click[1] - e.pageY) * this.rotSpeed;
    if (this.button === MouseButton.Left) {
      this.phi = this.lastPhi + dx;
      this.tetta = this.lastTetta + dy;
      this.tetta = clamp(this.tetta, 1.0e-3, Math.PI * 0.4);
    } else {
      vec3.scale(this.aux0, this.camera.right, dx * this.moveSpeed);
      vec3.scale(this.aux1, this.camera.up, dy * -this.moveSpeed);
      vec3.add(this.aux0, this.aux0, this.aux1);
      vec3.add(this.lookAt, this.lastLookAt, this.aux0);
    }
    this.updateTransform();
  }

  private mouseUp() {
    document.removeEventListener("mousemove", this.mouseMoveHandler);
    document.removeEventListener("mouseup", this.mouseUpHandler);
    this.target.style.cursor = "default";
  }

  private scroll(e: WheelEvent) {
    this.distance += this.moveSpeed * e.deltaY * 1.0e-2;
    this.distance = Math.min(5.0, Math.max(0.25, this.distance));
    this.updateTransform();
  }

  private updateTransform() {
    vec3.normalize(this.r, sphericalToCartesian(this.phi, this.tetta));
    vec3.scale(this.r, this.r, this.distance);
    vec3.add(this.r, this.r, this.lookAt);
  }
}
