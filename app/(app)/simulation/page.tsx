"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import KpiCard from "@/components/KpiCard";
import { useNetworkStore } from "@/lib/store/networkStore";
import { useLogStore } from "@/lib/store/logStore";
import {
    calculateGlobalEfficiency,
    calculateTotalLosses,
    calculateTotalConsumption,
} from "@/lib/utils/networkMetrics";

interface Event {
    type: string;
    payload: any;
    severity: number;
    createdAt: string;
}

interface EventsData {
    fifo: {
        size: number;
        isEmpty: boolean;
        events: Event[];
    };
    heap: {
        size: number;
        isEmpty: boolean;
        events: Event[];
    };
}

export default function SimulationPage() {
    const [fifoEvents, setFifoEvents] = useState<Event[]>([]);
    const [heapEvents, setHeapEvents] = useState<Event[]>([]);

    const { nodes, edges } = useNetworkStore();
    const { getLogsBySource } = useLogStore();

    useEffect(() => {
        loadEvents();
        // Atualizar eventos a cada 2 segundos para mostrar estado atual
        const interval = setInterval(loadEvents, 2000);
        return () => clearInterval(interval);
    }, []);

    const loadEvents = async () => {
        try {
            const response = await fetch("/api/simulation/events");
            if (!response.ok) {
                throw new Error("Erro ao carregar eventos");
            }
            const data: EventsData = await response.json();
            setFifoEvents(data.fifo.events || []);
            setHeapEvents(data.heap.events || []);
        } catch (error) {
            console.error("Erro ao carregar eventos:", error);
        }
    };

    const currentEfficiency = calculateGlobalEfficiency(nodes, edges);
    const currentLosses = calculateTotalLosses(nodes, edges);
    const currentConsumption = calculateTotalConsumption(nodes);

    const simulationLogs = getLogsBySource("simulation");

    const formatEvent = (event: Event) => {
        const date = new Date(event.createdAt);
        const timeStr = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        return `${timeStr} - ${event.type}${event.payload ? `: ${JSON.stringify(event.payload)}` : ""}`;
    };

    return (
        <div className="flex flex-col gap-6 text-slate-900">
            <Header>Simulação</Header>

            {/* KPIs de Métricas */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KpiCard
                    label="Perdas (kW)"
                    value={currentLosses}
                />
                <KpiCard
                    label="Eficiência (%)"
                    value={currentEfficiency * 100}
                />
                <KpiCard
                    label="Consumo (A)"
                    value={currentConsumption}
                />
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-4 bg-white shadow rounded-xl">
                    <h2 className="text-lg font-medium mb-3">Fila de Eventos (FIFO)</h2>
                    <div className="text-xs text-gray-500 mb-2">
                        {fifoEvents.length} evento(s) na fila
                    </div>
                    <ul className="max-h-64 overflow-y-auto text-sm space-y-2 text-gray-700">
                        {fifoEvents.length === 0 ? (
                            <li className="text-gray-400 italic">Nenhum evento ainda...</li>
                        ) : (
                            fifoEvents.map((event, index) => (
                                <li key={index} className="p-2 bg-gray-50 rounded border border-gray-200">
                                    {formatEvent(event)}
                                </li>
                            ))
                        )}
                    </ul>
                </div>

                <div className="p-4 bg-white shadow rounded-xl">
                    <h2 className="text-lg font-medium mb-3">Eventos Críticos (Heap)</h2>
                    <div className="text-xs text-gray-500 mb-2">
                        {heapEvents.length} evento(s) crítico(s)
                    </div>
                    <ul className="max-h-64 overflow-y-auto text-sm space-y-2 text-gray-700">
                        {heapEvents.length === 0 ? (
                            <li className="text-gray-400 italic">Nenhum evento crítico...</li>
                        ) : (
                            heapEvents.map((event, index) => (
                                <li
                                    key={index}
                                    className="p-2 bg-red-50 rounded border border-red-200"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-red-600 font-semibold">
                                            Severidade: {event.severity}
                                        </span>
                                    </div>
                                    {formatEvent(event)}
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </section>

            <section className="p-4 bg-white shadow rounded-xl">
                <h2 className="text-lg font-medium mb-3">Logs da Simulação</h2>
                <ul className="max-h-48 overflow-y-auto text-sm text-gray-700 space-y-2">
                    {simulationLogs.length === 0 ? (
                        <li className="text-gray-400 italic">Nenhum log ainda...</li>
                    ) : (
                        simulationLogs.map((log) => {
                            const timeStr = log.timestamp.toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                            });
                            const levelColor =
                                log.level === "error"
                                    ? "text-red-600"
                                    : log.level === "warning"
                                        ? "text-yellow-600"
                                        : log.level === "success"
                                            ? "text-green-600"
                                            : "text-blue-600";
                            return (
                                <li key={log.id} className="flex items-start gap-2">
                                    <span className="text-gray-400 text-xs">{timeStr}</span>
                                    <span className={`font-medium ${levelColor}`}>
                                        [{log.level.toUpperCase()}]
                                    </span>
                                    <span>{log.message}</span>
                                </li>
                            );
                        })
                    )}
                </ul>
            </section>
        </div>
    );
}
