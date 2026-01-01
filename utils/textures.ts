import * as THREE from 'three';

// Generates a SHARP, highly detailed grit texture
export const createTerrainTexture = () => {
  const size = 1024; // Increased resolution for more detail
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture();

  // 1. Base Layer (Varied Grey/Green undertone)
  ctx.fillStyle = '#7a7a7a';
  ctx.fillRect(0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  // 2. High Frequency Noise Pixel-by-Pixel
  for (let i = 0; i < data.length; i += 4) {
    // Heavy noise variation
    const noise = (Math.random() - 0.5) * 60; 
    
    // Base color approx 120
    let r = 120 + noise;
    let g = 120 + noise;
    let b = 120 + noise;

    // Add subtle green/brown hue variance for "organic" feel
    if (Math.random() > 0.6) {
        g += 10; // Slight moss/grass hint in the noise itself
        r += 5;  // Slight earth
    }
    
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);

  // 3. Structure / Detail Layers
  
  // Dark patches (dirt clumps)
  ctx.fillStyle = 'rgba(60, 50, 40, 0.15)';
  for (let i = 0; i < 5000; i++) {
     const w = Math.random() * 4 + 1;
     const h = Math.random() * 4 + 1;
     const x = Math.random() * size;
     const y = Math.random() * size;
     ctx.fillRect(x, y, w, h);
  }

  // Sharp Highlights (small stones/glints) - High density
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  for (let i = 0; i < 40000; i++) {
     const x = Math.floor(Math.random() * size);
     const y = Math.floor(Math.random() * size);
     ctx.fillRect(x, y, 1, 1); // 1px sharp dot
  }

  // Sharp Shadows (pores/holes) - High density
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  for (let i = 0; i < 40000; i++) {
     const x = Math.floor(Math.random() * size);
     const y = Math.floor(Math.random() * size);
     ctx.fillRect(x, y, 1, 1); // 1px sharp dot
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  
  // High repeat for detailed "close up" feel without blur
  texture.repeat.set(80, 40); 
  
  texture.anisotropy = 16; // Max quality at angles
  
  // LinearMipmapLinearFilter + LinearFilter keeps it looking "high res" rather than "pixel art"
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  
  return texture;
};

// Generates a detailed bark texture
export const createBarkTexture = () => {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();

    // Base Brown
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(0, 0, size, size);

    // Vertical Fibers
    for(let i=0; i<3000; i++) {
        const val = Math.random();
        ctx.fillStyle = val > 0.5 ? 'rgba(80, 50, 40, 0.1)' : 'rgba(20, 10, 5, 0.2)';
        const x = Math.random() * size;
        const w = Math.random() * 3 + 1;
        const h = Math.random() * 50 + 20;
        const y = Math.random() * size;
        ctx.fillRect(x, y, w, h);
    }

    // Deep Cracks
    ctx.fillStyle = 'rgba(10, 5, 0, 0.8)';
    for(let i=0; i<150; i++) {
        const x = Math.random() * size;
        const w = Math.random() * 4 + 2;
        ctx.fillRect(x, 0, w, size);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 4);
    return tex;
}

// Generates a lush leaf texture
export const createLeafTexture = (colorHex: string) => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();

    ctx.fillStyle = colorHex;
    ctx.fillRect(0, 0, size, size);

    // Noise/Leaves pattern
    for(let i=0; i<2000; i++) {
        const shade = Math.random() > 0.5 ? 20 : -20;
        ctx.fillStyle = `rgba(${shade > 0 ? 255 : 0}, ${shade > 0 ? 255 : 0}, ${shade > 0 ? 255 : 0}, 0.15)`;
        const x = Math.random() * size;
        const y = Math.random() * size;
        const s = Math.random() * 10 + 2;
        ctx.beginPath();
        ctx.arc(x, y, s, 0, Math.PI*2);
        ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
}