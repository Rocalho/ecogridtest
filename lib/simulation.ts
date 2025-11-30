import { ElectricalNetworkGraph, NodeStatus } from "./graph/index";
import { FIFOQueue, MinHeap, Event } from "./events";
import { SimulationLog, SimulationResult } from "./types";
import { LoadBalancer } from "./balance/loadBalancer";

export type { SimulationLog, SimulationResult };

function applyEventToGraph(graph: ElectricalNetworkGraph, event: Event): SimulationLog[] {
    const logs: SimulationLog[] = [];
    const { type, payload } = event;

    try {
        switch (type) {
            case "demand_change":
                if (payload.nodeId && typeof payload.demand === "number") {
                    const node = graph.getNode(payload.nodeId as string);
                    if (node) {
                        const oldDemand = node.demand;
                        graph.updateNode(payload.nodeId as string, { demand: payload.demand });
                        logs.push({
                            timestamp: new Date(),
                            level: "info",
                            message: `Demanda do nó ${payload.nodeId} alterada de ${oldDemand} para ${payload.demand}`,
                        });
                    } else {
                        logs.push({
                            timestamp: new Date(),
                            level: "warning",
                            message: `Nó ${payload.nodeId} não encontrado para alteração de demanda`,
                        });
                    }
                }
                break;

            case "node_failure":
                if (payload.nodeId) {
                    const node = graph.getNode(payload.nodeId as string);
                    if (node) {
                        graph.updateNode(payload.nodeId as string, { status: NodeStatus.INACTIVE });
                        logs.push({
                            timestamp: new Date(),
                            level: "error",
                            message: `Nó ${payload.nodeId} falhou e foi desativado`,
                        });
                    } else {
                        logs.push({
                            timestamp: new Date(),
                            level: "warning",
                            message: `Nó ${payload.nodeId} não encontrado para falha`,
                        });
                    }
                }
                break;

            case "node_recovery":
                if (payload.nodeId) {
                    const node = graph.getNode(payload.nodeId as string);
                    if (node) {
                        graph.updateNode(payload.nodeId as string, { status: NodeStatus.ACTIVE });
                        logs.push({
                            timestamp: new Date(),
                            level: "success",
                            message: `Nó ${payload.nodeId} recuperado e reativado`,
                        });
                    } else {
                        logs.push({
                            timestamp: new Date(),
                            level: "warning",
                            message: `Nó ${payload.nodeId} não encontrado para recuperação`,
                        });
                    }
                }
                break;

            case "overload":
                if (payload.nodeId) {
                    const node = graph.getNode(payload.nodeId as string);
                    if (node) {
                        const newDemand = node.demand * (typeof payload.multiplier === 'number' ? payload.multiplier : 1.5);
                        graph.updateNode(payload.nodeId as string, { demand: newDemand });
                        logs.push({
                            timestamp: new Date(),
                            level: "warning",
                            message: `Nó ${payload.nodeId} sobrecarregado: demanda aumentada para ${newDemand.toFixed(2)}`,
                        });
                    }
                } else if (payload.edgeId) {
                    const edge = graph.getEdge(payload.edgeId as string);
                    if (edge) {
                        const newFlow = edge.currentFlow * (typeof payload.multiplier === 'number' ? payload.multiplier : 1.5);
                        graph.updateEdge(payload.edgeId as string, { currentFlow: newFlow });
                        logs.push({
                            timestamp: new Date(),
                            level: "warning",
                            message: `Aresta ${payload.edgeId} sobrecarregada: fluxo aumentado para ${newFlow.toFixed(2)}`,
                        });
                    }
                }
                break;

            case "capacity_change":
                if (payload.nodeId && typeof payload.capacity === "number") {
                    const node = graph.getNode(payload.nodeId as string);
                    if (node) {
                        const oldCapacity = node.capacity;
                        graph.updateNode(payload.nodeId as string, { capacity: payload.capacity });
                        logs.push({
                            timestamp: new Date(),
                            level: "info",
                            message: `Capacidade do nó ${payload.nodeId} alterada de ${oldCapacity} para ${payload.capacity}`,
                        });
                    }
                } else if (payload.edgeId && typeof payload.capacity === "number") {
                    const edge = graph.getEdge(payload.edgeId as string);
                    if (edge) {
                        const oldCapacity = edge.capacity;
                        graph.updateEdge(payload.edgeId as string, { capacity: payload.capacity });
                        logs.push({
                            timestamp: new Date(),
                            level: "info",
                            message: `Capacidade da aresta ${payload.edgeId} alterada de ${oldCapacity} para ${payload.capacity}`,
                        });
                    }
                }
                break;

            default:
                logs.push({
                    timestamp: new Date(),
                    level: "warning",
                    message: `Tipo de evento desconhecido: ${type}`,
                });
        }
    } catch (error) {
        logs.push({
            timestamp: new Date(),
            level: "error",
            message: `Erro ao aplicar evento ${type}: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        });
    }

    return logs;
}

function checkCriticalConditions(
    graph: ElectricalNetworkGraph,
    heap: MinHeap
): SimulationLog[] {
    const logs: SimulationLog[] = [];
    const criticalThreshold = 0.9;

    for (const node of graph.getAllNodes()) {
        if (node.status === "active" && node.capacity > 0) {
            const utilization = node.demand / node.capacity;
            if (utilization >= criticalThreshold) {
                const criticalEvent: Event = {
                    type: "critical_overload",
                    payload: {
                        nodeId: node.id,
                        utilization: utilization,
                        demand: node.demand,
                        capacity: node.capacity,
                    },
                    severity: utilization >= 0.95 ? 0 : 1,
                    createdAt: new Date(),
                };
                heap.insert(criticalEvent);
                logs.push({
                    timestamp: new Date(),
                    level: utilization >= 0.95 ? "error" : "warning",
                    message: `Condição crítica detectada: nó ${node.id} com ${(utilization * 100).toFixed(1)}% de utilização`,
                });
            }
        }
    }

    for (const edge of graph.getAllEdges()) {
        if (edge.capacity > 0) {
            const utilization = Math.abs(edge.currentFlow) / edge.capacity;
            if (utilization >= criticalThreshold) {
                const criticalEvent: Event = {
                    type: "critical_edge_overload",
                    payload: {
                        edgeId: edge.id,
                        utilization: utilization,
                        currentFlow: edge.currentFlow,
                        capacity: edge.capacity,
                    },
                    severity: utilization >= 0.95 ? 0 : 1,
                    createdAt: new Date(),
                };
                heap.insert(criticalEvent);
                logs.push({
                    timestamp: new Date(),
                    level: utilization >= 0.95 ? "error" : "warning",
                    message: `Condição crítica detectada: aresta ${edge.id} com ${(utilization * 100).toFixed(1)}% de utilização`,
                });
            }
        }
    }

    const inactiveNodes = graph.getAllNodes().filter((n) => n.status === NodeStatus.INACTIVE);
    if (inactiveNodes.length > 0) {
        const criticalEvent: Event = {
            type: "critical_node_failure",
            payload: {
                inactiveCount: inactiveNodes.length,
                inactiveNodes: inactiveNodes.map((n) => n.id),
            },
            severity: inactiveNodes.length > 3 ? 0 : 2,
            createdAt: new Date(),
        };
        heap.insert(criticalEvent);
        logs.push({
            timestamp: new Date(),
            level: inactiveNodes.length > 3 ? "error" : "warning",
            message: `${inactiveNodes.length} nó(s) inativo(s) na rede`,
        });
    }

    return logs;
}

export function runSimulationCycle(
    graph: ElectricalNetworkGraph,
    fifo: FIFOQueue,
    heap: MinHeap
): SimulationResult {
    const logs: SimulationLog[] = [];

    const event = fifo.dequeue();
    if (!event) {
        logs.push({
            timestamp: new Date(),
            level: "info",
            message: "Nenhum evento na fila FIFO para processar",
        });
    } else {
        logs.push({
            timestamp: new Date(),
            level: "info",
            message: `Processando evento: ${event.type}`,
        });

        const eventLogs = applyEventToGraph(graph, event);
        logs.push(...eventLogs);
    }

    const criticalLogs = checkCriticalConditions(graph, heap);
    logs.push(...criticalLogs);

    // Balanceamento automático usando AVL quando detecta sobrecarga
    const shouldBalance = criticalLogs.some(log =>
        log.level === "error" || log.level === "warning"
    );

    if (shouldBalance) {
        try {
            const balancer = new LoadBalancer(graph);
            const balanceResult = balancer.balanceLoad();

            if (balanceResult.success && balanceResult.balancedNodes.length > 0) {
                logs.push({
                    timestamp: new Date(),
                    level: "success",
                    message: `Balanceamento automático AVL: ${balanceResult.balancedNodes.length / 2} redistribuições realizadas`,
                });

                // Adiciona mensagens detalhadas do balanceamento
                balanceResult.messages.slice(0, 3).forEach(msg => {
                    logs.push({
                        timestamp: new Date(),
                        level: "info",
                        message: `  → ${msg}`,
                    });
                });

                if (balanceResult.efficiencyGain > 0) {
                    logs.push({
                        timestamp: new Date(),
                        level: "success",
                        message: `Ganho de eficiência: +${(balanceResult.efficiencyGain * 100).toFixed(2)}%`,
                    });
                }
            }
        } catch (error) {
            logs.push({
                timestamp: new Date(),
                level: "warning",
                message: `Erro no balanceamento automático: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
            });
        }
    }

    const losses = graph.computeLosses();
    const efficiency = graph.computeEfficiency();
    const consumption = graph.computeConsumption();

    logs.push({
        timestamp: new Date(),
        level: "info",
        message: `Métricas recalculadas: Perdas=${losses.toFixed(2)}, Eficiência=${efficiency.toFixed(2)}%, Consumo=${consumption.toFixed(2)}`,
    });

    return {
        graph: {
            nodes: graph.getAllNodes().map((node) => ({
                id: node.id,
                type: node.type,
                capacity: node.capacity,
                demand: node.demand,
                status: node.status,
            })),
            edges: graph.getAllEdges().map((edge) => ({
                id: edge.id,
                origin: edge.origin,
                destination: edge.destination,
                resistance: edge.resistance,
                capacity: edge.capacity,
                currentFlow: edge.currentFlow,
            })),
        },
        metrics: {
            losses,
            efficiency,
            consumption,
        },
        logs,
        pendingEvents: {
            fifo: fifo.size(),
            heap: heap.size(),
        },
    };
}

