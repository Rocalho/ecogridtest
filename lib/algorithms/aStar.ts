import { ElectricalNetworkGraph } from "../graph/index";

export interface ShortestPathResult {
    path: string[];
    distance: number;
    operations: number;
}

export function aStar(
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

    const heuristic = (nodeId1: string, nodeId2: string): number => {
        operations++;

        return Math.abs(parseInt(nodeId1) - parseInt(nodeId2)) || 1;
    };

    const openSet = new Set<string>([startNodeId]);
    const closedSet = new Set<string>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();
    const cameFrom = new Map<string, string | null>();

    nodes.forEach((node) => {
        gScore.set(node.id, Infinity);
        fScore.set(node.id, Infinity);
        operations += 2;
    });

    gScore.set(startNodeId, 0);
    fScore.set(startNodeId, heuristic(startNodeId, endNodeId));
    operations += 2;

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

    while (openSet.size > 0) {
        operations++;

        let current: string | null = null;
        let minFScore = Infinity;

        openSet.forEach((nodeId) => {
            const f = fScore.get(nodeId) || Infinity;
            if (f < minFScore) {
                minFScore = f;
                current = nodeId;
            }
            operations++;
        });

        if (!current) {
            break;
        }

        const currentNode: string = current;

        if (currentNode === endNodeId) {
            const path: string[] = [];
            let node: string | null = current;

            while (node !== null) {
                path.unshift(node);
                node = cameFrom.get(node) || null;
                operations++;
            }

            const distance = gScore.get(endNodeId) || Infinity;
            return { path, distance, operations };
        }

        openSet.delete(currentNode);
        closedSet.add(currentNode);
        operations += 2;

        const neighbors = adjacencyList.get(currentNode) || [];
        neighbors.forEach((neighbor) => {
            operations++;
            if (!neighbor.nodeId || closedSet.has(neighbor.nodeId)) {
                return;
            }

            const tentativeGScore = (gScore.get(currentNode) || Infinity) + neighbor.weight;

            if (!openSet.has(neighbor.nodeId)) {
                openSet.add(neighbor.nodeId);
                operations++;
            } else if (tentativeGScore >= (gScore.get(neighbor.nodeId) || Infinity)) {
                return;
            }

            cameFrom.set(neighbor.nodeId, currentNode);
            gScore.set(neighbor.nodeId, tentativeGScore);
            fScore.set(neighbor.nodeId, tentativeGScore + heuristic(neighbor.nodeId, endNodeId));
            operations += 3;
        });
    }

    return { path: [], distance: Infinity, operations };
}

