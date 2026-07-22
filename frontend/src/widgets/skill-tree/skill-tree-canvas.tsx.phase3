'use client';

import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { SkillLevelPicker } from '@/features/skill-rating/skill-level-picker';
import { ArrowRight, Expand, Minimize2, Search, Filter } from 'lucide-react';

interface SkillTreeCanvasProps {
  treeId: string;
  onNodeSelect?: (node: any) => void;
  readOnly?: boolean;
  className?: string;
}

export function SkillTreeCanvas({ treeId, onNodeSelect, readOnly, className }: SkillTreeCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [app, setApp] = useState<any>(null);
  const [tree, setTree] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const initPIXI = async () => {
      const PIXI = (await import('pixi.js')).default;
      
      const app = new PIXI.Application({
        width: canvasRef.current?.clientWidth || 800,
        height: canvasRef.current?.clientHeight || 600,
        backgroundColor: 0x0a0a0a,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        antialias: true,
      });

      canvasRef.current?.appendChild(app.view as HTMLCanvasElement);
      setApp(app);

      app.stage.eventMode = 'static';
      app.stage.hitArea = app.screen;

      app.stage.on('pointerdown', (event: any) => {
        if (event.target === app.stage) {
          setSelectedNode(null);
          setShowSidebar(false);
        }
      });

      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        app.destroy(true, { children: true, texture: true, baseTexture: true });
      };
    };

    initPIXI();
  }, []);

  const handleResize = () => {
    if (app && canvasRef.current) {
      app.renderer.resize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    }
  };

  useEffect(() => {
    if (!app) return;

    const loadTree = async () => {
      try {
        const response = await fetch(`/api/trees/${treeId}`);
        if (response.ok) {
          const data = await response.json();
          setTree(data);
          renderTree(app, data);
        }
      } catch (error) {
        console.error('Failed to load tree:', error);
      }
    };

    loadTree();
  }, [app, treeId]);

  const renderTree = (app: any, treeData: any) => {
    if (!treeData?.skills) return;

    const graphics = new (await import('pixi.js')).default.Graphics();
    app.stage.addChild(graphics);

    treeData.skills.forEach((skill: any) => {
      const x = skill.x || Math.random() * 600 + 100;
      const y = skill.y || Math.random() * 400 + 100;

      const container = new (await import('pixi.js')).default.Container();
      container.x = x;
      container.y = y;
      container.eventMode = 'static';
      container.cursor = 'pointer';

      const circle = new (await import('pixi.js')).default.Graphics();
      circle.beginFill(0x2d6a4f);
      circle.drawCircle(0, 0, 40);
      circle.endFill();
      circle.lineStyle(3, 0x40916c);
      circle.drawCircle(0, 0, 40);

      const text = new (await import('pixi.js')).default.Text(skill.name, {
        fontFamily: 'system-ui',
        fontSize: 12,
        fill: 0xffffff,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: 80,
      });
      text.anchor.set(0.5);
      text.y = 55;

      container.addChild(circle, text);
      container.on('pointerdown', (event: any) => {
        event.stopPropagation();
        setSelectedNode(skill);
        setShowSidebar(true);
        onNodeSelect?.(skill);
      });

      graphics.addChild(container);
    });

    if (treeData.connections) {
      const lines = new (await import('pixi.js')).default.Graphics();
      lines.lineStyle(2, 0x40916c, 0.5);
      
      treeData.connections.forEach((conn: any) => {
        const source = treeData.skills.find((s: any) => s.id === conn.source);
        const target = treeData.skills.find((s: any) => s.id === conn.target);
        if (source && target) {
          lines.moveTo(source.x || 0, source.y || 0);
          lines.lineTo(target.x || 0, target.y || 0);
        }
      });
      app.stage.addChildAt(lines, 0);
    }
  };

  return (
    <div className={cn('relative w-full h-[600px]', className)}>
      <div ref={canvasRef} className="w-full h-full" />
      
      {showSidebar && selectedNode && (
        <div className="fixed inset-0 z-50 bg-black/50 lg:hidden" onClick={() => setShowSidebar(false)} />
      )}

      {showSidebar && selectedNode && (
        <aside className={cn(
          'fixed right-0 top-0 z-50 h-full w-80 bg-background border-l border-border-strong shadow-xl',
          'lg:relative lg:shadow-none lg:border-l lg:h-auto lg:w-80'
        )}>
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center justify-between border-b border-border-strong p-4">
              <h3 className="font-semibold">{selectedNode.name}</h3>
              <Button variant="ghost" size="icon" onClick={() => { setShowSidebar(false); setSelectedNode(null); }}>
                <Minimize2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <p className="text-text-muted">{selectedNode.description}</p>
              <div className="flex flex-wrap gap-1">
                {selectedNode.category && <span className="px-2 py-1 text-xs bg-surface-hover rounded"> {selectedNode.category} </span>}
              </div>
              
              {!readOnly && (
                <SkillLevelPicker
                  skillId={selectedNode.id}
                  initialLevel={selectedNode.currentLevel}
                  onChange={(level) => console.log('Level changed:', level)}
                />
              )}

              {selectedNode.trainings && selectedNode.trainings.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Available Trainings</h4>
                  <ul className="space-y-2">
                    {selectedNode.trainings.map((t: any) => (
                      <li key={t.id} className="text-sm text-text-muted">
                        <a href={t.url} target="_blank" rel="noopener" className="hover:text-primary underline">
                          {t.name}
                        </a>
                        {t.provider && <span className="text-text-muted ml-2">({t.provider})</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}