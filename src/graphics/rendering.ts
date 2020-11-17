import { quat, mat4, vec3, glMatrix } from "gl-matrix";

export type Shader = WebGLProgram;
export type Cubemap = WebGLTexture;
export type Texture2d = WebGLTexture;
export type VertexBuffer = WebGLBuffer;
export type IndexBuffer = WebGLBuffer;

export interface Material {
  shader: Shader;
  uniforms?: {
    [name: string]: Float32Array | number[] | number;
  };
  state?: {
    cullFace?: GLenum | boolean;
    zWrite?: boolean;
  };
}

export interface VertexAttribute {
  semantics: string;
  slot: number;
  size: number;
  type: GLenum;
  offset: number;
  stride: number;
}

export interface Geometry {
  vao: WebGLVertexArrayObject;
  length: number;
  type: GLenum
}

export interface Mesh {
  vertexFormat: VertexAttribute[];
  vertexData: ArrayBufferView;
  indexData: Uint16Array;
}

export interface Drawable {
  material: Material;
  geometry: Geometry;
  transform: Transform;
}

export class Renderer {
  get context() {
    return this._gl;
  }

  constructor(private _gl: WebGL2RenderingContext) {
    _gl.clearColor(0.1, 0.1, 0.1, 1.0);
    _gl.clearDepth(1.0);
    _gl.enable(WebGL2RenderingContext.DEPTH_TEST);
    _gl.enable(WebGL2RenderingContext.CULL_FACE);
    _gl.enable(WebGL2RenderingContext.BLEND);
    _gl.blendFunc(WebGL2RenderingContext.SRC_ALPHA, WebGL2RenderingContext.ONE_MINUS_SRC_ALPHA);
    _gl.pixelStorei(WebGL2RenderingContext.UNPACK_ALIGNMENT, 4);
    _gl.depthFunc(WebGL2RenderingContext.LEQUAL);
    _gl.viewport(0, 0, _gl.canvas.width, _gl.canvas.height);
  }

  clear() {
    this._gl.clear(WebGL2RenderingContext.COLOR_BUFFER_BIT | WebGL2RenderingContext.DEPTH_BUFFER_BIT);
  }

