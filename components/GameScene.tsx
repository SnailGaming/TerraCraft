import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import Terrain from './Terrain';
import Trees from './Trees';
import { NoiseGenerator } from '../utils/noise';
import { PlayerStats, BodyStats, TreeData } from '../types';
import { 
    PLAYER_SPEED, PLAYER_HEIGHT, PLAYER_HEIGHT_CROUCH,
    GRAVITY, JUMP_FORCE, SPRINT_MULTIPLIER, CROUCH_MULTIPLIER, STAMINA_MAX, 
    STAMINA_DRAIN_SPRINT, STAMINA_DRAIN_JUMP, STAMINA_REGEN,
    FALL_DAMAGE_THRESHOLD, WATER_LEVEL_OFFSET,
    TERRAIN_BASE_SCALE, TERRAIN_AMPLITUDE, TREE_COLLISION_RADIUS
} from '../constants';

interface GameSceneProps {
  stats: PlayerStats;
  setStats: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (msg: string) => void;
  gameActive: boolean;
  radius: number;
  onChopTree: (treeId: string) => void;
  inventoryOpen: boolean;
}

const MenuController = ({ radius, worldRef }: { radius: number, worldRef: React.RefObject<THREE.Group> }) => {
    useFrame((state, delta) => {
        if (worldRef.current) {
            worldRef.current.rotation.y += 0.05 * delta;
            worldRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
        }
        const dist = radius * 3.5;
        state.camera.position.lerp(new THREE.Vector3(0, 0, dist), 0.05);
        state.camera.lookAt(0, 0, 0);
    });
    return null;
};

