// components/DraggableTimeline.tsx
import React, { useRef, useState, useEffect } from 'react';
import { WeightedScene } from '../lib/templates';

interface DraggableTimelineProps {
  scenes: WeightedScene[];
  duration: number;
  currentTime: number;
  onSceneUpdate: (updatedScenes: WeightedScene[]) => void;
  onSeek: (time: number) => void;
}

const DraggableTimeline: React.FC<DraggableTimelineProps> = ({
  scenes,
  duration,
  currentTime,
  onSceneUpdate,
  onSeek,
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [draggingHandle, setDraggingHandle] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (timelineRef.current && !isDragging) {
      const rect = timelineRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, clickX / rect.width));
      onSeek(duration * percentage);
    }
  };

  const handleMouseDown = (index: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingHandle(index);
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggingHandle === null || !timelineRef.current) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const moveX = e.clientX - rect.left;
      const totalWidth = rect.width;

      const newScenes = [...scenes];
      const totalWeight = newScenes.reduce((sum, s) => sum + s.durationWeight, 0);

      // Calculate the new percentage position
      const newPercentage = Math.max(0, Math.min(100, (moveX / totalWidth) * 100));

      // Calculate current handle positions
      let cumulativePercentage = 0;
      const handlePercentages = scenes.map((scene) => {
        cumulativePercentage += (scene.durationWeight / totalWeight) * 100;
        return cumulativePercentage;
      });

      // Get constraints for this handle
      const previousHandlePercentage = draggingHandle > 0 ? handlePercentages[draggingHandle - 1] : 0;
      const nextHandlePercentage = draggingHandle < scenes.length - 2 ? handlePercentages[draggingHandle + 1] : 100;
      
      // Clamp the new percentage with minimum scene size (2% of total)
      const minSceneSize = 2;
      const clampedNewPercentage = Math.max(
        previousHandlePercentage + minSceneSize, 
        Math.min(nextHandlePercentage - minSceneSize, newPercentage)
      );

      // Calculate the change needed
      const currentHandlePercentage = handlePercentages[draggingHandle];
      const deltaPercentage = clampedNewPercentage - currentHandlePercentage;
      const deltaWeight = (deltaPercentage / 100) * totalWeight;

      // Apply the change to adjacent scenes
      if (Math.abs(deltaWeight) > 0.01) { // Only update if change is significant
        newScenes[draggingHandle].durationWeight = Math.max(0.1, newScenes[draggingHandle].durationWeight + deltaWeight);
        newScenes[draggingHandle + 1].durationWeight = Math.max(0.1, newScenes[draggingHandle + 1].durationWeight - deltaWeight);

        onSceneUpdate(newScenes);
      }
    };

    const handleMouseUp = () => {
      setDraggingHandle(null);
      setTimeout(() => setIsDragging(false), 10); // Small delay to prevent accidental seeks
    };

    if (draggingHandle !== null) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingHandle, scenes, onSceneUpdate]);

  const totalDurationWeight = scenes.reduce((sum, scene) => sum + scene.durationWeight, 0);

  return (
    <div className="w-full space-y-2">
      {/* Timeline visualization */}
      <div
        ref={timelineRef}
        className="relative w-full h-8 bg-gray-800 rounded-lg cursor-pointer flex items-center overflow-hidden"
        onClick={handleSeek}
      >
        {/* Scene blocks */}
        {scenes.map((scene, index) => {
          const widthPercentage = (scene.durationWeight / totalDurationWeight) * 100;
          return (
            <div
              key={index}
              className="h-full flex items-center justify-center text-white text-xs font-regular relative transition-all duration-150"
              style={{
                width: `${widthPercentage}%`,
                backgroundColor: `#00000`, // Golden ratio spacing for colors
                minWidth: '20px'
              }}
            >
              <span className="truncate px-1">
                Scene {index + 1}
              </span>
            </div>
          );
        })}

        {/* Draggable handles between scenes */}
        {scenes.slice(0, -1).map((_, index) => {
          const leftPercentage = scenes.slice(0, index + 1).reduce(
            (sum, s) => sum + (s.durationWeight / totalDurationWeight) * 100, 
            0
          );
          return (
            <div
              key={`handle-${index}`}
              className={`absolute top-0 bottom-0 w-3 cursor-col-resize z-10 flex items-center justify-center transition-all duration-150 ${
                draggingHandle === index 
                  ? 'bg-orange-400' 
                  : 'bg-gray-700 hover:bg-orange-300'
              }`}
              style={{ left: `calc(${leftPercentage}% - 6px)` }}
              onMouseDown={handleMouseDown(index)}
            >
              <div className="w-1 h-8 bg-white/70 rounded-full"></div>
            </div>
          );
        })}

        {/* Playhead indicator */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-orange-500 pointer-events-none z-20 shadow-lg"
          style={{ left: `${(currentTime / duration) * 100}%` }}
        >
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-orange-500 rounded-full shadow-md"></div>
        </div>
      </div>

      {/* Scene duration info */}
      <div className="flex gap-1 text-xs text-gray-400">
        {scenes.map((scene, index) => {
          const scenePercentage = (scene.durationWeight / totalDurationWeight) * 100;
          const sceneDuration = (scene.durationWeight / totalDurationWeight) * duration;
          return (
            <div
              key={index}
              className="flex-1 text-center truncate"
              style={{ minWidth: '30px' }}
            >
              {sceneDuration.toFixed(1)}s ({scenePercentage.toFixed(1)}%)
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DraggableTimeline;
