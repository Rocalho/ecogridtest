import { create } from "zustand";
import {
    getNodeColor,
    ReactFlowEdge,
    ReactFlowNode,
    backendNodeToReactFlowNode,
    backendEdgeToReactFlowEdge,
    reactFlowNodeToBackendPost,
    reactFlowEdgeToBackendPost,
} from "../utils/graph";

interface NetworkStore {
    nodes: ReactFlowNode[];
    edges: ReactFlowEdge[];
    selectedNode: ReactFlowNode | null;
    selectedEdge: ReactFlowEdge | null;

    addNode: (node: Omit<ReactFlowNode, "id" | "position"> & { position?: { x: number; y: number } }) => void;
    updateNode: (id: string, updates: Partial<ReactFlowNode>) => void;
    deleteNode: (id: string) => void;
    selectNode: (node: ReactFlowNode | null) => void;

    addEdge: (edge: Omit<ReactFlowEdge, "id">) => void;
    updateEdge: (id: string, updates: Partial<ReactFlowEdge>) => void;
    deleteEdge: (id: string) => void;
    selectEdge: (edge: ReactFlowEdge | null) => void;

    getNodeById: (id: string) => ReactFlowNode | undefined;
    getEdgesByNodeId: (nodeId: string) => ReactFlowEdge[];
    updateNodePosition: (id: string, position: { x: number; y: number }) => void;
    updateNodeLoad: (id: string, load: number) => void;
    updateNodeStyle: (id: string) => void;

    clearNetwork: () => void;

    loadNetworkFromBackend: () => Promise<void>;
    saveNetworkToBackend: () => Promise<void>;
    addNodeFromBackend: (node: Omit<ReactFlowNode, "id" | "position"> & { position?: { x: number; y: number } }) => Promise<void>;
    addEdgeFromBackend: (edge: Omit<ReactFlowEdge, "id">) => Promise<void>;
    setNetworkFromBackend: (nodes: ReactFlowNode[], edges: ReactFlowEdge[]) => void;
}

let nodeIdCounter = 1;
let edgeIdCounter = 1;

