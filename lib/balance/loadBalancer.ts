import { AVLTree } from "../algorithms/avl";
import { ElectricalNetworkGraph, NetworkNode, NodeStatus } from "../graph/index";
import { aStar } from "../algorithms/aStar";

/**
 * Módulo de Balanceamento de Carga usando AVL
 * 
 * Utiliza árvore AVL para indexar nós por utilização (carga/capacidade)
 * Permite consultas rápidas O(log n) para encontrar nós para redistribuição
 */
export interface LoadBalanceResult {
    success: boolean;
    balancedNodes: Array<{
        nodeId: string;
        oldLoad: number;
        newLoad: number;
    }>;
    efficiencyGain: number;
    messages: string[];
}

interface NodeUtilization {
    nodeId: string;
    utilization: number; // carga/capacidade (0-1)
    load: number;
    capacity: number;
    node: NetworkNode;
}

export class LoadBalancer {
    private avlTree: AVLTree;
    private graph: ElectricalNetworkGraph;
    private overloadThreshold: number = 0.9; // 90% de utilização

    constructor(graph: ElectricalNetworkGraph) {
        this.graph = graph;
        // Usa o índice AVL da camada lógica do grafo
        this.avlTree = graph.getLoadIndex();
    }

    /**
     * Atualiza o índice AVL a partir da camada lógica do grafo
     * O grafo mantém o índice AVL atualizado automaticamente
     */
    private updateAVLIndex(): void {
        this.avlTree = this.graph.getLoadIndex();
    }

    /**
     * Encontra nós sobrecarregados (utilização > threshold)
     * Usa a camada lógica AVL do grafo para consultas O(log n)
     */
    findOverloadedNodes(): NodeUtilization[] {
        this.updateAVLIndex();
        
        // Usa método otimizado do grafo para encontrar nós acima do threshold
        const overloadedNodes = this.graph.findNodesAboveUtilization(this.overloadThreshold);
        
        return overloadedNodes
            .map(node => ({
                nodeId: node.id,
                utilization: node.capacity > 0 ? node.demand / node.capacity : 0,
                load: node.demand,
                capacity: node.capacity,
                node: node,
            }))
            .sort((a, b) => b.utilization - a.utilization); // Mais sobrecarregado primeiro
    }

    /**
     * Encontra nós com menor utilização (candidatos para receber carga)
     * Usa a camada lógica AVL do grafo para consultas O(log n)
     */
    findUnderloadedNodes(maxCount: number = 5): NodeUtilization[] {
        this.updateAVLIndex();
        
        // Usa método otimizado do grafo para encontrar nós abaixo do threshold
        const underloadedNodes = this.graph.findNodesBelowUtilization(this.overloadThreshold);
        
        return underloadedNodes
            .map(node => ({
                nodeId: node.id,
                utilization: node.capacity > 0 ? node.demand / node.capacity : 0,
                load: node.demand,
                capacity: node.capacity,
                node: node,
            }))
            .filter(nodeUtil => nodeUtil.capacity > nodeUtil.load) // Garante espaço disponível
            .sort((a, b) => a.utilization - b.utilization) // Menor utilização primeiro
            .slice(0, maxCount);
    }


