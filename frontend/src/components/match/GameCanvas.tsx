"use client"

import { useRef, useEffect } from "react"

interface GameCanvasProps {
  snakePositions: {
    [key: string]: [number, number][];
  };
  apples: [number, number][];
  width: number;
  height: number;
  modelIds: string[];
  colorConfig?: { [key: string]: string };
}

export default function GameCanvas({ snakePositions, apples, width, height, modelIds, colorConfig = {} }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    // Set the canvas dimensions accounting for device pixel ratio
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    // Scale the context to ensure correct drawing
    ctx.scale(dpr, dpr);
    
    // Set CSS size
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    
    // Adjust cell size based on available space
    const scaledCellSize = (rect.width / width);

    // Clear canvas
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width * scaledCellSize, height * scaledCellSize);

    // Draw grid
    ctx.strokeStyle = "#E5E7EB";
    for (let i = 0; i <= width; i++) {
      ctx.beginPath();
      ctx.moveTo(i * scaledCellSize, 0);
      ctx.lineTo(i * scaledCellSize, height * scaledCellSize);
      ctx.stroke();
    }

    for (let i = 0; i <= height; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * scaledCellSize);
      ctx.lineTo(width * scaledCellSize, i * scaledCellSize);
      ctx.stroke();
    }

    // Draw snakes
    const colors = ["#3B82F6", "#8B5CF6"]; // Blue for first snake, purple for second
    
    modelIds.forEach((modelId, index) => {
      const snake = snakePositions[modelId];
      if (!snake) return;
      
      const snakeColor = colorConfig[modelId] || colors[index % colors.length];
      ctx.fillStyle = snakeColor;
      
      // Draw snake body
      for (let i = 1; i < snake.length; i++) {
        const [x, y] = snake[i];
        // Flip the y-coordinate to match the game's coordinate system
        // where (0,0) is at the bottom-left
        const flippedY = height - 1 - y;
        ctx.fillRect(x * scaledCellSize + 1, flippedY * scaledCellSize + 1, scaledCellSize - 2, scaledCellSize - 2);
      }
      
      // Draw snake head with a darker shade and slightly larger
      if (snake.length > 0) {
        const [headX, headY] = snake[0];
        const flippedHeadY = height - 1 - headY;
        
        // Draw a slightly larger rectangle for the head
        ctx.fillStyle = darkenColor(snakeColor, 0.3); // Darker version of snake color
        ctx.fillRect(
          headX * scaledCellSize, 
          flippedHeadY * scaledCellSize, 
          scaledCellSize, 
          scaledCellSize
        );
        
        // Add eyes to make the head more distinctive
        ctx.fillStyle = "#FFFFFF";
        const eyeSize = scaledCellSize / 5;
        ctx.fillRect(
          headX * scaledCellSize + scaledCellSize / 4, 
          flippedHeadY * scaledCellSize + scaledCellSize / 3, 
          eyeSize, 
          eyeSize
        );
        ctx.fillRect(
          headX * scaledCellSize + scaledCellSize * 3/4 - eyeSize, 
          flippedHeadY * scaledCellSize + scaledCellSize / 3, 
          eyeSize, 
          eyeSize
        );
      }
    });

    // Helper function to darken a color
    function darkenColor(color: string, amount: number): string {
      // Remove the # if present
      color = color.replace('#', '');
      
      // Parse the color components
      const r = parseInt(color.substring(0, 2), 16);
      const g = parseInt(color.substring(2, 4), 16);
      const b = parseInt(color.substring(4, 6), 16);
      
      // Darken each component
      const darkenedR = Math.max(0, Math.floor(r * (1 - amount)));
      const darkenedG = Math.max(0, Math.floor(g * (1 - amount)));
      const darkenedB = Math.max(0, Math.floor(b * (1 - amount)));
      
      // Convert back to hex
      return `#${darkenedR.toString(16).padStart(2, '0')}${darkenedG.toString(16).padStart(2, '0')}${darkenedB.toString(16).padStart(2, '0')}`;
    }

    // Draw apples
    ctx.fillStyle = "#EA2014"; // Red color
    apples.forEach(([x, y]) => {
      // Flip the y-coordinate for apples too
      const flippedY = height - 1 - y;
      ctx.fillRect(x * scaledCellSize + 1, flippedY * scaledCellSize + 1, scaledCellSize - 2, scaledCellSize - 2);
    });
  }, [snakePositions, apples, width, height, modelIds, colorConfig]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex items-center justify-center aspect-square border-t-2">
      <canvas
        ref={canvasRef}
        className="w-[90%] h-[90%] border-4 border-gray-200 rounded"
      />
    </div>
  );
} 