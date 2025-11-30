"use client";

import { useNetworkStore } from "@/lib/store/networkStore";
import { getNodeColor } from "@/lib/utils/graph";
import { useMemo } from "react";

interface MiniGraphProps {
    maxNodes?: number;
}

export default function MiniGraph({ maxNodes = 20 }: MiniGraphProps) {
    const { nodes, edges } = useNetworkStore();

    const displayNodes = useMemo(() => {
        if (nodes.length <= maxNodes) return nodes;

        const sorted = [...nodes].sort((a, b) => {
            const aLoad = (a.data.load || 0) / (a.data.capacity || 1);
            const bLoad = (b.data.load || 0) / (b.data.capacity || 1);
            const aConnections = a.data.connections?.length || 0;
            const bConnections = b.data.connections?.length || 0;

            if (aLoad !== bLoad) return bLoad - aLoad;
            return bConnections - aConnections;
        });

        return sorted.slice(0, maxNodes);
    }, [nodes, maxNodes]);

    const displayEdges = useMemo(() => {
        const nodeIds = new Set(displayNodes.map(n => n.id));
        return edges.filter(
            edge => nodeIds.has(edge.source) && nodeIds.has(edge.target)
        );
    }, [edges, displayNodes]);

    if (nodes.length === 0) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center text-gray-400">
                    <p className="text-sm font-medium">Nenhum nó na rede</p>
                    <p className="text-xs mt-1">Crie nós na página de Rede</p>
                </div>
            </div>
        );
    }

    const radius = 120;
    const centerX = 200;
    const centerY = 150;

    return (
        <div className="relative w-full h-full bg-gray-50 rounded-lg border border-gray-200 overflow-hidden bg-white">
            <svg
                viewBox="0 0 400 300"
                className="w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {displayEdges.map((edge) => {
                    const sourceNode = displayNodes.find(n => n.id === edge.source);
                    const targetNode = displayNodes.find(n => n.id === edge.target);

                    if (!sourceNode || !targetNode) return null;

                    const sourceIndex = displayNodes.indexOf(sourceNode);
                    const targetIndex = displayNodes.indexOf(targetNode);

                    const angle1 = (sourceIndex / displayNodes.length) * 2 * Math.PI;
                    const angle2 = (targetIndex / displayNodes.length) * 2 * Math.PI;

                    const x1 = centerX + radius * Math.cos(angle1);
                    const y1 = centerY + radius * Math.sin(angle1);
                    const x2 = centerX + radius * Math.cos(angle2);
                    const y2 = centerY + radius * Math.sin(angle2);

                    const load = edge.data?.currentLoad || 0;
                    const capacity = edge.data?.capacity || 1;
                    const percentage = (load / capacity) * 100;
                    const strokeColor =
                        percentage >= 90 ? "#ef4444" :
                            percentage >= 75 ? "#f59e0b" :
                                percentage >= 50 ? "#eab308" :
                                    "#94a3b8";

                    return (
                        <line
                            key={edge.id}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke={strokeColor}
                            strokeWidth={1.5}
                            opacity={0.6}
                        />
                    );
                })}

                {displayNodes.map((node, index) => {
                    const angle = (index / displayNodes.length) * 2 * Math.PI;
                    const x = centerX + radius * Math.cos(angle);
                    const y = centerY + radius * Math.sin(angle);

                    const color = getNodeColor(node.data.load || 0, node.data.capacity || 100);

                    return (
                        <g key={node.id}>
                            <circle
                                cx={x}
                                cy={y}
                                r={8}
                                fill={color}
                                stroke="#1f2937"
                                strokeWidth={1.5}
                            />
                            {displayNodes.length <= 10 && (
                                <text
                                    x={x}
                                    y={y - 12}
                                    textAnchor="middle"
                                    fontSize="10"
                                    fill="#374151"
                                    fontWeight="500"
                                >
                                    {node.data.label || node.id}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>

            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-md text-gray-600 px-2 py-1 rounded">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 p-2 rounded-full bg-green-100">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>Normal</span>
                    </div>
                    <div className="flex items-center gap-1 p-2 rounded-full bg-yellow-100">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        <span>Atenção</span>
                    </div>
                    <div className="flex items-center gap-1 p-2 rounded-full bg-red-100">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span>Crítico</span>
                    </div>
                </div>
                {nodes.length > maxNodes && (
                    <span className="text-gray-500">
                        Mostrando {maxNodes} de {nodes.length} nós
                    </span>
                )}
            </div>
        </div>
    );
}