const PlanetController = ({ 
  gameActive, 
  stats, setStats, addLog, 
  trees, setTrees, 
  radius, worldRef, starsRef, 
  onChopTree, 
  inventoryOpen, 
  setNeedsLockClick
}: any) => {

  const { camera } = useThree();
  
  // Input Refs
  const moveForward = useRef(false);
  const moveBackward = useRef(false);
  const moveLeft = useRef(false);
  const moveRight = useRef(false);
  const isSprinting = useRef(false);
  const isCrouching = useRef(false);
  const jumpPressed = useRef(false);

  // Physics Refs
  const playerY = useRef(radius + 50); 
  const verticalVelocity = useRef(0);
  const isGrounded = useRef(false);
  const raycaster = useRef(new THREE.Raycaster());
  const downRaycaster = useRef(new THREE.Raycaster());
  
  const staminaRef = useRef(stats.stamina);
  const lastInteract = useRef(0);
  const frameCount = useRef(0);

  // Unlock mouse logic
  useEffect(() => {
    if (!gameActive) return;

    if (inventoryOpen) {
      document.exitPointerLock();
      setNeedsLockClick(false);
      return;
    }

    // Když zavřeš inventář -> zkus locknout
    setTimeout(() => {
        if (!inventoryOpen && document.pointerLockElement == null) {
             document.body.requestPointerLock()
                .then(() => setNeedsLockClick(false))
                .catch(() => setNeedsLockClick(true));
        }
    }, 0);

  }, [inventoryOpen, gameActive, setNeedsLockClick]);

  // Instant Spawn
  useEffect(() => {
      if (worldRef.current) {
          const startRay = new THREE.Raycaster(new THREE.Vector3(0, radius * 2, 0), new THREE.Vector3(0, -1, 0));
          const intersects = startRay.intersectObjects(worldRef.current.children, true);
          
          for (const hit of intersects) {
              if (hit.object.name === 'PlanetMesh') {
                  playerY.current = hit.point.y + PLAYER_HEIGHT;
                  verticalVelocity.current = 0;
                  isGrounded.current = true;
                  camera.position.set(0, playerY.current, 0);
                  worldRef.current.rotation.set(0,0,0);
                  break;
              }
          }
      }
  }, []);

  const applyDamage = (damage: number, part: keyof BodyStats, reason: string) => {
      setStats((prev: PlayerStats) => {
          const currentPart = prev.body[part];
          const newHealth = Math.max(0, currentPart.health - damage);
          const isBroken = newHealth <= 0;
          
          if (isBroken && !currentPart.isBroken) {
              addLog(`YOUR ${currentPart.name.toUpperCase()} IS BROKEN!`);
          }

          return {
              ...prev,
              body: {
                  ...prev.body,
                  [part]: {
                      ...currentPart,
                      health: newHealth,
                      isBroken
                  }
              }
          };
      });
      if (damage > 5) addLog(reason);
  };

  const handleInteraction = useCallback(() => {
      if (inventoryOpen) return;
      
      const now = Date.now();
      if (now - lastInteract.current < 400) return;
      lastInteract.current = now;

      if (stats.body.rightArm.isBroken) {
          addLog("Right arm broken! Cannot interact.");
          return;
      }

      raycaster.current.setFromCamera(new THREE.Vector2(0, 0), camera);
      
      if (!worldRef.current) return;
      
      const intersects = raycaster.current.intersectObjects(worldRef.current.children, true);
      
      let hitTree = false;

      for (const intersect of intersects) {
           if (intersect.distance > 8) continue;

           const obj = intersect.object;
           
           if (obj.name === 'TreeTrunks' || obj.name === 'OakLeaves' || obj.name === 'PineLeaves') {
               hitTree = true;
               
               const instanceId = intersect.instanceId;
               console.log(`🌲 Hit ${obj.name}, instanceId: ${instanceId}`);
               
               if (instanceId !== undefined) {
                   let targetTree = null;
                   
                   if (obj.name === 'OakLeaves') {
                       const oaks = trees.filter((t: TreeData) => t.type === 'oak');
                       targetTree = oaks[instanceId];
                       console.log(`🌳 Oak leaves hit, oak count: ${oaks.length}`);
                   } else if (obj.name === 'PineLeaves') {
                       const pines = trees.filter((t: TreeData) => t.type === 'pine');
                       targetTree = pines[instanceId];
                       console.log(`🌲 Pine leaves hit, pine count: ${pines.length}`);
                   } else if (obj.name === 'TreeTrunks') {
                       targetTree = trees[instanceId];
                       console.log(`🪵 Trunk hit, all trees count: ${trees.length}`);
                   }
                   
                   if (targetTree) {
                       console.log(`✅ CHOPPING tree ${targetTree.id}`);
                       
                       setTrees((prev: TreeData[]) => prev.filter((t: TreeData) => t.id !== targetTree.id));
                       onChopTree(targetTree.id);
                       
                       setStats((prev: PlayerStats) => ({
                           ...prev,
                           stamina: Math.max(0, prev.stamina - 5),
                           hunger: Math.max(0, prev.hunger - 1)
                       }));
                       
                       addLog("Tree chopped!");
                   } else {
                       console.log(`❌ InstanceId ${instanceId} not found`);
                   }
               } else {
                   console.log(`❌ No instanceId in intersect`);
               }
               break;
           }
      }
      
      if (!hitTree) {
          if (playerY.current < radius + WATER_LEVEL_OFFSET + 2.0) {
               setStats((prev: PlayerStats) => ({
                   ...prev,
                   thirst: Math.min(100, prev.thirst + 20)
               }));
               addLog("You drink refreshing water.");
          }
      }
  }, [inventoryOpen, stats.body.rightArm.isBroken, camera, worldRef, trees, setTrees, onChopTree, setStats, addLog, radius]);


  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (inventoryOpen) return;
      
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW': moveForward.current = true; break;
        case 'ArrowLeft':
        case 'KeyA': moveLeft.current = true; break;
        case 'ArrowDown':
        case 'KeyS': moveBackward.current = true; break;
        case 'ArrowRight':
        case 'KeyD': moveRight.current = true; break;
        case 'ShiftLeft':
        case 'ShiftRight': isCrouching.current = true; break;
        case 'ControlLeft':
        case 'ControlRight': 
            if (moveForward.current) isSprinting.current = true; 
            break;
        case 'Space': 
            if (!event.repeat) jumpPressed.current = true;
            break;
        case 'KeyF':
             handleInteraction();
             break;
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW': moveForward.current = false; break;
        case 'ArrowLeft':
        case 'KeyA': moveLeft.current = false; break;
        case 'ArrowDown':
        case 'KeyS': moveBackward.current = false; break;
        case 'ArrowRight':
        case 'KeyD': moveRight.current = false; break;
        case 'ShiftLeft':
        case 'ShiftRight': isCrouching.current = false; break;
        case 'ControlLeft':
        case 'ControlRight': isSprinting.current = false; break;
        case 'Space': jumpPressed.current = false; break;
      }
    };
    
    const onClick = (e: MouseEvent) => {
        if (e.button === 0 && !inventoryOpen) {
           handleInteraction();
        }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousedown', onClick);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('mousedown', onClick);
    };
  }, [inventoryOpen, handleInteraction]);

  useFrame((state, delta) => {
    if (!worldRef.current) return;

    // --- Movement Logic (Rotate World) ---
    if (!inventoryOpen) {
        // 1. Leg Status Check
        let legFactor = 1.0;
        const lLeg = stats.body.leftLeg;
        const rLeg = stats.body.rightLeg;
        if (lLeg.isBroken) legFactor -= 0.35;
        if (rLeg.isBroken) legFactor -= 0.35;
        legFactor = Math.max(0.1, legFactor);

        // 2. Sprint & Stamina
        const isMoving = moveForward.current || moveBackward.current || moveLeft.current || moveRight.current;
        const isMovingForward = moveForward.current && !moveBackward.current;
        if (!isMovingForward || isCrouching.current || staminaRef.current <= 0) isSprinting.current = false;
        
        let moveSpeed = PLAYER_SPEED * legFactor * delta;
        
        if (isCrouching.current) {
            moveSpeed *= CROUCH_MULTIPLIER;
            if (staminaRef.current < STAMINA_MAX) staminaRef.current = Math.min(STAMINA_MAX, staminaRef.current + STAMINA_REGEN * delta);
        } else if (isSprinting.current && isMovingForward) {
            moveSpeed *= SPRINT_MULTIPLIER;
            staminaRef.current = Math.max(0, staminaRef.current - STAMINA_DRAIN_SPRINT * delta);
        } else {
            if (staminaRef.current < STAMINA_MAX) staminaRef.current = Math.min(STAMINA_MAX, staminaRef.current + STAMINA_REGEN * delta);
        }

        // 3. Calculate Proposed Rotation
        const camDir = new THREE.Vector3();
        camera.getWorldDirection(camDir);
        camDir.y = 0;
        camDir.normalize();

        const camRight = new THREE.Vector3();
        camRight.crossVectors(camDir, new THREE.Vector3(0, 1, 0)).normalize();

        const inputZ = Number(moveForward.current) - Number(moveBackward.current);
        const inputX = Number(moveRight.current) - Number(moveLeft.current);

        if (inputZ !== 0 || inputX !== 0) {
            const moveDir = new THREE.Vector3()
                .addScaledVector(camDir, inputZ)
                .addScaledVector(camRight, inputX)
                .normalize();

            const rotationAxis = new THREE.Vector3().crossVectors(moveDir, new THREE.Vector3(0, 1, 0)).normalize();
            const angle = moveSpeed / radius;
            
            worldRef.current.rotateOnWorldAxis(rotationAxis, angle);
            
            const playerWorldPos = new THREE.Vector3(0, radius, 0);
            worldRef.current.worldToLocal(playerWorldPos);

            let collided = false;
            for (let i = 0; i < trees.length; i++) {
                const tree = trees[i];
                const distSq = (tree.position.x - playerWorldPos.x) ** 2 + 
                            (tree.position.y - playerWorldPos.y) ** 2 + 
                            (tree.position.z - playerWorldPos.z) ** 2;
                
                if (distSq < TREE_COLLISION_RADIUS * TREE_COLLISION_RADIUS) {
                    collided = true;
                    break;
                }
            }

            if (collided) {
                worldRef.current.rotateOnWorldAxis(rotationAxis, -angle);
            } else {
                if (starsRef.current) {
                    starsRef.current.rotateOnWorldAxis(rotationAxis, angle);
                }
            }
        }
    }

    // --- Physics Logic (Gravity & Collisions) ---
    // Runs ALWAYS, even in inventory!
    
    downRaycaster.current.set(new THREE.Vector3(0, radius + 50, 0), new THREE.Vector3(0, -1, 0));
    const intersects = downRaycaster.current.intersectObjects(worldRef.current.children, true);
    
    let groundHeight = radius;
    
    for (const hit of intersects) {
        if (hit.object.name === 'PlanetMesh') {
            groundHeight = hit.point.y; 
            break;
        }
    }

    const currentHeight = isCrouching.current ? PLAYER_HEIGHT_CROUCH : PLAYER_HEIGHT;
    const targetY = groundHeight + currentHeight;

    verticalVelocity.current -= GRAVITY * delta;
    playerY.current += verticalVelocity.current * delta;

    if (playerY.current <= targetY) {
        if (verticalVelocity.current < FALL_DAMAGE_THRESHOLD) {
             const impact = Math.abs(verticalVelocity.current);
             const dmg = (impact - Math.abs(FALL_DAMAGE_THRESHOLD)) * 5;
             applyDamage(dmg / 2, 'leftAnkle', 'Ankles took impact!');
             applyDamage(dmg / 2, 'rightAnkle', 'Ankles took impact!');
        }

        playerY.current = targetY;
        verticalVelocity.current = 0;
        isGrounded.current = true;
    } else {
        isGrounded.current = false;
    }

    const canJump = !stats.body.leftLeg.isBroken && !stats.body.rightLeg.isBroken && !stats.body.leftAnkle.isBroken && !stats.body.rightAnkle.isBroken;
    if (jumpPressed.current && isGrounded.current && canJump && staminaRef.current >= STAMINA_DRAIN_JUMP) {
        // Jump only if inventory CLOSED
        if (!inventoryOpen) {
            verticalVelocity.current = JUMP_FORCE;
            staminaRef.current -= STAMINA_DRAIN_JUMP;
            isGrounded.current = false;
            jumpPressed.current = false;
        }
    }

    camera.position.set(0, playerY.current, 0);

    frameCount.current += 1;
    if (frameCount.current % 10 === 0) {
        setStats((prev: PlayerStats) => ({ ...prev, stamina: staminaRef.current }));
    }
  });

  return null;
};

