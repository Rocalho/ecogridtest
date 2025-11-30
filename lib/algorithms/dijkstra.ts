import { ElectricalNetworkGraph } from "../graph/index";

export interface ShortestPathResult {
    path: string[];
    distance: number;
    operations: number;
}

export function dijkstra(
    graph: ElectricalNetworkGraph,
    startNodeId: string,
    endNodeId: string
): ShortestPathResult {
    const nodes = graph.getAllNodes();
    const edges = graph.getAllEdges();
    let operations = 0;

    const startNode = graph.getNode(startNodeId);
    const endNode = graph.getNode(endNodeId);

    if (!startNode || !endNode) {
        return { path: [], distance: Infinity, operations: 1 };
    }

    const distances = new Map<string, number>();
    const previous = new Map<string, string | null>();
    const unvisited = new Set<string>();

    nodes.forEach((node) => {
        distances.set(node.id, Infinity);
        previous.set(node.id, null);
        unvisited.add(node.id);
        operations++;
    });

    distances.set(startNodeId, 0);
    operations++;

    const adjacencyList = new Map<string, Array<{ nodeId: string; weight: number }>>();
    nodes.forEach((node) => {
        adjacencyList.set(node.id, []);
        operations++;
    });

    edges.forEach((edge) => {
        const weight = edge.resistance || 1;
        const origin = edge.origin;
        const destination = edge.destination;

        adjacencyList.get(origin)?.push({ nodeId: destination, weight });
        adjacencyList.get(destination)?.push({ nodeId: origin, weight });
        operations += 2;
    });

    while (unvisited.size > 0) {
        operations++;

        let currentNodeId: string | null = null;
        let minDistance = Infinity;

        unvisited.forEach((nodeId) => {
            const dist = distances.get(nodeId) || Infinity;
            if (dist < minDistance) {
                minDistance = dist;
                currentNodeId = nodeId;
            }
            operations++;
        });

        if (!currentNodeId || minDistance === Infinity) {
            break;
        }

        unvisited.delete(currentNodeId);
        operations++;

        if (currentNodeId === endNodeId) {
            break;
        }

        const neighbors = adjacencyList.get(currentNodeId) || [];
        neighbors.forEach((neighbor) => {
            operations++;
            if (unvisited.has(neighbor.nodeId)) {
                const alt = minDistance + neighbor.weight;
                const currentDist = distances.get(neighbor.nodeId) || Infinity;
                if (alt < currentDist) {
                    distances.set(neighbor.nodeId, alt);
                    previous.set(neighbor.nodeId, currentNodeId);
                    operations += 2;
                }
            }
        });
    }

    const path: string[] = [];
    let current: string | null = endNodeId;

    while (current !== null) {
        path.unshift(current);
        current = previous.get(current) || null;
        operations++;
    }

    const distance = distances.get(endNodeId) || Infinity;

    return {
        path: path[0] === startNodeId ? path : [],
        distance,
        operations,
    };
}

