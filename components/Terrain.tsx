import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { COLORS, WATER_LEVEL_OFFSET, TERRAIN_BASE_SCALE, TERRAIN_AMPLITUDE } from '../constants';
import { NoiseGenerator } from '../utils/noise';
import { createTerrainTexture } from '../utils/textures';

interface TerrainProps {
  radius: number;
  noiseGenerator: NoiseGenerator;
  onMeshReady?: (mesh: THREE.Mesh) => void;
}

const Terrain: React.FC<TerrainProps> = ({ radius, noiseGenerator, onMeshReady }) => {
  const texture = useMemo(() => createTerrainTexture(), []);
  const meshRef = useRef<THREE.Mesh>(null);

  const { geometry, colors } = useMemo(() => {
    // Optimization: Reduced segments for performance
    const segments = radius > 100 ? 100 : (radius > 50 ? 84 : 64);

    const geo = new THREE.SphereGeometry(radius, segments, segments);
    
    // Rotate geometry to move UV poles to horizon
    geo.rotateX(-Math.PI / 2);

    const posAttribute = geo.attributes.position;
    const vertexCount = posAttribute.count;
    const colorArray = new Float32Array(vertexCount * 3);

    const cGrass = new THREE.Color(COLORS.GRASS);
    const cStone = new THREE.Color(COLORS.STONE);
    const cDirt = new THREE.Color(COLORS.DIRT);

    for (let i = 0; i < vertexCount; i++) {
      const x = posAttribute.getX(i);
      const y = posAttribute.getY(i);
      const z = posAttribute.getZ(i);

      // Normalize to get direction vector
      const v = new THREE.Vector3(x, y, z).normalize();
      
      const nx = v.x * radius;
      const ny = v.y * radius;
      const nz = v.z * radius;

      // Layer 1: Base Shape
      let n = noiseGenerator.noise3D(nx * TERRAIN_BASE_SCALE, ny * TERRAIN_BASE_SCALE, nz * TERRAIN_BASE_SCALE);
      
      // Layer 2: Subtle detail
      n += noiseGenerator.noise3D(nx * TERRAIN_BASE_SCALE * 2.0, ny * TERRAIN_BASE_SCALE * 2.0, nz * TERRAIN_BASE_SCALE * 2.0) * 0.15;
      
      // Layer 3: Texture
      n += noiseGenerator.noise3D(nx * TERRAIN_BASE_SCALE * 5.0, ny * TERRAIN_BASE_SCALE * 5.0, nz * TERRAIN_BASE_SCALE * 5.0) * 0.05;

      // Apply Height
      const height = radius + (n * TERRAIN_AMPLITUDE);
      
      // Update Vertex Position
      v.multiplyScalar(height);
      posAttribute.setXYZ(i, v.x, v.y, v.z);

      // Color logic based on height
      const waterLvl = radius + WATER_LEVEL_OFFSET;
      
      const color = new THREE.Color();

      if (height < waterLvl + 2.0) {
        color.copy(cDirt); // Shores
        color.multiplyScalar(0.9);
      } else if (height > radius + 6.0) { // High peaks
        color.copy(cStone); 
        color.offsetHSL(0, 0, (Math.random() - 0.5) * 0.05);
      } else {
        color.copy(cGrass); // Main land
        color.offsetHSL(0.02 * n, 0, n * 0.05); 
      }

      colorArray[i * 3] = color.r;
      colorArray[i * 3 + 1] = color.g;
      colorArray[i * 3 + 2] = color.b;
    }

    geo.computeVertexNormals();
    geo.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

    return { geometry: geo, colors: colorArray };
  }, [radius, noiseGenerator]);

  // Notify parent when mesh is ready (for raycasting interaction)
  useEffect(() => {
      if (meshRef.current && onMeshReady) {
          onMeshReady(meshRef.current);
      }
  }, [geometry, onMeshReady]);

  return (
    <group>
      {/* Land Sphere */}
      <mesh ref={meshRef} name="PlanetMesh" receiveShadow castShadow>
        <primitive object={geometry} attach="geometry" />
        <meshStandardMaterial 
            vertexColors 
            map={texture} 
            roughness={0.9} 
            metalness={0.1}
            flatShading={false}
        />
      </mesh>

      {/* Water Sphere */}
      <mesh>
        <sphereGeometry args={[radius + WATER_LEVEL_OFFSET, 64, 64]} />
        <meshStandardMaterial color={COLORS.WATER} transparent opacity={0.6} roughness={0.1} metalness={0.6} />
      </mesh>
    </group>
  );
};

export default Terrain;