export const useNetworkStore = create<NetworkStore>((set, get) => ({
    nodes: [],
    edges: [],
    selectedNode: null,
    selectedEdge: null,

    addNode: (nodeData) => {
        const id = `node-${nodeIdCounter++}`;
        const position = nodeData.position || { x: Math.random() * 400, y: Math.random() * 400 };

        const newNode: ReactFlowNode = {
            id,
            position,
            data: {
                ...nodeData.data,
                connections: [],
            },
            style: {
                background: getNodeColor(nodeData.data.load || 0, nodeData.data.capacity || 100),
                color: "#fff",
                border: "2px solid #1f2937",
                borderRadius: "8px",
                width: 120,
                height: 60,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
            },
        };

        set((state) => ({
            nodes: [...state.nodes, newNode],
        }));

        get().updateNodeStyle(id);
    },

    updateNode: (id, updates) => {
        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === id ? { ...node, ...updates } : node
            ),
        }));

        if (updates.data?.load !== undefined || updates.data?.capacity !== undefined) {
            get().updateNodeStyle(id);
        }
    },

    deleteNode: (id) => {
        set((state) => {
            const newNodes = state.nodes.filter((node) => node.id !== id);

            const newEdges = state.edges.filter(
                (edge) => edge.source !== id && edge.target !== id
            );

            newNodes.forEach((node) => {
                node.data.connections = node.data.connections.filter((connId) => connId !== id);
            });

            return {
                nodes: newNodes,
                edges: newEdges,
                selectedNode: state.selectedNode?.id === id ? null : state.selectedNode,
            };
        });
    },

    selectNode: (node) => {
        set({ selectedNode: node, selectedEdge: null });
    },

    addEdge: (edgeData) => {
        const id = `edge-${edgeIdCounter++}`;
        const sourceNode = get().getNodeById(edgeData.source);
        const targetNode = get().getNodeById(edgeData.target);

        if (!sourceNode || !targetNode) {
            console.error("Nós de origem ou destino não encontrados");
            return;
        }

        if (!sourceNode.data.connections.includes(edgeData.target)) {
            sourceNode.data.connections.push(edgeData.target);
        }
        if (!targetNode.data.connections.includes(edgeData.source)) {
            targetNode.data.connections.push(edgeData.source);
        }

        const newEdge: ReactFlowEdge = {
            id,
            source: edgeData.source,
            target: edgeData.target,
            data: edgeData.data || {
                distance: 0,
                resistance: 0,
                capacity: 0,
            },
            style: {
                stroke: "#64748b",
                strokeWidth: 2,
            },
            label: edgeData.data?.distance ? `${edgeData.data.distance}km` : undefined,
        };

        set((state) => ({
            edges: [...state.edges, newEdge],
            nodes: state.nodes.map((node) =>
                node.id === sourceNode.id || node.id === targetNode.id
                    ? { ...node, data: { ...node.data } }
                    : node
            ),
        }));
    },

    updateEdge: (id, updates) => {
        set((state) => ({
            edges: state.edges.map((edge) =>
                edge.id === id ? { ...edge, ...updates } : edge
            ),
        }));
    },

    deleteEdge: (id) => {
        set((state) => {
            const edge = state.edges.find((e) => e.id === id);
            if (!edge) return state;

            const sourceNode = state.nodes.find((n) => n.id === edge.source);
            const targetNode = state.nodes.find((n) => n.id === edge.target);

            if (sourceNode) {
                sourceNode.data.connections = sourceNode.data.connections.filter(
                    (connId) => connId !== edge.target
                );
            }
            if (targetNode) {
                targetNode.data.connections = targetNode.data.connections.filter(
                    (connId) => connId !== edge.source
                );
            }

            return {
                edges: state.edges.filter((e) => e.id !== id),
                nodes: state.nodes,
                selectedEdge: state.selectedEdge?.id === id ? null : state.selectedEdge,
            };
        });
    },

    selectEdge: (edge) => {
        set({ selectedEdge: edge, selectedNode: null });
    },

    getNodeById: (id) => {
        return get().nodes.find((node) => node.id === id);
    },

    getEdgesByNodeId: (nodeId) => {
        return get().edges.filter(
            (edge) => edge.source === nodeId || edge.target === nodeId
        );
    },

    updateNodePosition: (id, position) => {
        get().updateNode(id, { position });
    },

    updateNodeLoad: (id, load) => {
        const node = get().getNodeById(id);
        if (node) {
            get().updateNode(id, {
                data: { ...node.data, load },
            });
        }
    },

    updateNodeStyle: (id) => {
        const node = get().getNodeById(id);
        if (!node) return;

        const color = getNodeColor(node.data.load || 0, node.data.capacity || 100);
        get().updateNode(id, {
            style: {
                ...node.style,
                background: color,
            },
        });
    },

    clearNetwork: () => {
        set({
            nodes: [],
            edges: [],
            selectedNode: null,
            selectedEdge: null,
        });
        nodeIdCounter = 1;
        edgeIdCounter = 1;
    },

    loadNetworkFromBackend: async () => {
        try {
            const response = await fetch("/api/network");
            if (!response.ok) {
                throw new Error("Erro ao carregar rede do backend");
            }
            const result = await response.json();
            if (result.success && result.data) {
                const { nodes: backendNodes, edges: backendEdges } = result.data;

                const reactFlowNodes: ReactFlowNode[] = backendNodes.map((backendNode: any, index: number) => {
                    const position = backendNode.x !== undefined && backendNode.y !== undefined
                        ? { x: backendNode.x, y: backendNode.y }
                        : { x: (index % 5) * 200 + 100, y: Math.floor(index / 5) * 150 + 100 };
                    return backendNodeToReactFlowNode(backendNode, position);
                });

                const reactFlowEdges: ReactFlowEdge[] = backendEdges.map((backendEdge: any) =>
                    backendEdgeToReactFlowEdge(backendEdge)
                );

                reactFlowEdges.forEach((edge) => {
                    const sourceNode = reactFlowNodes.find((n) => n.id === edge.source);
                    const targetNode = reactFlowNodes.find((n) => n.id === edge.target);
                    if (sourceNode && !sourceNode.data.connections.includes(edge.target)) {
                        sourceNode.data.connections.push(edge.target);
                    }
                    if (targetNode && !targetNode.data.connections.includes(edge.source)) {
                        targetNode.data.connections.push(edge.source);
                    }
                });

                get().setNetworkFromBackend(reactFlowNodes, reactFlowEdges);
            }
        } catch (error) {
            console.error("Erro ao carregar rede do backend:", error);
            throw error;
        }
    },

    saveNetworkToBackend: async () => {
        try {
            const state = get();
            const nodes = state.nodes;
            const edges = state.edges;

            const backendNodes = nodes.map((node) => reactFlowNodeToBackendPost(node));
            const backendEdges = edges.map((edge) => reactFlowEdgeToBackendPost(edge));

            const response = await fetch("/api/network", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    nodes: backendNodes,
                    edges: backendEdges,
                    edgeIdCounter: edgeIdCounter,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Erro ao salvar rede no backend");
            }

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || "Erro ao salvar rede no backend");
            }
        } catch (error) {
            console.error("Erro ao salvar rede no backend:", error);
            throw error;
        }
    },

    addNodeFromBackend: async (nodeData) => {
        try {
            const position = nodeData.position || { x: Math.random() * 400, y: Math.random() * 400 };

            const tempNode: ReactFlowNode = {
                id: `temp-${Date.now()}`,
                position,
                data: {
                    ...nodeData.data,
                    connections: [],
                },
                style: {
                    background: getNodeColor(nodeData.data.load || 0, nodeData.data.capacity || 100),
                    color: "#fff",
                    border: "2px solid #1f2937",
                    borderRadius: "8px",
                    width: 120,
                    height: 60,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                },
            };

            const backendPostData = reactFlowNodeToBackendPost(tempNode);
            delete backendPostData.id;

            const response = await fetch("/api/network/node", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(backendPostData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Erro ao adicionar nó no backend");
            }

            const result = await response.json();
            if (result.success && result.data) {
                const backendNode = result.data;
                const updatedNode = backendNodeToReactFlowNode(backendNode, position);

                const match = updatedNode.id.match(/node-(\d+)/);
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (num >= nodeIdCounter) {
                        nodeIdCounter = num + 1;
                    }
                }

                set((state) => ({
                    nodes: [...state.nodes, updatedNode],
                }));

                get().updateNodeStyle(updatedNode.id);
            } else {
                throw new Error("Resposta inválida do backend");
            }
        } catch (error) {
            console.error("Erro ao adicionar nó no backend:", error);
            throw error;
        }
    },

    addEdgeFromBackend: async (edgeData) => {
        try {
            const sourceNode = get().getNodeById(edgeData.source);
            const targetNode = get().getNodeById(edgeData.target);

            if (!sourceNode || !targetNode) {
                throw new Error("Nós de origem ou destino não encontrados");
            }

            const tempEdge: ReactFlowEdge = {
                id: `temp-${Date.now()}`,
                source: edgeData.source,
                target: edgeData.target,
                data: edgeData.data || {
                    distance: 0,
                    resistance: 0,
                    capacity: 0,
                },
                style: {
                    stroke: "#64748b",
                    strokeWidth: 2,
                },
                label: edgeData.data?.distance ? `${edgeData.data.distance}km` : undefined,
            };

            const backendPostData = reactFlowEdgeToBackendPost(tempEdge);
            delete backendPostData.id;

            const response = await fetch("/api/network/edge", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(backendPostData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Erro ao adicionar aresta no backend");
            }

            const result = await response.json();
            if (result.success && result.data) {
                const backendEdge = result.data;
                const updatedEdge = backendEdgeToReactFlowEdge(backendEdge);

                const match = updatedEdge.id.match(/edge-(\d+)/);
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (num >= edgeIdCounter) {
                        edgeIdCounter = num + 1;
                    }
                }

                if (!sourceNode.data.connections.includes(edgeData.target)) {
                    sourceNode.data.connections.push(edgeData.target);
                }
                if (!targetNode.data.connections.includes(edgeData.source)) {
                    targetNode.data.connections.push(edgeData.source);
                }

                set((state) => ({
                    edges: [...state.edges, updatedEdge],
                    nodes: state.nodes.map((node) =>
                        node.id === sourceNode.id || node.id === targetNode.id
                            ? { ...node, data: { ...node.data } }
                            : node
                    ),
                }));
            } else {
                throw new Error("Resposta inválida do backend");
            }
        } catch (error) {
            console.error("Erro ao adicionar aresta no backend:", error);
            throw error;
        }
    },

    setNetworkFromBackend: (nodes, edges) => {
        const maxNodeId = nodes.reduce((max, node) => {
            const match = node.id.match(/node-(\d+)/);
            if (match) {
                const num = parseInt(match[1], 10);
                return Math.max(max, num);
            }
            return max;
        }, 0);
        nodeIdCounter = maxNodeId + 1;

        const maxEdgeId = edges.reduce((max, edge) => {
            const match = edge.id.match(/edge-(\d+)/);
            if (match) {
                const num = parseInt(match[1], 10);
                return Math.max(max, num);
            }
            return max;
        }, 0);
        edgeIdCounter = maxEdgeId + 1;

        set({
            nodes,
            edges,
            selectedNode: null,
            selectedEdge: null,
        });
    },
}));

