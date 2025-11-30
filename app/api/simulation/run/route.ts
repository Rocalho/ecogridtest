import { NextRequest, NextResponse } from "next/server";
import { getNetworkInstance } from "@/lib/graph";
import { getFIFOQueue, getMinHeap, addEvent } from "@/lib/events/queueManager";
import { runSimulationCycle } from "@/lib/simulation";
import { Event } from "@/lib/events";
import { NodeType, NodeStatus } from "@/lib/graph";
import { getHistoryTreeInstance, persistHistoryTree } from "@/lib/history";

export async function POST(request: NextRequest) {
    try {
        const graph = await getNetworkInstance();
        const fifo = getFIFOQueue();
        const heap = getMinHeap();

        // Tenta sincronizar o grafo com os dados do frontend se fornecidos
        try {
            const body = await request.json().catch(() => ({}));
            if (body.nodes && body.edges && Array.isArray(body.nodes) && Array.isArray(body.edges)) {
                // Sincroniza o grafo com os dados do frontend
                graph.clear();

                // Adiciona nós
                for (const node of body.nodes) {
                    try {
                        graph.addNode({
                            id: node.id,
                            type: node.type || NodeType.CONSUMER,
                            capacity: node.capacity || 100,
                            demand: node.demand || node.load || 0,
                            status: node.status || NodeStatus.ACTIVE,
                            name: node.name || node.data?.label || `Node ${node.id}`,
                        });
                    } catch (err) {
                        console.warn(`Erro ao adicionar nó ${node.id}:`, err);
                    }
                }

                // Adiciona arestas
                for (const edge of body.edges) {
                    try {
                        graph.addEdge({
                            id: edge.id,
                            origin: edge.origin || edge.source,
                            destination: edge.destination || edge.target,
                            resistance: edge.resistance || edge.data?.resistance || 0.1,
                            capacity: edge.capacity || edge.data?.capacity || 100,
                            currentFlow: edge.currentFlow || edge.data?.currentLoad || 0,
                        });
                    } catch (err) {
                        console.warn(`Erro ao adicionar aresta ${edge.id}:`, err);
                    }
                }
            }
        } catch (syncError) {
            console.warn("Erro ao sincronizar grafo, continuando com grafo existente:", syncError);
        }

        // Se a fila FIFO estiver vazia, gera eventos aleatórios para demonstrar a funcionalidade
        if (fifo.isEmpty()) {
            const nodes = graph.getAllNodes();
            if (nodes.length > 0) {
                // Gera 1-3 eventos aleatórios
                const numEvents = Math.min(3, Math.max(1, Math.floor(nodes.length / 2)));
                const eventTypes = ["demand_change", "overload", "capacity_change"];

                for (let i = 0; i < numEvents; i++) {
                    const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
                    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

                    let event: Event;

                    switch (eventType) {
                        case "demand_change":
                            const newDemand = randomNode.demand * (0.8 + Math.random() * 0.4); // Varia entre 80% e 120%
                            event = {
                                type: "demand_change",
                                payload: {
                                    nodeId: randomNode.id,
                                    demand: Math.max(0, newDemand),
                                },
                                severity: 2,
                                createdAt: new Date(),
                            };
                            break;
                        case "overload":
                            event = {
                                type: "overload",
                                payload: {
                                    nodeId: randomNode.id,
                                    multiplier: 1.2 + Math.random() * 0.3, // 1.2x a 1.5x
                                },
                                severity: 1,
                                createdAt: new Date(),
                            };
                            break;
                        case "capacity_change":
                            const newCapacity = randomNode.capacity * (0.9 + Math.random() * 0.2); // Varia entre 90% e 110%
                            event = {
                                type: "capacity_change",
                                payload: {
                                    nodeId: randomNode.id,
                                    capacity: Math.max(1, newCapacity),
                                },
                                severity: 2,
                                createdAt: new Date(),
                            };
                            break;
                        default:
                            continue;
                    }

                    addEvent(event);
                }
            }
        }

        const result = runSimulationCycle(graph, fifo, heap);

        // Salvar consumo automaticamente na árvore B+ (simulando medição de sensores IoT)
        try {
            const historyTree = await getHistoryTreeInstance();
            const timestamp = Date.now();
            const consumption = result.metrics.consumption;

            if (consumption > 0) {
                historyTree.insert(timestamp, consumption);
                await persistHistoryTree();
            }
        } catch (historyError) {
            // Não falha a simulação se houver erro ao salvar histórico
            console.warn("Erro ao salvar consumo no histórico:", historyError);
        }

        return NextResponse.json({
            success: true,
            data: {
                graph: result.graph,
                metrics: result.metrics,
                logs: result.logs.map(log => ({
                    timestamp: log.timestamp.toISOString(),
                    level: log.level,
                    message: log.message,
                })),
                pendingEvents: result.pendingEvents,
            },
        });
    } catch (error) {
        console.error("Erro ao executar ciclo de simulação:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Erro desconhecido",
            },
            { status: 500 }
        );
    }
}

