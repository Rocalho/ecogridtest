
export enum NodeType {
    SUBSTATION = "substation",
    TRANSFORMER = "transformer",
    CONSUMER = "consumer"
}

export interface NodeData {
    label: string;
    type: NodeType;
    load: number;
    capacity: number;
    efficiency: number;
    connections: string[];
    x?: number;
    y?: number;
}

export interface ReactFlowNode {
    id: string;
    type?: string;
    position: { x: number; y: number };
    data: NodeData;
    style?: React.CSSProperties;
}

export interface EdgeData {
    distance: number;
    resistance: number;
    capacity: number;
    currentLoad?: number;
    loss?: number;
}

export interface ReactFlowEdge {
    id: string;
    source: string;
    target: string;
    type?: string;
    data?: EdgeData;
    style?: React.CSSProperties;
    label?: string;
    animated?: boolean;
}

export interface GraphState {
    nodes: ReactFlowNode[];
    edges: ReactFlowEdge[];
    selectedNode: ReactFlowNode | null;
    selectedEdge: ReactFlowEdge | null;
}

export function getNodeColor(load: number, capacity: number): string {
    const percentage = (load / capacity) * 100;

    if (percentage >= 90) return "#ef4444";
    if (percentage >= 75) return "#f59e0b";
    if (percentage >= 50) return "#eab308";
    return "#22c55e";
}

export function getEdgeColor(load: number, capacity: number): string {
    const percentage = (load / capacity) * 100;

    if (percentage >= 90) return "#ef4444";
    if (percentage >= 75) return "#f59e0b";
    if (percentage >= 50) return "#eab308";
    return "#64748b";
}

export function getNodeTypeLabel(type: NodeType): string {
    switch (type) {
        case NodeType.SUBSTATION:
            return "Subestação";
        case NodeType.TRANSFORMER:
            return "Transformador";
        case NodeType.CONSUMER:
            return "Consumidor";
        default:
            return "Desconhecido";
    }
}

import { NetworkNode, NetworkEdge, NodeType as BackendNodeType } from "@/lib/graph/index";


export function backendNodeToReactFlowNode(backendNode: NetworkNode, position?: { x: number; y: number }): ReactFlowNode {
    let frontendType: NodeType;
    switch (backendNode.type) {
        case BackendNodeType.PRODUCER:
        case BackendNodeType.SUBSTATION:
            frontendType = NodeType.SUBSTATION;
            break;
        case BackendNodeType.TRANSMISSION:
            frontendType = NodeType.TRANSFORMER;
            break;
        case BackendNodeType.CONSUMER:
            frontendType = NodeType.CONSUMER;
            break;
        default:
            frontendType = NodeType.CONSUMER;
    }

    const load = backendNode.demand || 0;
    const capacity = backendNode.capacity || 100;

    return {
        id: backendNode.id,
        position: position || { x: Math.random() * 400, y: Math.random() * 400 },
        data: {
            label: backendNode.name || `${frontendType}-${backendNode.id}`,
            type: frontendType,
            load: load,
            capacity: capacity,
            efficiency: 0.95,
            connections: [],
        },
        style: {
            background: getNodeColor(load, capacity),
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
}

export function backendEdgeToReactFlowEdge(backendEdge: NetworkEdge): ReactFlowEdge {
    return {
        id: backendEdge.id,
        source: backendEdge.origin,
        target: backendEdge.destination,
        data: {
            distance: 0,
            resistance: backendEdge.resistance,
            capacity: backendEdge.capacity,
            currentLoad: backendEdge.currentFlow,
            loss: 0,
        },
        style: {
            stroke: "#64748b",
            strokeWidth: 2,
        },
    };
}

export function reactFlowNodeToBackendPost(node: ReactFlowNode): {
    id?: string;
    type: string;
    capacity: number;
    demand: number;
    status?: string;
    name?: string;
} {
    let backendType: string;
    switch (node.data.type) {
        case NodeType.SUBSTATION:
            backendType = BackendNodeType.SUBSTATION;
            break;
        case NodeType.TRANSFORMER:
            backendType = BackendNodeType.TRANSMISSION;
            break;
        case NodeType.CONSUMER:
            backendType = BackendNodeType.CONSUMER;
            break;
        default:
            backendType = BackendNodeType.CONSUMER;
    }

    return {
        id: node.id,
        type: backendType,
        capacity: node.data.capacity,
        demand: node.data.load,
        status: "active",
        name: node.data.label,
    };
}

export function reactFlowEdgeToBackendPost(edge: ReactFlowEdge): {
    id?: string;
    origin: string;
    destination: string;
    resistance: number;
    capacity: number;
    currentFlow?: number;
} {
    return {
        id: edge.id,
        origin: edge.source,
        destination: edge.target,
        resistance: edge.data?.resistance || 0,
        capacity: edge.data?.capacity || 0,
        currentFlow: edge.data?.currentLoad || 0,
    };
}