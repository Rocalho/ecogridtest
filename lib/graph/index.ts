import {
    NodeType,
    NodeStatus,
    type NetworkNode,
    type NetworkEdge,
    type NetworkStats
} from "../types";
import { AVLTree } from "../algorithms/avl";

export { NodeType, NodeStatus };
export type { NetworkNode, NetworkEdge, NetworkStats };

/**
 * Camada Lógica: AVL Tree para consultas rápidas e balanceamento dinâmico
 * Indexa nós por utilização (carga/capacidade) para operações O(log n)
 */
interface NodeUtilizationIndex {
    utilization: number; // carga/capacidade (0-10000 para usar como chave AVL)
    nodeId: string;
    load: number;
    capacity: number;
}

export class ElectricalNetworkGraph {
    private nodes: Map<string, NetworkNode>;
    private edges: Map<string, NetworkEdge>;
    private edgeIdCounter: number;

    // Camada Lógica: AVL Tree para indexação por utilização
    private loadIndex: AVLTree;

    constructor() {
        this.nodes = new Map();
        this.edges = new Map();
        this.edgeIdCounter = 1;
        this.loadIndex = new AVLTree();
    }

    addNode(node: Omit<NetworkNode, "id"> & { id?: string }): NetworkNode {
        const id = node.id || `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        if (this.nodes.has(id)) {
            throw new Error(`Nó com id ${id} já existe`);
        }

        const newNode: NetworkNode = {
            id,
            type: node.type,
            capacity: node.capacity,
            demand: node.demand,
            status: node.status || NodeStatus.ACTIVE,
            name: node.name,
        };

        this.nodes.set(id, newNode);
        this.updateLoadIndex(id);
        return newNode;
    }

    /**
     * Atualiza o índice AVL quando um nó é modificado
     * Usado para consultas rápidas O(log n) por utilização
     */
    private updateLoadIndex(nodeId: string): void {
        const node = this.nodes.get(nodeId);
        if (!node || node.status !== NodeStatus.ACTIVE || node.capacity <= 0) {
            return;
        }

        const utilization = (node.demand / node.capacity) * 10000; // Escala 0-10000
        const indexEntry: NodeUtilizationIndex = {
            utilization: node.demand / node.capacity,
            nodeId: node.id,
            load: node.demand,
            capacity: node.capacity,
        };

        // Remove entrada anterior se existir (busca por nodeId)
        // Como AVL usa chave numérica, precisamos reconstruir ao atualizar
        // Para otimização futura, poderia usar um Map adicional nodeId -> chave
        this.rebuildLoadIndex();
    }

    /**
     * Reconstrói o índice AVL de carga/utilização
     */
    private rebuildLoadIndex(): void {
        this.loadIndex = new AVLTree();

        for (const node of this.nodes.values()) {
            if (node.status === NodeStatus.ACTIVE && node.capacity > 0) {
                const utilization = (node.demand / node.capacity) * 10000;
                const indexEntry: NodeUtilizationIndex = {
                    utilization: node.demand / node.capacity,
                    nodeId: node.id,
                    load: node.demand,
                    capacity: node.capacity,
                };
                this.loadIndex.insert(Math.round(utilization), indexEntry);
            }
        }
    }

    /**
     * Obtém o índice AVL para uso externo (ex: balanceamento de carga)
     * Retorna uma cópia da árvore para evitar modificações diretas
     */
    getLoadIndex(): AVLTree {
        this.rebuildLoadIndex(); // Garante estado atualizado
        return this.loadIndex;
    }

    /**
     * Consulta rápida O(log n): encontra nós com utilização acima do threshold
     */
    findNodesAboveUtilization(threshold: number): NetworkNode[] {
        this.rebuildLoadIndex();
        const thresholdScaled = threshold * 10000;
        const result: NetworkNode[] = [];

        // Coleta todos os nós e filtra
        this.collectNodesAboveThreshold(this.loadIndex.root, thresholdScaled, result);

        return result;
    }

    /**
     * Consulta rápida O(log n): encontra nós com utilização abaixo do threshold
     */
    findNodesBelowUtilization(threshold: number): NetworkNode[] {
        this.rebuildLoadIndex();
        const thresholdScaled = threshold * 10000;
        const result: NetworkNode[] = [];

        // Coleta todos os nós e filtra
        this.collectNodesBelowThreshold(this.loadIndex.root, thresholdScaled, result);

        return result;
    }

    private collectNodesAboveThreshold(node: any, threshold: number, result: NetworkNode[]): void {
        if (!node) return;

        // Busca otimizada: se a chave atual é menor que threshold, não precisa ir para direita
        if (node.key < threshold) {
            if (node.right) {
                this.collectNodesAboveThreshold(node.right, threshold, result);
            }
        } else {
            // Nó atual e todos os da direita satisfazem
            if (node.left) {
                this.collectNodesAboveThreshold(node.left, threshold, result);
            }

            if (node.value && typeof node.value === 'object' && 'nodeId' in node.value) {
                const indexEntry = node.value as NodeUtilizationIndex;
                const networkNode = this.nodes.get(indexEntry.nodeId);
                if (networkNode) {
                    result.push(networkNode);
                }
            }

            if (node.right) {
                this.collectNodesAboveThreshold(node.right, threshold, result);
            }
        }
    }

    private collectNodesBelowThreshold(node: any, threshold: number, result: NetworkNode[]): void {
        if (!node) return;

        // Busca otimizada: se a chave atual é maior que threshold, não precisa ir para esquerda
        if (node.key > threshold) {
            if (node.left) {
                this.collectNodesBelowThreshold(node.left, threshold, result);
            }
        } else {
            // Nó atual e todos os da esquerda satisfazem
            if (node.left) {
                this.collectNodesBelowThreshold(node.left, threshold, result);
            }

            if (node.value && typeof node.value === 'object' && 'nodeId' in node.value) {
                const indexEntry = node.value as NodeUtilizationIndex;
                const networkNode = this.nodes.get(indexEntry.nodeId);
                if (networkNode) {
                    result.push(networkNode);
                }
            }

            if (node.right) {
                this.collectNodesBelowThreshold(node.right, threshold, result);
            }
        }
    }

    addEdge(edge: Omit<NetworkEdge, "id"> & { id?: string }): NetworkEdge {
        const id = edge.id || `edge-${this.edgeIdCounter++}`;

        if (this.edges.has(id)) {
            throw new Error(`Aresta com id ${id} já existe`);
        }

        if (!this.nodes.has(edge.origin)) {
            throw new Error(`Nó de origem ${edge.origin} não existe`);
        }

        if (!this.nodes.has(edge.destination)) {
            throw new Error(`Nó de destino ${edge.destination} não existe`);
        }

        const existingEdge = Array.from(this.edges.values()).find(
            (e) =>
                (e.origin === edge.origin && e.destination === edge.destination) ||
                (e.origin === edge.destination && e.destination === edge.origin)
        );

        if (existingEdge) {
            throw new Error(`Já existe uma aresta entre ${edge.origin} e ${edge.destination}`);
        }

        const newEdge: NetworkEdge = {
            id,
            origin: edge.origin,
            destination: edge.destination,
            resistance: edge.resistance,
            capacity: edge.capacity,
            currentFlow: edge.currentFlow || 0,
        };

        this.edges.set(id, newEdge);
        return newEdge;
    }

    removeNode(id: string): boolean {
        if (!this.nodes.has(id)) {
            return false;
        }

        const edgesToRemove = Array.from(this.edges.values()).filter(
            (edge) => edge.origin === id || edge.destination === id
        );

        edgesToRemove.forEach((edge) => {
            this.edges.delete(edge.id);
        });

        this.nodes.delete(id);
        this.rebuildLoadIndex(); // Remove do índice
        return true;
    }


    removeEdge(id: string): boolean {
        if (!this.edges.has(id)) {
            return false;
        }

        this.edges.delete(id);
        return true;
    }

    computeLosses(): number {
        let totalLosses = 0;

        for (const edge of this.edges.values()) {
            const losses = Math.pow(edge.currentFlow, 2) * edge.resistance;
            totalLosses += losses;
        }

        return totalLosses;
    }

    computeEfficiency(): number {
        const totalProduction = this.computeTotalProduction();
        const totalLosses = this.computeLosses();

        if (totalProduction === 0) {
            return 0;
        }

        const usefulEnergy = totalProduction - totalLosses;
        const efficiency = (usefulEnergy / totalProduction) * 100;

        return Math.max(0, Math.min(100, efficiency));
    }

    computeConsumption(): number {
        let totalConsumption = 0;

        for (const node of this.nodes.values()) {
            if (node.status === NodeStatus.ACTIVE) {
                if (node.type === NodeType.CONSUMER) {
                    totalConsumption += node.demand;
                }
            }
        }

        return totalConsumption;
    }

    private computeTotalProduction(): number {
        let totalProduction = 0;

        for (const node of this.nodes.values()) {
            if (node.status === NodeStatus.ACTIVE) {
                if (node.type === NodeType.PRODUCER) {
                    totalProduction += node.capacity;
                }
            }
        }

        return totalProduction;
    }

    getStats(): NetworkStats {
        const nodesByType: Record<NodeType, number> = {
            [NodeType.PRODUCER]: 0,
            [NodeType.CONSUMER]: 0,
            [NodeType.SUBSTATION]: 0,
            [NodeType.TRANSMISSION]: 0,
        };

        let activeNodes = 0;
        let inactiveNodes = 0;

        for (const node of this.nodes.values()) {
            nodesByType[node.type]++;
            if (node.status === NodeStatus.ACTIVE) {
                activeNodes++;
            } else {
                inactiveNodes++;
            }
        }

        return {
            totalNodes: this.nodes.size,
            totalEdges: this.edges.size,
            totalLosses: this.computeLosses(),
            totalEfficiency: this.computeEfficiency(),
            totalConsumption: this.computeConsumption(),
            nodesByType,
            activeNodes,
            inactiveNodes,
        };
    }

    getNode(id: string): NetworkNode | undefined {
        return this.nodes.get(id);
    }

    getEdge(id: string): NetworkEdge | undefined {
        return this.edges.get(id);
    }

    getAllNodes(): NetworkNode[] {
        return Array.from(this.nodes.values());
    }

    getAllEdges(): NetworkEdge[] {
        return Array.from(this.edges.values());
    }

    getEdgesByNode(nodeId: string): NetworkEdge[] {
        return Array.from(this.edges.values()).filter(
            (edge) => edge.origin === nodeId || edge.destination === nodeId
        );
    }

    updateNode(id: string, updates: Partial<Omit<NetworkNode, "id">>): boolean {
        const node = this.nodes.get(id);
        if (!node) {
            return false;
        }

        this.nodes.set(id, { ...node, ...updates });

        // Se demanda ou capacidade foram atualizadas, atualiza índice
        if (updates.demand !== undefined || updates.capacity !== undefined || updates.status !== undefined) {
            this.updateLoadIndex(id);
        }

        return true;
    }

    updateEdge(id: string, updates: Partial<Omit<NetworkEdge, "id">>): boolean {
        const edge = this.edges.get(id);
        if (!edge) {
            return false;
        }

        if (updates.origin && !this.nodes.has(updates.origin)) {
            throw new Error(`Nó de origem ${updates.origin} não existe`);
        }

        if (updates.destination && !this.nodes.has(updates.destination)) {
            throw new Error(`Nó de destino ${updates.destination} não existe`);
        }

        this.edges.set(id, { ...edge, ...updates });
        return true;
    }

    clear(): void {
        this.nodes.clear();
        this.edges.clear();
        this.edgeIdCounter = 1;
        this.loadIndex = new AVLTree();
    }

    restore(nodes: NetworkNode[], edges: NetworkEdge[], edgeIdCounter: number = 1): void {
        this.clear();

        nodes.forEach(node => {
            this.nodes.set(node.id, node);
        });

        edges.forEach(edge => {
            this.edges.set(edge.id, edge);
        });

        this.edgeIdCounter = edgeIdCounter;
    }

    getEdgeIdCounter(): number {
        return this.edgeIdCounter;
    }
}

let networkInstance: ElectricalNetworkGraph | null = null;


export async function getNetworkInstance(): Promise<ElectricalNetworkGraph> {
    if (!networkInstance) {
        networkInstance = new ElectricalNetworkGraph();
    }
    return networkInstance;
}

export function getNetworkInstanceSync(): ElectricalNetworkGraph {
    if (!networkInstance) {
        networkInstance = new ElectricalNetworkGraph();
    }
    return networkInstance;
}


export function resetNetworkInstance(): void {
    networkInstance = null;
}

