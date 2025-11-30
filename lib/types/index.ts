export enum NodeType {
    PRODUCER = "producer",
    CONSUMER = "consumer",
    SUBSTATION = "substation",
    TRANSMISSION = "transmission"
}

export enum NodeStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    MAINTENANCE = "maintenance"
}

export interface NetworkNode {
    id: string;
    type: NodeType;
    capacity: number;
    demand: number;
    status: NodeStatus;
    name?: string;
}

export interface NetworkEdge {
    id: string;
    origin: string;
    destination: string;
    resistance: number;
    capacity: number;
    currentFlow: number;
}

export interface NetworkStats {
    totalNodes: number;
    totalEdges: number;
    totalLosses: number;
    totalEfficiency: number;
    totalConsumption: number;
    nodesByType: Record<NodeType, number>;
    activeNodes: number;
    inactiveNodes: number;
}

export interface HistoricalDataPoint {
    timestamp: number;
    consumo: number;
}

export interface PredictionResult {
    predictedValue: number;
    errorMargin: number;
    overloadRisk: number;
}

export interface PredictionInput {
    historical: HistoricalDataPoint[];
}

export interface Event {
    type: string;
    payload: Record<string, unknown>;
    severity: number;
    createdAt: Date;
}

export interface SimulationLog {
    timestamp: Date;
    level: "info" | "warning" | "error" | "success";
    message: string;
}

export interface SimulationResult {
    graph: {
        nodes: Array<{
            id: string;
            type: string;
            capacity: number;
            demand: number;
            status: string;
        }>;
        edges: Array<{
            id: string;
            origin: string;
            destination: string;
            resistance: number;
            capacity: number;
            currentFlow: number;
        }>;
    };
    metrics: {
        losses: number;
        efficiency: number;
        consumption: number;
    };
    logs: SimulationLog[];
    pendingEvents: {
        fifo: number;
        heap: number;
    };
}

export interface NetworkData {
    nodes: NetworkNode[];
    edges: NetworkEdge[];
    edgeIdCounter: number;
}

export interface BPlusTreeSerialized {
    order: number;
    root: BPlusNodeSerialized | null;
}

export interface BPlusNodeSerialized {
    isLeaf: boolean;
    keys: number[];
    values?: any[];
    children?: BPlusNodeSerialized[];
}

export type LogLevel = "info" | "warning" | "error" | "success";

export interface LogEntry {
    id: string;
    timestamp: Date;
    level: LogLevel;
    message: string;
    source?: string;
}

