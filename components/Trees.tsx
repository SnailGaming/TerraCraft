import React, { useRef, useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { TreeData } from '../types';
import { COLORS } from '../constants';
import { createBarkTexture, createLeafTexture } from '../utils/textures';

interface TreesProps {
  trees: TreeData[];
}

const Trees: React.FC<TreesProps> = ({ trees }) => {
  const trunkMeshRef = useRef<THREE.InstancedMesh>(null);
  const leavesOakRef = useRef<THREE.InstancedMesh>(null);
  const leavesPineRef = useRef<THREE.InstancedMesh>(null);

  const barkTexture = useMemo(() => createBarkTexture(), []);
  const oakTexture = useMemo(() => createLeafTexture(COLORS.TREE_LEAVES_OAK), []);
  const pineTexture = useMemo(() => createLeafTexture(COLORS.TREE_LEAVES_PINE), []);

  // Filter tree types
  const { oaks, pines } = useMemo(() => {
    const oaks = trees.filter(t => t.type === 'oak');
    const pines = trees.filter(t => t.type === 'pine');
    return { oaks, pines };
  }, [trees]);

  useLayoutEffect(() => {
    // Trunks
    if (trunkMeshRef.current) {
        const dummy = new THREE.Object3D();
        trees.forEach((data, i) => {
            dummy.position.set(data.position.x, data.position.y, data.position.z);
            dummy.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
            dummy.scale.set(data.scale, data.scale, data.scale);
            
            // Fix Levitating/Buried:
            // Geometry height is 3. 
            // Previous was 0.5. Now 0.9 to lift it up slightly so it's not buried.
            dummy.translateY(data.scale * 0.9);
            
            dummy.updateMatrix();
            trunkMeshRef.current!.setMatrixAt(i, dummy.matrix);
        });
        trunkMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // Oak Leaves
    if (leavesOakRef.current) {
        const dummy = new THREE.Object3D();
        oaks.forEach((data, i) => {
            dummy.position.set(data.position.x, data.position.y, data.position.z);
            dummy.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
            dummy.scale.set(data.scale, data.scale, data.scale);
            
            // Position leaves on top of the visible trunk (approx 2.0 units up)
            dummy.translateY(data.scale * 2.3);
            
            dummy.updateMatrix();
            leavesOakRef.current!.setMatrixAt(i, dummy.matrix);
        });
        leavesOakRef.current.instanceMatrix.needsUpdate = true;
    }

    // Pine Leaves
    if (leavesPineRef.current) {
        const dummy = new THREE.Object3D();
        pines.forEach((data, i) => {
            dummy.position.set(data.position.x, data.position.y, data.position.z);
            dummy.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
            dummy.scale.set(data.scale, data.scale, data.scale);
            
            // Pine leaves are taller and sit slightly higher
            dummy.translateY(data.scale * 2.5);
            
            dummy.updateMatrix();
            leavesPineRef.current!.setMatrixAt(i, dummy.matrix);
        });
        leavesPineRef.current.instanceMatrix.needsUpdate = true;
    }

  }, [trees, oaks, pines]);

  return (
    <group>
      {/* Trunks Instance */}
      <instancedMesh 
        ref={trunkMeshRef} 
        key={`trunks-${trees.length}`}
        args={[undefined, undefined, trees.length]} 
        castShadow 
        receiveShadow
        name="TreeTrunks"
      >
        {/* Height 3, wider base */}
        <cylinderGeometry args={[0.2, 0.45, 3, 7]} />
        <meshStandardMaterial color={COLORS.TREE_TRUNK} map={barkTexture} roughness={0.9} />
      </instancedMesh>

      {/* Oak Leaves Instance */}
      <instancedMesh 
        ref={leavesOakRef} 
        key={`oaks-${oaks.length}`}
        args={[undefined, undefined, oaks.length]} 
        castShadow 
        receiveShadow
        name="OakLeaves"
      >
        <dodecahedronGeometry args={[1.4, 0]} />
        <meshStandardMaterial map={oakTexture} color={COLORS.TREE_LEAVES_OAK} roughness={0.8} />
      </instancedMesh>

      {/* Pine Leaves Instance */}
      <instancedMesh 
        ref={leavesPineRef} 
        key={`pines-${pines.length}`}
        args={[undefined, undefined, pines.length]} 
        castShadow 
        receiveShadow
        name="PineLeaves"
      >
        <coneGeometry args={[1.3, 3.0, 7]} />
        <meshStandardMaterial map={pineTexture} color={COLORS.TREE_LEAVES_PINE} roughness={0.8} />
      </instancedMesh>
    </group>
  );
};

export default Trees;