  createGeometry(mesh: Mesh, type: GLenum =  WebGL2RenderingContext.TRIANGLES): Geometry {
    const vBuffer = this.createVertexBuffer(mesh.vertexData);
    const iBuffer = this.createIndexBuffer(mesh.indexData);

    const vao = this._gl.createVertexArray();
    this._gl.bindVertexArray(vao);
    for (const attribute of mesh.vertexFormat) {
      this._gl.enableVertexAttribArray(attribute.slot);
      this._gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, vBuffer);
      if (attribute.type === WebGL2RenderingContext.FLOAT) {
        this._gl.vertexAttribPointer(
          attribute.slot,
          attribute.size,
          attribute.type,
          false,
          attribute.stride,
          attribute.offset
        );
      } else {
        this._gl.vertexAttribIPointer(
          attribute.slot,
          attribute.size,
          attribute.type,
          attribute.stride,
          attribute.offset
        );
      }
    }
    this._gl.bindBuffer(WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER, iBuffer);
    this._gl.bindVertexArray(null);
    return { vao, length: mesh.indexData.length, type};
  }

  createShader(vs: string, fs: string) {
    const gl = this._gl;
    const program = gl.createProgram();
    let shaders = [];
    try {
      for (const shader of [
        { type: WebGL2RenderingContext.VERTEX_SHADER, sourceCode: vs },
        { type: WebGL2RenderingContext.FRAGMENT_SHADER, sourceCode: fs }
      ]) {
        const shaderObject = gl.createShader(shader.type);
        gl.shaderSource(shaderObject, shader.sourceCode);
        gl.compileShader(shaderObject);
        if (!gl.getShaderParameter(shaderObject, WebGL2RenderingContext.COMPILE_STATUS)) {
          throw new Error(
            `${
              shader.type === WebGL2RenderingContext.VERTEX_SHADER
                ? "Vertex"
                : "Fragment"
            } shader compile error: '${gl.getShaderInfoLog(shaderObject)}' \n${
              shader.sourceCode
            }\n`
          );
        }
        gl.attachShader(program, shaderObject);
        shaders.push(shaderObject);
      }

      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, WebGL2RenderingContext.LINK_STATUS)) {
        throw new Error(
          `Unable to initialize the shader program: '${gl.getProgramInfoLog(
            program
          )}'`
        );
      }
    } catch (e) {
      shaders.forEach(shader => gl.deleteShader(shader));
      gl.deleteProgram(program);
      throw e;
    }

    return program;
  }

  drawGeometry(camera: Camera, drawable: Drawable) {
    this._gl.useProgram(drawable.material.shader);
    let loc;

    // Material uniforms
    const uniforms = { ...drawable.material.uniforms };
    for (const name in uniforms) {
      loc = this._gl.getUniformLocation(drawable.material.shader, name);
      if (typeof uniforms[name] === "number") {
        this._gl.uniform1f(loc, uniforms[name] as number);
      } else if((uniforms[name] as number[]).length === 3) {
        this._gl.uniform3fv(loc, uniforms[name] as number[]);
      } else {
         this._gl.uniform4fv(loc, uniforms[name] as number[]);
      }
    }

    loc = this._gl.getUniformLocation(drawable.material.shader, "worldMat");
    if (loc) {
      this._gl.uniformMatrix4fv(loc, false, drawable.transform.transform);
    }

    loc = this._gl.getUniformLocation(drawable.material.shader, "viewMat");
    if (loc) {
      this._gl.uniformMatrix4fv(loc, false, camera.view);
    }

    loc = this._gl.getUniformLocation(drawable.material.shader, "projMat");
    if (loc) {
      this._gl.uniformMatrix4fv(loc, false, camera.projection);
    }

    loc = this._gl.getUniformLocation(drawable.material.shader, "pos");
    if (loc) {
      this._gl.uniform3fv(loc, camera.position);
    }

    if (drawable.material.state) {
      if(drawable.material.state.cullFace ===  false)  {
        this._gl.disable(WebGL2RenderingContext.CULL_FACE)
      } else {
        this._gl.enable(WebGL2RenderingContext.CULL_FACE);
        this._gl.cullFace(
          drawable.material.state.cullFace as GLenum ?? WebGL2RenderingContext.BACK
        );
      }

     
      this._gl.depthMask(drawable.material.state.zWrite ?? true);
    } else {
      this._gl.enable(WebGL2RenderingContext.CULL_FACE);
      this._gl.cullFace(WebGL2RenderingContext.BACK);
      this._gl.depthMask(true);
    }

    this._gl.bindVertexArray(drawable.geometry.vao);
    this._gl.drawElements(
      drawable.geometry.type ?? WebGL2RenderingContext.TRIANGLES,
      drawable.geometry.length,
      WebGL2RenderingContext.UNSIGNED_SHORT,
      0
    );
  }

  private createVertexBuffer(data: ArrayBufferView): VertexBuffer {
    const vbo = this._gl.createBuffer();
    this._gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, vbo);
    this._gl.bufferData(WebGL2RenderingContext.ARRAY_BUFFER, data, WebGL2RenderingContext.STATIC_DRAW);
    this._gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, null);
    return vbo;
  }

  private createIndexBuffer(data: ArrayBufferView): IndexBuffer {
    const ebo = this._gl.createBuffer();
    this._gl.bindBuffer(WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER, ebo);
    this._gl.bufferData(
      WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER,
      data,
      WebGL2RenderingContext.STATIC_DRAW
    );
    this._gl.bindBuffer(WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER, null);
    return ebo;
  }
}

export class Transform {
  set rotation(rotation: quat) {
    this._rotation = rotation;
    this._dirty = true;
  }

  get rotation() {
    return this._rotation;
  }

  set position(position: vec3) {
    this._position = position;
    this._dirty = true;
  }

  get position() {
    return this._position;
  }

  set scale(scale: vec3) {
    this._scale = scale;
    this._dirty = true;
  }

  get scale() {
    return this._scale;
  }

  get forward(): vec3 {
    return [-this.transform[8], -this.transform[9], -this.transform[10]];
  }

  get right(): vec3 {
    return [this.transform[0], this.transform[1], this.transform[2]];
  }

  get up(): vec3 {
    return [this.transform[4], this.transform[5], this.transform[6]];
  }

  get transform() {
    if (this._dirty) {
      mat4.fromRotationTranslationScale(
        this._transform,
        this._rotation,
        this._position,
        this._scale
      );
      this._dirty = true;
    }
    return this._transform;
  }

  protected _transform: mat4 = mat4.create();
  protected _dirty = true;

  constructor(
    protected _position: vec3 = vec3.create(),
    protected _scale: vec3 = vec3.fromValues(1.0, 1.0, 1.0),
    protected _rotation: quat = quat.create()
  ) {}

  lookAt(eye: vec3, at: vec3) {
    const view = mat4.clone(this._transform);
    mat4.targetTo(view, eye, at, [0.0, 1.0, 0.0]);
    mat4.getTranslation(this.position, view);
    mat4.getRotation(this.rotation, view);
  }
}

export class Camera extends Transform {
  get view() {
    mat4.invert(this._view, this.transform);
    return this._view;
  }

  get projection() {
    return this._projection;
  }

  protected _view: mat4 = mat4.create();
  protected _projection: mat4 = mat4.create();

  constructor(
    public readonly fov,
    public readonly aspect,
    public readonly near,
    public readonly far
  ) {
    super();
    mat4.perspective(
      this._projection,
      glMatrix.toRadian(this.fov),
      this.aspect,
      this.near,
      this.far
    );
  }

  
}