const GameScene: React.FC<GameSceneProps> = ({ stats, setStats, addLog, gameActive, radius, onChopTree, inventoryOpen }) => {
  const noiseGenerator = useMemo(() => new NoiseGenerator(Math.random()), []);
  const [terrainMesh, setTerrainMesh] = useState<THREE.Mesh | null>(null);
  const [trees, setTrees] = useState<TreeData[]>([]);
  const [needsLockClick, setNeedsLockClick] = useState(false);
  const worldRef = useRef<THREE.Group>(null);
  const starsRef = useRef<THREE.Group>(null);

  // Generate Trees Analytically (Robust)
  useEffect(() => {
    const newTrees: TreeData[] = [];
    const area = 4 * Math.PI * radius * radius;
    const count = Math.min(area * 0.005, 5000); 

    for (let i = 0; i < count; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        
        const x = Math.sin(phi) * Math.cos(theta);
        const y = Math.sin(phi) * Math.sin(theta);
        const z = Math.cos(phi);
        
        const nx = x * radius;
        const ny = y * radius;
        const nz = z * radius;

        let n = noiseGenerator.noise3D(nx * TERRAIN_BASE_SCALE, ny * TERRAIN_BASE_SCALE, nz * TERRAIN_BASE_SCALE);
        n += noiseGenerator.noise3D(nx * TERRAIN_BASE_SCALE * 2.0, ny * TERRAIN_BASE_SCALE * 2.0, nz * TERRAIN_BASE_SCALE * 2.0) * 0.15;
        n += noiseGenerator.noise3D(nx * TERRAIN_BASE_SCALE * 5.0, ny * TERRAIN_BASE_SCALE * 5.0, nz * TERRAIN_BASE_SCALE * 5.0) * 0.05;

        const height = radius + (n * TERRAIN_AMPLITUDE) - 0.1;

        if (height > radius + WATER_LEVEL_OFFSET + 0.5) {
            
            const position = new THREE.Vector3(x, y, z).multiplyScalar(height);

            const dummy = new THREE.Object3D();
            dummy.position.copy(position);
            const normal = new THREE.Vector3(x, y, z).normalize();
            const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(
                new THREE.Vector3(0, 1, 0),
                normal
            );
            dummy.setRotationFromQuaternion(targetQuaternion);

            newTrees.push({
                id: `tree-${i}`,
                position: { x: position.x, y: position.y, z: position.z },
                rotation: { x: dummy.rotation.x, y: dummy.rotation.y, z: dummy.rotation.z },
                scale: 0.8 + Math.random() * 0.5,
                type: Math.random() > 0.7 ? 'pine' : 'oak'
            });
        }
    }
    setTrees(newTrees);
  }, [radius, noiseGenerator]);

  return (
    <div className="w-full h-full">
      <Canvas 
        shadows 
        dpr={[1, 1.5]}
        gl={{ powerPreference: "high-performance", antialias: false, stencil: false, depth: true }}
        camera={{ fov: 75, near: 0.1, far: 2000 }}
      >
        <color attach="background" args={['#000']} />
        
        <group ref={starsRef}>
            <Stars radius={radius + 300} depth={100} count={8000} factor={4} saturation={0} fade={false} speed={0} />
        </group>
        
        <ambientLight intensity={0.4} />
        <directionalLight position={[100, 50, 50]} intensity={1.5} castShadow />

        <group ref={worldRef}>
            <Terrain radius={radius} noiseGenerator={noiseGenerator} onMeshReady={setTerrainMesh} />
            <Trees trees={trees} />
        </group>

        {gameActive ? (
             <>
                {!inventoryOpen && (
                  <PointerLockControls 
                    onUnlock={() => {
                        if (!inventoryOpen) setNeedsLockClick(true);
                    }}
                  />
                )}
                
                <PlanetController 
                    gameActive={gameActive}
                    stats={stats} 
                    setStats={setStats} 
                    addLog={addLog} 
                    radius={radius}
                    worldRef={worldRef}
                    starsRef={starsRef}
                    trees={trees}
                    setTrees={setTrees}
                    onChopTree={onChopTree}
                    inventoryOpen={inventoryOpen}
                    setNeedsLockClick={setNeedsLockClick}
                />
             </>
        ) : (
            <MenuController radius={radius} worldRef={worldRef} />
        )}
      </Canvas>
      
      {/* Invisible Click Overlay - zachytí kliknutí pro lock, ale není vidět */}
      {gameActive && !inventoryOpen && needsLockClick && (
        <div
          className="absolute inset-0 z-50 pointer-events-auto cursor-crosshair"
          onMouseDown={(e) => {
            if (e.button !== 0) return;
            document.body.requestPointerLock().finally(() => setNeedsLockClick(false));
          }}
          style={{ background: "transparent" }}
        />
      )}
       
       {gameActive && !inventoryOpen && <div className="crosshair"><div className="dot"></div></div>}

    </div>
  );
};

export default GameScene;
