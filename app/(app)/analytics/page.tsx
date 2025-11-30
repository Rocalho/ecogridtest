"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Header from "@/components/Header";
import KpiCard from "@/components/KpiCard";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useNetworkStore } from "@/lib/store/networkStore";
import BPlusTreeVisualization from "@/components/analytics/BPlusTreeVisualization";

interface HistoryDataPoint {
    timestamp: number;
    consumo: number;
}

interface RangeQueryResponse {
    success: boolean;
    data?: {
        from: number;
        to: number;
        count: number;
        results: HistoryDataPoint[];
    };
    error?: string;
}

interface TreeNode {
    isLeaf: boolean;
    keys: number[];
    keyCount: number;
    values?: Array<{ key: number; value: number }>;
    children?: TreeNode[];
}

interface TreeStats {
    order: number;
    totalKeys: number;
    height: number;
    leafCount: number;
}

interface TreeResponse {
    success: boolean;
    data?: {
        structure: TreeNode | null;
        stats: TreeStats;
    };
    error?: string;
}

export default function AnalyticsPage() {
    const [historyData, setHistoryData] = useState<HistoryDataPoint[]>([]);
    const [treeStructure, setTreeStructure] = useState<TreeNode | null>(null);
    const [treeStats, setTreeStats] = useState<TreeStats | null>(null);
    const [isLoadingRange, setIsLoadingRange] = useState(false);
    const [isLoadingTree, setIsLoadingTree] = useState(true);
    const [errorRange, setErrorRange] = useState<string | null>(null);
    const [errorTree, setErrorTree] = useState<string | null>(null);
    const [dateFrom, setDateFrom] = useState<string>("");
    const [dateTo, setDateTo] = useState<string>("");

    // Inicializar datas padrão (últimos 7 dias)
    useEffect(() => {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const fromDate = sevenDaysAgo.toISOString().split('T')[0];
        const toDate = now.toISOString().split('T')[0];

        setDateFrom(fromDate);
        setDateTo(toDate);
    }, []);

    // Carregar dados da árvore B+ apenas uma vez
    useEffect(() => {
        loadTreeData();
    }, []);

    const loadRangeData = useCallback(async () => {
        // Validação de datas
        if (!dateFrom || !dateTo) {
            return;
        }

        const fromDate = new Date(dateFrom);
        const toDate = new Date(dateTo);

        if (fromDate > toDate) {
            setErrorRange("Data inicial não pode ser maior que a data final");
            setHistoryData([]);
            return;
        }

        try {
            setIsLoadingRange(true);
            setErrorRange(null);

            const from = fromDate.getTime();
            const to = toDate.getTime() + (24 * 60 * 60 * 1000) - 1; // Fim do dia

            const response = await fetch(`/api/history/range?from=${from}&to=${to}`);

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const data: RangeQueryResponse = await response.json();

            if (data.success && data.data) {
                // Ordenar dados por timestamp antes de definir
                const sortedData = [...data.data.results].sort((a, b) => a.timestamp - b.timestamp);
                setHistoryData(sortedData);
            } else {
                setErrorRange(data.error || "Erro ao carregar dados históricos");
                setHistoryData([]);
            }
        } catch (error) {
            console.error("Erro ao carregar dados do range:", error);
            setErrorRange(error instanceof Error ? error.message : "Erro desconhecido");
            setHistoryData([]);
        } finally {
            setIsLoadingRange(false);
        }
    }, [dateFrom, dateTo]);

    // Carregar dados quando as datas mudarem
    useEffect(() => {
        if (dateFrom && dateTo) {
            loadRangeData();
        }
    }, [dateFrom, dateTo, loadRangeData]);

    const loadTreeData = async () => {
        try {
            setIsLoadingTree(true);
            setErrorTree(null);

            const response = await fetch("/api/history/tree");

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const data: TreeResponse = await response.json();

            if (data.success && data.data) {
                setTreeStructure(data.data.structure);
                setTreeStats(data.data.stats);
            } else {
                setErrorTree(data.error || "Erro ao carregar estrutura da árvore");
                setTreeStructure(null);
                setTreeStats(null);
            }
        } catch (error) {
            console.error("Erro ao carregar estrutura da árvore:", error);
            setErrorTree(error instanceof Error ? error.message : "Erro desconhecido");
            setTreeStructure(null);
            setTreeStats(null);
        } finally {
            setIsLoadingTree(false);
        }
    };


    // Calcular métricas de consumo
    const consumptionMetrics = useMemo(() => {
        if (historyData.length === 0) {
            return {
                average: 0,
                maximum: 0,
                minimum: 0,
                totalRecords: 0,
            };
        }

        const consumptions = historyData
            .map(point => point.consumo)
            .filter(val => typeof val === 'number' && !isNaN(val) && isFinite(val));

        if (consumptions.length === 0) {
            return {
                average: 0,
                maximum: 0,
                minimum: 0,
                totalRecords: historyData.length,
            };
        }

        const average = consumptions.reduce((sum, val) => sum + val, 0) / consumptions.length;
        const maximum = Math.max(...consumptions);
        const minimum = Math.min(...consumptions);

        return {
            average: isNaN(average) ? 0 : average,
            maximum: isNaN(maximum) ? 0 : maximum,
            minimum: isNaN(minimum) ? 0 : minimum,
            totalRecords: historyData.length,
        };
    }, [historyData]);

    // Preparar dados do gráfico (já ordenados por timestamp)
    const chartData = useMemo(() => {
        return historyData.map(point => ({
            timestamp: new Date(point.timestamp).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
            }),
            consumo: point.consumo,
            timestampValue: point.timestamp,
        }));
    }, [historyData]);


    return (
        <div className="flex flex-col gap-6 text-slate-900">
            <Header>Análise</Header>

            <section className="p-4 bg-white shadow rounded-xl">
                <h2 className="text-lg font-medium mb-3">Filtros de Período</h2>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Data Inicial
                        </label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Data Final
                        </label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
            </section>

            {/* KPIs da Árvore B+ */}
            {treeStats && (
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard
                        label="Ordem da Árvore"
                        value={treeStats.order}
                    />
                    <KpiCard
                        label="Total de Chaves"
                        value={treeStats.totalKeys}
                    />
                    <KpiCard
                        label="Altura da Árvore"
                        value={treeStats.height}
                    />
                    <KpiCard
                        label="Número de Folhas"
                        value={treeStats.leafCount}
                    />
                </section>
            )}

            {/* KPIs de Consumo do Período */}
            {historyData.length > 0 && (
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard
                        label="Total de Registros"
                        value={consumptionMetrics.totalRecords || 0}
                    />
                    <KpiCard
                        label="Consumo Médio (A)"
                        value={isNaN(consumptionMetrics.average) ? 0 : parseFloat(consumptionMetrics.average.toFixed(2))}
                    />
                    <KpiCard
                        label="Consumo Máximo (A)"
                        value={isNaN(consumptionMetrics.maximum) ? 0 : parseFloat(consumptionMetrics.maximum.toFixed(2))}
                    />
                    <KpiCard
                        label="Consumo Mínimo (A)"
                        value={isNaN(consumptionMetrics.minimum) ? 0 : parseFloat(consumptionMetrics.minimum.toFixed(2))}
                    />
                </section>
            )}

            <section className="p-4 bg-white shadow rounded-xl">
                <h2 className="text-lg font-medium mb-3">Série Temporal de Consumo</h2>
                {isLoadingRange ? (
                    <div className="h-64 flex items-center justify-center">
                        <p className="text-gray-500">Carregando dados...</p>
                    </div>
                ) : errorRange ? (
                    <div className="h-64 flex items-center justify-center">
                        <p className="text-red-500">{errorRange}</p>
                    </div>
                ) : chartData.length === 0 ? (
                    <div className="h-64 flex items-center justify-center">
                        <p className="text-gray-400">Nenhum dado histórico encontrado para o período selecionado</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="timestamp"
                                angle={-45}
                                textAnchor="end"
                                height={80}
                                interval="preserveStartEnd"
                            />
                            <YAxis label={{ value: "Consumo (A)", angle: -90, position: "insideLeft" }} />
                            <Tooltip
                                formatter={(value: number) => [`${value.toFixed(2)} A`, "Consumo"]}
                                labelFormatter={(label) => `Data: ${label}`}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="consumo"
                                stroke="#2563eb"
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                                name="Consumo (A)"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </section>

            <section className="p-4 bg-white shadow rounded-xl">
                <div className="mb-3">
                    <h2 className="text-lg font-medium">Estrutura da Árvore B+</h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Visualização gráfica da árvore B+ usada para armazenar o histórico de consumo. Nós internos (azul) contêm chaves (timestamps) e referências. Folhas (verde) contêm pares (timestamp, consumo) ordenados.
                    </p>
                </div>
                {isLoadingTree ? (
                    <div className="h-64 flex items-center justify-center">
                        <p className="text-gray-500">Carregando estrutura da árvore...</p>
                    </div>
                ) : errorTree ? (
                    <div className="h-64 flex items-center justify-center">
                        <p className="text-red-500">{errorTree}</p>
                    </div>
                ) : !treeStructure ? (
                    <div className="h-64 flex items-center justify-center">
                        <p className="text-gray-400">Árvore vazia - nenhum dado histórico armazenado</p>
                    </div>
                ) : (
                    <div className="h-[600px] border border-gray-200 rounded-lg bg-white overflow-hidden">
                        <BPlusTreeVisualization treeStructure={treeStructure} />
                    </div>
                )}
            </section>

        </div>
    );
}
