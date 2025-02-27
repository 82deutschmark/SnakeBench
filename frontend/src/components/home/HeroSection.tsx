"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";

export default function HeroSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions to match parent container
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Snake class
    class Snake {
      x: number;
      y: number;
      size: number;
      color: string;
      direction: number;
      speed: number;
      tail: { x: number; y: number }[];
      maxLength: number;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.size = 12;
        this.color = ["#4ade80", "#60a5fa", "#f97316", "#8b5cf6", "#000000"][
          Math.floor(Math.random() * 5)
        ];
        this.direction = Math.floor(Math.random() * 4); // 0: right, 1: down, 2: left, 3: up
        this.speed = 1 + Math.random() * 1.5;
        this.tail = [{ x, y }];
        this.maxLength = 30 + Math.floor(Math.random() * 15);
      }

      update(canvasWidth: number, canvasHeight: number) {
        // Change direction randomly
        if (Math.random() < 0.02) {
          this.direction = Math.floor(Math.random() * 4);
        }

        // Move based on direction
        switch (this.direction) {
          case 0:
            this.x += this.speed;
            break; // right
          case 1:
            this.y += this.speed;
            break; // down
          case 2:
            this.x -= this.speed;
            break; // left
          case 3:
            this.y -= this.speed;
            break; // up
        }

        // Wrap around edges
        if (this.x < 0) this.x = canvasWidth;
        if (this.x > canvasWidth) this.x = 0;
        if (this.y < 0) this.y = canvasHeight;
        if (this.y > canvasHeight) this.y = 0;

        // Add current position to tail
        this.tail.push({ x: this.x, y: this.y });

        // Limit tail length
        if (this.tail.length > this.maxLength) {
          this.tail.shift();
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        // Draw tail segments
        for (let i = 0; i < this.tail.length; i++) {
          const segment = this.tail[i];
          const alpha = i / this.tail.length; // Fade out the tail
          ctx.fillStyle =
            this.color +
            Math.floor(alpha * 255)
              .toString(16)
              .padStart(2, "0");
          ctx.fillRect(segment.x, segment.y, this.size, this.size);
        }
      }
    }

    // Create snakes
    const snakes: Snake[] = [];
    const SNAKE_COUNT = 20; // Adjust this number up or down for more or fewer snakes
    
    for (let i = 0; i < SNAKE_COUNT; i++) {
      snakes.push(
        new Snake(Math.random() * canvas.width, Math.random() * canvas.height)
      );
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      snakes.forEach((snake) => {
        snake.update(canvas.width, canvas.height);
        snake.draw(ctx);
      });

      requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <div className="bg-white border-b border-gray-200 relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-30"
      />
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          <h1 className="text-4xl font-press-start text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            LLMs Battle Snake
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500 font-mono">
            Watch AI models compete in real-time snake battles. Strategic
            thinking, path-finding, and decision-making on display.
          </p>
          <div className="mt-8 flex justify-center font-mono">
            <Button asChild className="font-mono">
              <Link href={`/match/${process.env.NEXT_PUBLIC_TOP_MATCH_ID}`}>
                Watch Top Match
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
