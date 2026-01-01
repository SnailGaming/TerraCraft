// A simple pseudo-random noise implementation
export class NoiseGenerator {
  private permutation: number[];

  constructor(seed: number = Math.random()) {
    this.permutation = new Array(512);
    const p = new Array(256).fill(0).map((_, i) => i);
    
    // Shuffle based on seed
    let i = 256;
    let j = 0;
    let temp = 0;

    const random = () => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    };

    while (i--) {
      j = Math.floor(random() * (i + 1));
      temp = p[i];
      p[i] = p[j];
      p[j] = temp;
    }

    for (let k = 0; k < 256; k++) {
      this.permutation[k] = p[k];
      this.permutation[k + 256] = p[k];
    }
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number, z: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  // 2D Noise
  public noise2D(x: number, y: number): number {
    return this.noise3D(x, y, 0);
  }

  // 3D Noise for Spheres
  public noise3D(x: number, y: number, z: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);

    const A = this.permutation[X] + Y;
    const AA = this.permutation[A] + Z;
    const AB = this.permutation[A + 1] + Z;
    const B = this.permutation[X + 1] + Y;
    const BA = this.permutation[B] + Z;
    const BB = this.permutation[B + 1] + Z;

    return this.lerp(w, 
      this.lerp(v, 
        this.lerp(u, this.grad(this.permutation[AA], x, y, z), this.grad(this.permutation[BA], x-1, y, z)),
        this.lerp(u, this.grad(this.permutation[AB], x, y-1, z), this.grad(this.permutation[BB], x-1, y-1, z))
      ),
      this.lerp(v, 
        this.lerp(u, this.grad(this.permutation[AA+1], x, y, z-1), this.grad(this.permutation[BA+1], x-1, y, z-1)),
        this.lerp(u, this.grad(this.permutation[AB+1], x, y-1, z-1), this.grad(this.permutation[BB+1], x-1, y-1, z-1))
      )
    );
  }
}