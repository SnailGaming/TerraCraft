import React, { useState, useEffect, useCallback } from 'react';
import GameScene from './components/GameScene';
import Hotbar from './components/Hotbar';
import { GameState, PlayerStats, BodyPartStats, BodyStats } from './types';
import { INITIAL_STATS, PLANET_RADIUS_SMALL, PLANET_RADIUS_HUGE } from './constants';
import { Droplets, Beef, TreeDeciduous, Zap } from 'lucide-react';
import { ItemManager } from "./src/utils/ItemManager";

const BodyFigure: React.FC<{ body: BodyStats }> = ({ body }) => {
    const getPartColor = (part: BodyPartStats) => {
        if (part.isBroken) return "#1f2937";
        if (part.health > 80) return "#9ca3af";
        if (part.health > 50) return "#facc15";
        return "#ef4444";
    };

    return (
        <div className="relative w-32 h-48 opacity-90">
             <svg viewBox="0 0 100 150" className="w-full h-full">
                <circle cx="50" cy="20" r="12" fill={getPartColor(body.head)} stroke="black" strokeWidth="1" />
                <rect x="35" y="34" width="30" height="50" rx="5" fill={getPartColor(body.torso)} stroke="black" strokeWidth="1" />
                <rect x="15" y="36" width="18" height="45" rx="3" fill={getPartColor(body.leftArm)} stroke="black" strokeWidth="1" />
                <rect x="67" y="36" width="18" height="45" rx="3" fill={getPartColor(body.rightArm)} stroke="black" strokeWidth="1" />
                <rect x="36" y="86" width="12" height="40" rx="3" fill={getPartColor(body.leftLeg)} stroke="black" strokeWidth="1" />
                <rect x="36" y="128" width="12" height="10" rx="2" fill={getPartColor(body.leftAnkle)} stroke="black" strokeWidth="1" />
                <rect x="52" y="86" width="12" height="40" rx="3" fill={getPartColor(body.rightLeg)} stroke="black" strokeWidth="1" />
                <rect x="52" y="128" width="12" height="10" rx="2" fill={getPartColor(body.rightAnkle)} stroke="black" strokeWidth="1" />
             </svg>
             <div className="absolute bottom-0 w-full text-center text-[10px] text-gray-400 font-mono">
                 BODY STATUS
             </div>
        </div>
    );
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [stats, setStats] = useState<PlayerStats>(INITIAL_STATS);
  const [logs, setLogs] = useState<string[]>([]);
  const [lore, setLore] = useState<string>("");
  const [worldRadius, setWorldRadius] = useState<number>(PLANET_RADIUS_SMALL);
  const [inventoryOpen, setInventoryOpen] = useState<boolean>(false);
  const [selectedHotbarSlot, setSelectedHotbarSlot] = useState<number>(0);
  const [draggedSlot, setDraggedSlot] = useState<number | null>(null);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 5));
  }, []);

  const startGame = async (radius: number) => {
    setWorldRadius(radius);
    setGameState(GameState.PLAYING);
    setStats(JSON.parse(JSON.stringify(INITIAL_STATS)));
    setLogs([]);
    setLore("Generating planetary data...");
    addLog("Initialization complete. Welcome to the surface.");
    setInventoryOpen(false);
    const loreOptions = [
      "An ancient sphere lost in the void. Resources are scarce.",
      "Gravity pulls strangely here. Every step matters.",
      "This world has seen civilizations fall. Will you survive?",
      "Water is life. Wood is survival. You are alone.",
      "The planet rotates beneath you. Adapt or perish."
    ];
    setLore(loreOptions[Math.floor(Math.random() * loreOptions.length)]);
  };

  // --- GAME LOOP & SURVIVAL LOGIC ---
  useEffect(() => {
    if (gameState !== GameState.PLAYING) return;

    const interval = setInterval(() => {
      setStats(prev => {
        const newHunger = Math.max(0, prev.hunger - 0.3); 
        const newThirst = Math.max(0, prev.thirst - 0.5); 

        let newBody = { ...prev.body };

        if (newHunger === 0) {
            const dmg = 0.5;
            const newHealth = Math.max(0, newBody.torso.health - dmg);
            newBody.torso = { ...newBody.torso, health: newHealth, isBroken: newHealth <= 0 };
        }

        if (newThirst === 0) {
            const dmg = 1.0;
            const newHeadHealth = Math.max(0, newBody.head.health - dmg);
            newBody.head = { ...newBody.head, health: newHeadHealth, isBroken: newHeadHealth <= 0 };
            const newTorsoHealth = Math.max(0, newBody.torso.health - (dmg * 0.5));
            newBody.torso = { ...newBody.torso, health: newTorsoHealth, isBroken: newTorsoHealth <= 0 };
        }

        if (newBody.head.health <= 0 || newBody.torso.health <= 0) {
            setGameState(GameState.GAME_OVER);
        }

        return { ...prev, body: newBody, hunger: newHunger, thirst: newThirst };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState]);

  // --- EATING LOGIC (RIGHT CLICK FIX) ---
  useEffect(() => {
    if (gameState !== GameState.PLAYING) return;

    const handleMouseDown = (e: MouseEvent) => {
        // Button 2 = Right Mouse Click
        if (e.button === 2) {
            // Check if inventory is CLOSED (Minecraft style)
            if (!inventoryOpen) {
                const currentSlotItem = stats.inventory.slots[selectedHotbarSlot];

                // Check if we are holding an item and if it is edible
                if (currentSlotItem && currentSlotItem.item.edible) {
                    const itemName = currentSlotItem.item.name;
                    addLog(`You ate ${itemName}`);

                    setStats(prev => {
                        // 1. Restore Stats
                        const restoredHunger = Math.min(100, prev.hunger + (currentSlotItem.item.hungerRestore || 0));
                        const restoredThirst = Math.min(100, prev.thirst + (currentSlotItem.item.thirstRestore || 0));

                        // 2. Remove Item from Inventory
                        const newSlots = [...prev.inventory.slots];
                        const slot = newSlots[selectedHotbarSlot];
                        
                        if (slot) {
                            if (slot.count > 1) {
                                newSlots[selectedHotbarSlot] = { ...slot, count: slot.count - 1 };
                            } else {
                                newSlots[selectedHotbarSlot] = null;
                            }
                        }

                        return {
                            ...prev,
                            hunger: restoredHunger,
                            thirst: restoredThirst,
                            inventory: { ...prev.inventory, slots: newSlots }
                        };
                    });
                }
            }
        }
    };

    // Prevent Browser Context Menu when playing
    const handleContextMenu = (e: MouseEvent) => {
        if (!inventoryOpen) {
            e.preventDefault();
        }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
        window.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [gameState, inventoryOpen, selectedHotbarSlot, stats.inventory, addLog]);


  const chopTree = useCallback((treeId: string) => {
    setStats(prev => {
      let newInventory = prev.inventory;
      const drops = ItemManager.getTreeDrops();

      drops.forEach(drop => {
        newInventory = ItemManager.addItemToInventory(newInventory, drop.itemId, drop.count);
        const item = ItemManager.getItem(drop.itemId);
        addLog(`+${drop.count} ${item?.name || drop.itemId}`);
      });

      return { 
        ...prev, 
        inventory: newInventory,
        wood: prev.wood + 1
      };
    });
  }, [addLog]);

  const toggleInventory = () => {
    setInventoryOpen(prev => !prev);
  };

  const handleItemMove = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    setStats(prev => {
      const newSlots = [...prev.inventory.slots];
      const temp = newSlots[fromIndex];
      newSlots[fromIndex] = newSlots[toIndex];
      newSlots[toIndex] = temp;
      return {
        ...prev,
        inventory: { ...prev.inventory, slots: newSlots }
      };
    });
  };

  useEffect(() => {
    if (gameState !== GameState.PLAYING || inventoryOpen) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY > 0) {
        setSelectedHotbarSlot(prev => (prev + 1) % 9);
      } else if (e.deltaY < 0) {
        setSelectedHotbarSlot(prev => (prev - 1 + 9) % 9);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [gameState, inventoryOpen]);

  return (
    <div className="relative w-full h-full bg-black text-white font-sans select-none">
      <div className="absolute inset-0 z-0">
        <GameScene 
            stats={stats} 
            setStats={setStats} 
            addLog={addLog} 
            gameActive={gameState === GameState.PLAYING}
            radius={worldRadius}
            onChopTree={chopTree}
            inventoryOpen={inventoryOpen}
        />
      </div>

      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6">
        <div className="flex justify-between items-start">
            <div className="max-w-md bg-black/40 backdrop-blur-md p-4 rounded-lg border border-white/10 text-sm shadow-lg pointer-events-auto">
                <h1 className="text-xl font-bold text-green-400 mb-1 flex items-center gap-2">
                    <TreeDeciduous size={20} /> TerraCraft <span className="text-xs text-gray-500 font-normal">PLANET MODE</span>
                </h1>
                <p className="text-gray-300 italic mb-2 min-h-[3em]">{lore || "Orbiting planet..."}</p>
                <div className="space-y-1 mt-4">
                    {logs.map((log, i) => (
                        <div key={i} className={`text-xs ${i === 0 ? 'text-white font-semibold' : 'text-gray-400'}`}>
                            {i === 0 ? '> ' : ''}{log}
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {gameState === GameState.PLAYING && (
          <>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-auto">
              {inventoryOpen && (
                <div className="bg-black/80 backdrop-blur-md p-4 rounded-lg border border-white/10">
                  <div className="text-center text-xs text-gray-400 mb-2">INVENTORY</div>
                  <div className="grid grid-cols-9 gap-1">
                    {stats.inventory.slots.slice(9, 36).map((slot, index) => {
                      const actualIndex = index + 9;
                      return (
                        <div
                          key={actualIndex}
                          draggable={!!slot}
                          onDragStart={() => setDraggedSlot(actualIndex)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => {
                            if (draggedSlot !== null) {
                              handleItemMove(draggedSlot, actualIndex);
                              setDraggedSlot(null);
                            }
                          }}
                          className={`w-12 h-12 bg-gray-900/80 border rounded flex flex-col items-center justify-center transition-all cursor-pointer ${
                            draggedSlot === actualIndex ? 'border-green-500 bg-gray-700' : 'border-gray-600 hover:bg-gray-800'
                          }`}
                        >
                          {slot ? (
                            <>
                              <span className="text-2xl pointer-events-none">{slot.item.icon}</span>
                              <span className="text-xs text-white font-bold pointer-events-none">{slot.count}</span>
                            </>
                          ) : (
                            <span className="text-gray-700">—</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <Hotbar 
                inventory={stats.inventory} 
                selectedSlot={selectedHotbarSlot}
                onSlotSelect={setSelectedHotbarSlot}
                onItemDragStart={setDraggedSlot}
                onItemDrop={handleItemMove}
                draggedSlot={draggedSlot}
              />

              <div className="flex items-center gap-6 bg-black/40 backdrop-blur-md px-6 py-3 rounded-lg border border-white/10">
                <div className="flex items-center gap-2">
                    <Beef size={18} className={`${stats.hunger < 30 ? 'text-orange-500 animate-pulse' : 'text-orange-400'}`} />
                    <div className="w-24 h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
                        <div className="h-full bg-orange-500 transition-all duration-500" style={{ width: `${stats.hunger}%` }}></div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Droplets size={18} className={`${stats.thirst < 30 ? 'text-blue-500 animate-pulse' : 'text-blue-400'}`} />
                    <div className="w-24 h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
                        <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${stats.thirst}%` }}></div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Zap size={18} className={`${stats.stamina < 20 ? 'text-yellow-500 animate-pulse' : 'text-yellow-400'}`} />
                    <div className="w-24 h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
                        <div className="h-full bg-yellow-400 transition-all duration-100" style={{ width: `${stats.stamina}%` }}></div>
                    </div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-6 left-6 bg-black/20 backdrop-blur-sm p-2 rounded-lg border border-white/5">
                <BodyFigure body={stats.body} />
            </div>
          </>
        )}

        <KeyboardListener 
  inventoryOpen={inventoryOpen}
  onToggleInventory={toggleInventory}
  onSelectSlot={setSelectedHotbarSlot}
  />
      </div>

      {gameState === GameState.MENU && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-[2px] pointer-events-auto">
            <div className="flex-1 flex items-center justify-center">
                 <div className="text-center transform -translate-y-12">
                    <h1 className="text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-green-400 to-green-700 p-4">
                        TerraCraft
                    </h1>
                    <p className="text-green-800 font-bold tracking-[0.5em] text-lg mt-2 uppercase">Survival Evolved</p>
                 </div>
            </div>
            <div className="absolute bottom-16 left-16 flex flex-col gap-6 items-start">
                 <MenuButton onClick={() => startGame(PLANET_RADIUS_HUGE)}>
                    Singleplayer
                 </MenuButton>
                 <MenuButton onClick={() => alert("Offline")} disabled>Multiplayer</MenuButton>
                 <MenuButton onClick={() => window.location.reload()}>Quit</MenuButton>
            </div>
             <div className="absolute bottom-4 right-6 text-green-900 font-mono text-sm">TerraCraft v0.1-ALPHA</div>
        </div>
      )}

      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-red-900/40 backdrop-blur pointer-events-auto">
            <div className="text-center">
                <h1 className="text-6xl font-black text-red-500 mb-4">YOU DIED</h1>
                <button onClick={() => setGameState(GameState.MENU)} className="px-8 py-3 bg-white text-black font-bold rounded hover:bg-gray-200">
                    Main Menu
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

const MenuButton: React.FC<{ onClick: () => void; children: React.ReactNode; disabled?: boolean }> = ({ onClick, children, disabled }) => (
    <button 
        onClick={onClick}
        className={`group relative text-left transition-all duration-300 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:translate-x-2'}`}
    >
        <span className={`text-4xl font-bold uppercase tracking-widest ${disabled ? 'text-gray-600' : 'text-gray-400 group-hover:text-green-400'}`}>
            {children}
        </span>
        {!disabled && <span className="absolute -left-6 top-1/2 -translate-y-1/2 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity font-mono text-2xl">&gt;</span>}
    </button>
);

const KeyboardListener: React.FC<{ 
  inventoryOpen: boolean;
  onToggleInventory: () => void;
  onSelectSlot: (slot: number) => void;
}> = ({ inventoryOpen, onToggleInventory, onSelectSlot }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { 
      if (e.code === 'KeyE') onToggleInventory();

      if (e.code === 'Escape' && inventoryOpen) onToggleInventory();

      if (e.code.startsWith('Digit')) {
        const num = parseInt(e.code.replace('Digit', ''));
        if (num >= 1 && num <= 9) {
          onSelectSlot(num - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inventoryOpen, onToggleInventory, onSelectSlot]);

  return null;
}

export default App;
