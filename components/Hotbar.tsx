import React from 'react';
import { Inventory } from '../types';

interface HotbarProps {
  inventory: Inventory;
  selectedSlot: number;
  onSlotSelect: (index: number) => void;
  onItemDragStart: (index: number) => void;
  onItemDrop: (fromIndex: number, toIndex: number) => void;
  draggedSlot: number | null;
}

const Hotbar: React.FC<HotbarProps> = ({ 
  inventory, 
  selectedSlot, 
  onSlotSelect, 
  onItemDragStart,
  onItemDrop,
  draggedSlot
}) => {
  return (
    <div className="flex gap-2 bg-black/60 backdrop-blur-md p-2 rounded-lg border border-white/20">
      {inventory.slots.slice(0, 9).map((slot, index) => (
        <div
          key={index}
          draggable={!!slot}
          onDragStart={() => onItemDragStart(index)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (draggedSlot !== null) {
              onItemDrop(draggedSlot, index);
            }
          }}
          onClick={() => onSlotSelect(index)}
          className={`relative w-16 h-16 bg-gray-900/80 border-2 rounded flex flex-col items-center justify-center transition-all cursor-pointer ${
            draggedSlot === index 
              ? 'border-green-500 bg-gray-700 scale-105' 
              : selectedSlot === index 
                ? 'border-green-400 bg-green-900/30 scale-110 shadow-lg shadow-green-500/50' 
                : 'border-gray-600 hover:border-gray-400 hover:bg-gray-800/90'
          }`}
        >
          {/* Číslo slotu */}
          <div className="absolute -top-2 -left-2 w-5 h-5 bg-gray-800 border border-gray-600 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-400">
            {index + 1}
          </div>
          
          {/* Item */}
          {slot ? (
            <>
              <span className="text-3xl pointer-events-none">{slot.item.icon}</span>
              <span className="absolute bottom-1 right-1 text-xs font-bold text-white bg-black/70 px-1 rounded pointer-events-none">
                {slot.count}
              </span>
            </>
          ) : (
            <span className="text-gray-700 text-2xl">—</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default Hotbar;
