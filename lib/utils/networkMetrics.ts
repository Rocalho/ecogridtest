import { ReactFlowNode, ReactFlowEdge } from "@/lib/utils/graph";

/**
 * Calcula a heurística de eficiência global conforme especificado:
 * E = Σ(Cn * ηn) / Σ(Pn)
 * onde:
 * - Cn = carga do nó n
 * - ηn = eficiência do nó n (0-1)
 * - Pn = perda associada ao nó n
 */
export function calculateGlobalEfficiency(
    nodes: ReactFlowNode[],
    edges: ReactFlowEdge[] = []
): number {
    if (nodes.length === 0) return 0;

    let sumLoadEfficiency = 0; // Σ(Cn * ηn)
    let sumLosses = 0; // Σ(Pn)

    nodes.forEach((node) => {
        const Cn = node.data.load || 0; // Carga do nó
        const etaN = node.data.efficiency || 0; // Eficiência (0-1)

        // Calcula perda do nó: Pn = Cn * (1 - ηn) se eficiência disponível
        // Caso contrário, calcula perda baseada nas arestas conectadas
        let Pn = 0;

        if (etaN > 0) {
            // Perda baseada em eficiência do nó
            Pn = Cn * (1 - etaN);
        } else {
            // Calcula perdas nas arestas conectadas a este nó
            const nodeEdges = edges.filter(
                (edge) => edge.source === node.id || edge.target === node.id
            );
            Pn = nodeEdges.reduce((sum, edge) => {
                // Perda na aresta: P = I² * R (onde I é o fluxo e R é a resistência)
                const flow = Math.abs(edge.data?.currentLoad || 0);
                const resistance = edge.data?.resistance || 0;
                return sum + (flow * flow * resistance);
            }, 0);

            // Se não há arestas ou carga, assume perda mínima baseada na carga
            if (Pn === 0 && Cn > 0) {
                Pn = Cn * 0.05; // Assumindo 5% de perda padrão
            }
        }

        sumLoadEfficiency += Cn * etaN;
        sumLosses += Pn;
    });

    // Se não há perdas, retorna eficiência média ponderada
    if (sumLosses === 0) {
        const totalLoad = nodes.reduce((sum, node) => sum + (node.data.load || 0), 0);
        if (totalLoad === 0) {
            const avgEfficiency = nodes.reduce(
                (sum, node) => sum + (node.data.efficiency || 0),
                0
            ) / nodes.length;
            return avgEfficiency;
        }
        return sumLoadEfficiency / totalLoad;
    }

    // E = Σ(Cn * ηn) / Σ(Pn)
    return sumLoadEfficiency / sumLosses;
}

export function calculateTotalLosses(
    nodes: ReactFlowNode[],
    edges: ReactFlowEdge[]
): number {
    const edgeLosses = edges.reduce((sum, edge) => {
        return sum + (edge.data?.loss || 0);
    }, 0);

    const nodeLosses = nodes.reduce((sum, node) => {
        const load = node.data.load || 0;
        const efficiency = node.data.efficiency || 1;
        const loss = load * (1 - efficiency);
        return sum + loss;
    }, 0);

    return edgeLosses + nodeLosses;
}

export function calculateTotalConsumption(
    nodes: ReactFlowNode[]
): number {
    return nodes.reduce((sum, node) => {
        return sum + (node.data.load || 0);
    }, 0);
}

export interface NetworkStats {
    totalNodes: number;
    totalEdges: number;
    producers: number;
    substations: number;
    transformers: number;
    consumers: number;
    overloadedNodes: number;
    warningNodes: number;
}

export function calculateNetworkStats(
    nodes: ReactFlowNode[],
    edges: ReactFlowEdge[]
): NetworkStats {
    const stats: NetworkStats = {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        producers: 0,
        substations: 0,
        transformers: 0,
        consumers: 0,
        overloadedNodes: 0,
        warningNodes: 0,
    };

    nodes.forEach((node) => {
        switch (node.data.type) {
            case "producer":
                stats.producers++;
                break;
            case "substation":
                stats.substations++;
                break;
            case "transformer":
                stats.transformers++;
                break;
            case "consumer":
                stats.consumers++;
                break;
        }

        const load = node.data.load || 0;
        const capacity = node.data.capacity || 100;
        const percentage = (load / capacity) * 100;

        if (percentage >= 90) {
            stats.overloadedNodes++;
        } else if (percentage >= 75) {
            stats.warningNodes++;
        }
    });

    return stats;
}

export function calculateVariance(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
}