    /**
     * Redistribui carga de nós sobrecarregados para nós com menor utilização
     * Usa A* para encontrar o melhor caminho de redistribuição
     */
    balanceLoad(): LoadBalanceResult {
        const messages: string[] = [];
        const balancedNodes: LoadBalanceResult['balancedNodes'] = [];
        
        // Atualiza índice AVL com estado atual (usa camada lógica do grafo)
        this.updateAVLIndex();
        
        const overloaded = this.findOverloadedNodes();
        if (overloaded.length === 0) {
            return {
                success: true,
                balancedNodes: [],
                efficiencyGain: 0,
                messages: ["Nenhum nó sobrecarregado encontrado"],
            };
        }

        const underloaded = this.findUnderloadedNodes(overloaded.length * 2);
        if (underloaded.length === 0) {
            return {
                success: false,
                balancedNodes: [],
                efficiencyGain: 0,
                messages: ["Nenhum nó disponível para receber carga adicional"],
            };
        }

        let totalEfficiencyGain = 0;
        const efficiencyBefore = this.calculateCurrentEfficiency();

        // Redistribui carga de cada nó sobrecarregado
        for (const overloadedNode of overloaded) {
            const excessLoad = overloadedNode.load - (overloadedNode.capacity * this.overloadThreshold);
            
            if (excessLoad <= 0) continue;

            // Distribui excesso entre nós subutilizados
            let remainingExcess = excessLoad;
            
            for (const underloadedNode of underloaded) {
                if (remainingExcess <= 0) break;

                const availableCapacity = underloadedNode.capacity - underloadedNode.load;
                const loadToTransfer = Math.min(remainingExcess, availableCapacity * 0.5); // Transferir até 50% do espaço disponível

                if (loadToTransfer <= 0) continue;

                // Verifica se há caminho viável entre os nós
                try {
                    const path = aStar(this.graph, overloadedNode.nodeId, underloadedNode.nodeId);
                    
                    if (path.path.length > 0 && path.distance < Infinity) {
                        // Redistribui carga
                        const oldLoadOverloaded = overloadedNode.node.demand;
                        const oldLoadUnderloaded = underloadedNode.node.demand;

                        const newLoadOverloaded = Math.max(0, oldLoadOverloaded - loadToTransfer);
                        const newLoadUnderloaded = Math.min(underloadedNode.capacity, oldLoadUnderloaded + loadToTransfer);

                        this.graph.updateNode(overloadedNode.nodeId, { demand: newLoadOverloaded });
                        this.graph.updateNode(underloadedNode.nodeId, { demand: newLoadUnderloaded });

                        balancedNodes.push({
                            nodeId: overloadedNode.nodeId,
                            oldLoad: oldLoadOverloaded,
                            newLoad: newLoadOverloaded,
                        });

                        balancedNodes.push({
                            nodeId: underloadedNode.nodeId,
                            oldLoad: oldLoadUnderloaded,
                            newLoad: newLoadUnderloaded,
                        });

                        messages.push(
                            `Redistribuído ${loadToTransfer.toFixed(2)}A de ${overloadedNode.nodeId} para ${underloadedNode.nodeId} via ${path.path.length - 1} saltos`
                        );

                        remainingExcess -= loadToTransfer;

                        // Atualiza referências locais
                        overloadedNode.load = newLoadOverloaded;
                        underloadedNode.load = newLoadUnderloaded;
                    } else {
                        messages.push(
                            `Caminho não encontrado entre ${overloadedNode.nodeId} e ${underloadedNode.nodeId}`
                        );
                    }
                } catch (error) {
                    messages.push(
                        `Erro ao calcular caminho entre ${overloadedNode.nodeId} e ${underloadedNode.nodeId}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
                    );
                }
            }
        }

        // Recalcula eficiência após balanceamento
        this.updateAVLIndex();
        const efficiencyAfter = this.calculateCurrentEfficiency();
        totalEfficiencyGain = efficiencyAfter - efficiencyBefore;

        if (balancedNodes.length > 0) {
            messages.unshift(
                `Balanceamento concluído: ${balancedNodes.length / 2} redistribuições realizadas. Ganho de eficiência: ${(totalEfficiencyGain * 100).toFixed(2)}%`
            );
        }

        return {
            success: balancedNodes.length > 0,
            balancedNodes,
            efficiencyGain: totalEfficiencyGain,
            messages,
        };
    }

    /**
     * Calcula eficiência atual da rede
     */
    private calculateCurrentEfficiency(): number {
        return this.graph.computeEfficiency() / 100; // Normaliza para 0-1
    }

    /**
     * Verifica se um nó específico está sobrecarregado
     */
    isNodeOverloaded(nodeId: string): boolean {
        const node = this.graph.getNode(nodeId);
        if (!node || node.status !== NodeStatus.ACTIVE || node.capacity <= 0) {
            return false;
        }
        return (node.demand / node.capacity) >= this.overloadThreshold;
    }

    /**
     * Obtém estatísticas de balanceamento
     */
    getBalanceStats(): {
        overloadedCount: number;
        underloadedCount: number;
        avgUtilization: number;
    } {
        this.updateAVLIndex();
        const overloaded = this.findOverloadedNodes();
        const underloaded = this.findUnderloadedNodes(Infinity);
        
        const allNodes = this.graph.getAllNodes()
            .filter(n => n.status === NodeStatus.ACTIVE && n.capacity > 0);
        
        const totalUtilization = allNodes.reduce((sum, node) => 
            sum + (node.demand / node.capacity), 0
        );
        const avgUtilization = allNodes.length > 0 ? totalUtilization / allNodes.length : 0;

        return {
            overloadedCount: overloaded.length,
            underloadedCount: underloaded.length,
            avgUtilization,
        };
    }
}

