"use client";

import { useMemo, useEffect } from "react";
import Header from "@/components/Header";
import KpiCard from "@/components/KpiCard";
import MiniGraph from "@/components/dashboard/MiniGraph";
import RecentLogs from "@/components/dashboard/RecentLogs";
import { useNetworkStore } from "@/lib/store/networkStore";
import { useLogStore } from "@/lib/store/logStore";
import {
    calculateGlobalEfficiency,
    calculateTotalLosses,
    calculateTotalConsumption,
    calculateNetworkStats,
} from "@/lib/utils/networkMetrics";

export default function Page() {
    const { nodes, edges } = useNetworkStore();
    const { addLog } = useLogStore();

    const efficiency = useMemo(() => {
        return calculateGlobalEfficiency(nodes, edges);
    }, [nodes, edges]);

    const losses = useMemo(() => {
        return calculateTotalLosses(nodes, edges);
    }, [nodes, edges]);

    const consumption = useMemo(() => {
        return calculateTotalConsumption(nodes);
    }, [nodes]);

    const stats = useMemo(() => {
        return calculateNetworkStats(nodes, edges);
    }, [nodes, edges]);

    useEffect(() => {
        if (nodes.length > 0) {
            const hasNodes = nodes.length > 0;
            const hasEdges = edges.length > 0;
            if (hasNodes || hasEdges) {
                const logMessage = hasEdges
                    ? `Rede carregada: ${nodes.length} nós, ${edges.length} conexões`
                    : `Rede carregada: ${nodes.length} nós`;
                addLog(logMessage, "info", "network");
            }
        }
    }, []);

    const formatEfficiency = (value: number) => {
        return (value * 100).toFixed(1);
    };

    const formatLosses = (value: number) => {
        return value.toFixed(2);
    };

    const formatConsumption = (value: number) => {
        return value.toFixed(1);
    };

    return (
        <div className="flex flex-col gap-6 text-slate-900">
            <Header>Painel</Header>

            {/* KPIs Principais */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <KpiCard
                    label="Eficiência Global (%)"
                    value={parseFloat(formatEfficiency(efficiency))}
                />
                <KpiCard
                    label="Perdas Totais (kW)"
                    value={parseFloat(formatLosses(losses))}
                />
                <KpiCard
                    label="Consumo Total (A)"
                    value={parseFloat(formatConsumption(consumption))}
                />
                <KpiCard
                    label="Total de Nós"
                    value={parseFloat(formatConsumption(stats.totalNodes))}
                />
            </section>

            {/* KPIs de Conexões e Status */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    label="Conexões"
                    value={parseFloat(formatConsumption(stats.totalEdges))}
                />
                <KpiCard
                    label="Sobrecarga"
                    value={parseFloat(formatConsumption(stats.overloadedNodes))}
                />
                <KpiCard
                    label="Atenção"
                    value={parseFloat(formatConsumption(stats.warningNodes))}
                />
                <KpiCard
                    label="Produtores"
                    value={parseFloat(formatConsumption(stats.producers))}
                />
                <KpiCard
                    label="Subestações"
                    value={parseFloat(formatConsumption(stats.substations))}
                />
                <KpiCard
                    label="Transformadores"
                    value={parseFloat(formatConsumption(stats.transformers))}
                />
                <KpiCard
                    label="Consumidores"
                    value={parseFloat(formatConsumption(stats.consumers))}
                />
            </section>


            <div>
                <Header>Visão Geral da Rede</Header>
                <div className="border border-gray-50 rounded-lg h-96">
                    <MiniGraph maxNodes={20} />
                </div>
            </div>

            <section className="p-4 bg-white rounded-xl shadow">
                <h2 className="text-lg font-medium mb-3">Logs Recentes</h2>
                <RecentLogs maxLogs={10} />
            </section>

        </div>
    );
}
