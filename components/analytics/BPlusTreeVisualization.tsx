"use client";

import { useMemo } from "react";

interface TreeNode {
    isLeaf: boolean;
    keys: number[];
    keyCount: number;
    values?: Array<{ key: number; value: number }>;
    children?: TreeNode[];
}

interface BPlusTreeVisualizationProps {
    treeStructure: TreeNode | null;
}

interface VisualNode {
    id: string;
    x: number;
    y: number;
    node: TreeNode;
    parentId?: string;
    level: number;
    index: number;
}

export default function BPlusTreeVisualization({ treeStructure }: BPlusTreeVisualizationProps) {
    const visualNodes = useMemo(() => {
        if (!treeStructure) return [];

        const nodes: VisualNode[] = [];
        const nodeIdCounter = { count: 0 };
        const positions = new Map<string, { x: number; y: number }>();

        // Primeiro, calcular a largura de cada subárvore
        const getSubtreeWidth = (node: TreeNode): number => {
            if (node.isLeaf || !node.children || node.children.length === 0) {
                return 1;
            }
            return node.children.reduce((sum, child) => sum + getSubtreeWidth(child), 0);
        };

        // Calcular posições usando layout hierárquico
        const calculatePositions = (
            node: TreeNode,
            level: number,
            leftBound: number,
            rightBound: number,
            y: number,
            parentId?: string,
            index: number = 0
        ): void => {
            const id = `node-${nodeIdCounter.count++}`;
            const subtreeWidth = getSubtreeWidth(node);
            const totalWidth = rightBound - leftBound;
            const nodeWidth = (subtreeWidth / getSubtreeWidth(treeStructure)) * totalWidth;
            const x = leftBound + nodeWidth / 2;

            positions.set(id, { x, y });
            nodes.push({
                id,
                x,
                y,
                node,
                parentId,
                level,
                index,
            });

            if (!node.isLeaf && node.children) {
                const childCount = node.children.length;
                let currentLeft = leftBound;

                node.children.forEach((child, idx) => {
                    const childSubtreeWidth = getSubtreeWidth(child);
                    const childWidth = (childSubtreeWidth / subtreeWidth) * nodeWidth;
                    const childRight = currentLeft + childWidth;
                    const childY = y + 100; // Espaçamento vertical entre níveis

                    calculatePositions(child, level + 1, currentLeft, childRight, childY, id, idx);
                    currentLeft = childRight;
                });
            }
        };

        const totalWidth = 1200;
        calculatePositions(treeStructure, 0, 0, totalWidth, 50);

        return nodes;
    }, [treeStructure]);

    const edges = useMemo(() => {
        return visualNodes
            .filter(node => node.parentId)
            .map(node => {
                const parent = visualNodes.find(n => n.id === node.parentId);
                if (!parent) return null;
                return {
                    id: `edge-${node.parentId}-${node.id}`,
                    x1: parent.x,
                    y1: parent.y + 40,
                    x2: node.x,
                    y2: node.y - 20,
                };
            })
            .filter((edge): edge is NonNullable<typeof edge> => edge !== null);
    }, [visualNodes]);

    if (!treeStructure) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center text-gray-400">
                    <p className="text-sm font-medium">Árvore vazia</p>
                    <p className="text-xs mt-1">Nenhum dado histórico armazenado</p>
                </div>
            </div>
        );
    }

    // Calcular dimensões do SVG baseado nos nós
    const maxX = visualNodes.length > 0 ? Math.max(...visualNodes.map(n => n.x), 1200) : 1200;
    const maxY = visualNodes.length > 0 ? Math.max(...visualNodes.map(n => n.y), 500) : 500;
    const minX = visualNodes.length > 0 ? Math.min(...visualNodes.map(n => n.x), 0) : 0;
    const minY = visualNodes.length > 0 ? Math.min(...visualNodes.map(n => n.y), 0) : 0;
    const padding = 80;

    return (
        <div className="relative w-full h-full bg-gray-50 rounded-lg border border-gray-200 overflow-auto">
            <svg
                viewBox={`${minX - padding} ${minY - padding} ${maxX - minX + 2 * padding} ${maxY - minY + 2 * padding}`}
                className="w-full h-full min-h-[500px]"
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Renderizar arestas primeiro (atrás dos nós) */}
                {edges.map((edge) => (
                    <line
                        key={edge.id}
                        x1={edge.x1}
                        y1={edge.y1}
                        x2={edge.x2}
                        y2={edge.y2}
                        stroke="#94a3b8"
                        strokeWidth={2}
                        markerEnd="url(#arrowhead)"
                    />
                ))}

                {/* Definir seta para as arestas */}
                <defs>
                    <marker
                        id="arrowhead"
                        markerWidth="10"
                        markerHeight="10"
                        refX="9"
                        refY="3"
                        orient="auto"
                    >
                        <polygon points="0 0, 10 3, 0 6" fill="#94a3b8" />
                    </marker>
                </defs>

                {/* Renderizar nós */}
                {visualNodes.map((visualNode) => {
                    const { node, x, y, level } = visualNode;
                    const isLeaf = node.isLeaf;
                    const nodeColor = isLeaf ? "#dcfce7" : "#dbeafe";
                    const borderColor = isLeaf ? "#86efac" : "#93c5fd";
                    const textColor = isLeaf ? "#166534" : "#1e40af";

                    // Tamanho do nó baseado no número de chaves
                    const nodeWidth = Math.max(120, node.keyCount * 25 + 40);
                    const nodeHeight = 60;

                    return (
                        <g key={visualNode.id}>
                            {/* Retângulo do nó */}
                            <rect
                                x={x - nodeWidth / 2}
                                y={y - nodeHeight / 2}
                                width={nodeWidth}
                                height={nodeHeight}
                                fill={nodeColor}
                                stroke={borderColor}
                                strokeWidth={2}
                                rx={8}
                            />

                            {/* Tipo do nó */}
                            <text
                                x={x}
                                y={y - 15}
                                textAnchor="middle"
                                fontSize="10"
                                fontWeight="bold"
                                fill={textColor}
                            >
                                {isLeaf ? "Folha" : "Nó Interno"}
                            </text>

                            {/* Chaves (mostrar até 3, ou indicar mais) */}
                            <text
                                x={x}
                                y={y + 5}
                                textAnchor="middle"
                                fontSize="9"
                                fill={textColor}
                            >
                                {node.keyCount} chave{node.keyCount !== 1 ? "s" : ""}
                            </text>

                            {/* Timestamps (primeiras chaves) */}
                            {node.keys.length > 0 && (
                                <text
                                    x={x}
                                    y={y + 18}
                                    textAnchor="middle"
                                    fontSize="8"
                                    fill="#6b7280"
                                >
                                    {node.keys.slice(0, 2).map(key => {
                                        const date = new Date(key);
                                        return date.toLocaleDateString("pt-BR", {
                                            day: "2-digit",
                                            month: "2-digit",
                                        });
                                    }).join(", ")}
                                    {node.keys.length > 2 && "..."}
                                </text>
                            )}

                            {/* Indicador de nível */}
                            <circle
                                cx={x - nodeWidth / 2 + 8}
                                cy={y - nodeHeight / 2 + 8}
                                r={4}
                                fill={level === 0 ? "#f59e0b" : level === 1 ? "#3b82f6" : "#8b5cf6"}
                            />
                        </g>
                    );
                })}
            </svg>

            {/* Legenda */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs text-gray-600 px-2 py-1 rounded bg-white/80 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300"></div>
                        <span>Nó Interno</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-green-100 border border-green-300"></div>
                        <span>Folha</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        <span>Raiz</span>
                    </div>
                </div>
                <span className="text-gray-500">
                    {visualNodes.length} nó{visualNodes.length !== 1 ? "s" : ""} • {visualNodes.filter(n => n.node.isLeaf).length} folha{visualNodes.filter(n => n.node.isLeaf).length !== 1 ? "s" : ""}
                </span>
            </div>
        </div>
    );
}

