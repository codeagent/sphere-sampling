import { vec3 } from "gl-matrix";

const PI = Math.PI;
const cos = Math.cos;
const sin = Math.sin;
const sqrt = Math.sqrt;
const round = Math.round;
const lerp = (a: number, b: number, f: number) => (1.0 - f) * a + f * b;
const rnd = (a: number, b: number) => lerp(a, b, Math.random());

export interface DistributionFunction {
  (n: number, angle: number): vec3[];
}

export const random: DistributionFunction = (n: number, angle: number = PI) => {
  const samples: vec3[] = [];
  const cosV = cos(PI - angle);
  while (n-- > 0) {
    const y = rnd(1, cosV);
    const phi = rnd(0.0, 2 * PI);
    const sq = sqrt(1.0 - y * y);
    const x = sq * cos(phi);
    const z = sq * sin(phi);
    samples.push(vec3.fromValues(x, y, z));
  }
  return samples;
};

export const regular: DistributionFunction = (
  n: number,
  angle: number = PI
) => {
  const samples: vec3[] = [];
  const a = (2.0 * PI * (1.0 - cos(angle))) / n;
  const d = sqrt(a);
  const Mv = round(angle / d);
  const dv = angle / Mv;
  const df = a / dv;
  for (let i = 0; i < Mv; i++) {
    const v = (angle * (i + 0.5)) / Mv;
    const Mf = round((2.0 * PI * sin(v)) / df);
    for (let j = 0; j < Mf; j++) {
      const f = (2.0 * PI * j) / Mf;
      samples.push(vec3.fromValues(sin(v) * cos(f), cos(v), sin(v) * sin(f)));
    }
  }
  return samples;
};

namespace ico {
  class Edge {
    get hash() {
      return `${this.i0}-${this.i1}`;
    }

    constructor(public i0: number, public i1: number) {
      if (this.i0 > this.i1) {
        const t = this.i1;
        this.i1 = this.i0;
        this.i0 = t;
      }
    }
  }

  type EdgeHash = string;

  export const tesselate = (geometry: {
    vertices: number[];
    indices: number[];
  }) => {
    const lookup = new Map<EdgeHash, number>();
    const vertices = geometry.vertices;
    const indices: number[] = [];
    for (let t = 0; t < geometry.indices.length; t += 3) {
      const m = new Array<number>(3);
      for (let i = 0; i < 3; i++) {
        const edge = new Edge(
          geometry.indices[t + i],
          geometry.indices[t + ((i + 1) % 3)]
        );
        if (!lookup.has(edge.hash)) {
          const v = Array.from(new Array(3)).map(
            (_, j) =>
              (vertices[edge.i0 * 3 + j] + vertices[edge.i1 * 3 + j]) * 0.5
          );
          const pos = vec3.normalize(vec3.create(), v.slice(0, 3) as vec3);
          lookup.set(edge.hash, vertices.length / 3);
          vertices.push(...pos);
        }
        m[i] = lookup.get(edge.hash);
      }
      indices.push(geometry.indices[t]);
      indices.push(m[0]);
      indices.push(m[2]);

      indices.push(m[0]);
      indices.push(geometry.indices[t + 1]);
      indices.push(m[1]);

      indices.push(m[1]);
      indices.push(geometry.indices[t + 2]);
      indices.push(m[2]);

      indices.push(m[0]);
      indices.push(m[1]);
      indices.push(m[2]);
    }

    return { vertices, indices };
  };
}

export const icosphere: DistributionFunction = (
  subdivisions: number,
  angle: number = PI
) => {
  const X = 0.525731112119133606;
  const Z = 0.850650808352039932;
  const N = 0.0;

  const vertices = [
    -X,
    N,
    Z,
    X,
    N,
    Z,
    -X,
    N,
    -Z,
    X,
    N,
    -Z,
    N,
    Z,
    X,
    N,
    Z,
    -X,
    N,
    -Z,
    X,
    N,
    -Z,
    -X,
    Z,
    X,
    N,
    -Z,
    X,
    N,
    Z,
    -X,
    N,
    -Z,
    -X,
    N
  ];

  const indices = [
    1,
    4,
    0,
    4,
    9,
    0,
    4,
    5,
    9,
    8,
    5,
    4,
    1,
    8,
    4,
    1,
    10,
    8,
    10,
    3,
    8,
    8,
    3,
    5,
    3,
    2,
    5,
    3,
    7,
    2,
    3,
    10,
    7,
    10,
    6,
    7,
    6,
    11,
    7,
    6,
    0,
    11,
    6,
    1,
    0,
    10,
    1,
    6,
    11,
    0,
    9,
    2,
    11,
    9,
    5,
    2,
    9,
    11,
    2,
    7
  ];

  let geometry = { indices, vertices };
  for (let i = 0; i < Math.min(subdivisions, 8); i++) {
    geometry = ico.tesselate(geometry);
  }

  const z = vec3.fromValues(0.0, 1.0, 0.0);
  const cosA = cos(angle);

  return Array.from(new Set(geometry.indices).values())
    .reduce(
      (acc, i) =>
        acc.concat(
          vec3.fromValues(
            -geometry.vertices[i * 3 + 1],
            geometry.vertices[i * 3],
            -geometry.vertices[i * 3 + 2]
          )
        ),
      []
    )
    .filter(s => vec3.dot(z, s) >= cosA);
};
