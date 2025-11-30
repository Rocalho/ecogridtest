"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import KpiCard from "@/components/KpiCard";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

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

interface PredictionResponse {
    success: boolean;
    data?: {
        predictedValue: number;
        errorMargin: number;
        overloadRisk: number;
    };
    error?: string;
}

export default function PredictionPage() {
    const [historyData, setHistoryData] = useState<HistoryDataPoint[]>([]);
    const [prediction, setPrediction] = useState<{
        predictedValue: number;
        errorMargin: number;
        overloadRisk: number;
    } | null>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [isLoadingPrediction, setIsLoadingPrediction] = useState(false);
    const [errorHistory, setErrorHistory] = useState<string | null>(null);
    const [errorPrediction, setErrorPrediction] = useState<string | null>(null);
    const [dateFrom, setDateFrom] = useState<string>("");
    const [dateTo, setDateTo] = useState<string>("");

    useEffect(() => {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        setDateTo(now.toISOString().split('T')[0]);
        setDateFrom(sevenDaysAgo.toISOString().split('T')[0]);
    }, []);

    useEffect(() => {
        if (dateFrom && dateTo) {
            loadHistoryData();
        }
    }, [dateFrom, dateTo]);

    useEffect(() => {
        if (historyData.length > 0) {
            makePrediction();
        }
    }, [historyData]);

    const loadHistoryData = async () => {
        try {
            setIsLoadingHistory(true);
            setErrorHistory(null);

            const from = new Date(dateFrom).getTime();
            const to = new Date(dateTo).getTime() + (24 * 60 * 60 * 1000) - 1;

            const response = await fetch(`/api/history/range?from=${from}&to=${to}`);
            const data: RangeQueryResponse = await response.json();

            if (data.success && data.data) {
                setHistoryData(data.data.results);
            } else {
                setErrorHistory(data.error || "Erro ao carregar dados históricos");
                setHistoryData([]);
                setPrediction(null);
            }
        } catch (error) {
            console.error("Erro ao carregar dados do range:", error);
            setErrorHistory(error instanceof Error ? error.message : "Erro desconhecido");
            setHistoryData([]);
            setPrediction(null);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const makePrediction = async () => {
        if (historyData.length < 2) {
            setErrorPrediction("Precisa de pelo menos 2 pontos históricos para predição");
            setPrediction(null);
            return;
        }

        try {
            setIsLoadingPrediction(true);
            setErrorPrediction(null);

            const response = await fetch("/api/prediction", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    historical: historyData,
                }),
            });

            const data: PredictionResponse = await response.json();

            if (data.success && data.data) {
                setPrediction(data.data);
            } else {
                setErrorPrediction(data.error || "Erro ao realizar predição");
                setPrediction(null);
            }
        } catch (error) {
            console.error("Erro ao realizar predição:", error);
            setErrorPrediction(error instanceof Error ? error.message : "Erro desconhecido");
            setPrediction(null);
        } finally {
            setIsLoadingPrediction(false);
        }
    };

    const getNextTimestamp = () => {
        if (historyData.length < 2) return null;
        const sorted = [...historyData].sort((a, b) => a.timestamp - b.timestamp);
        const lastTimestamp = sorted[sorted.length - 1].timestamp;
        const secondLastTimestamp = sorted[sorted.length - 2].timestamp;
        const timeStep = lastTimestamp - secondLastTimestamp;
        return lastTimestamp + timeStep;
    };

    const chartData = (() => {
        const sorted = [...historyData].sort((a, b) => a.timestamp - b.timestamp);
        const historicalChartData: Array<{
            timestamp: string;
            consumo: number | null;
            predicao: number | null;
            timestampValue: number;
        }> = sorted.map(point => ({
            timestamp: new Date(point.timestamp).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
            }),
            consumo: point.consumo,
            predicao: null,
            timestampValue: point.timestamp,
        }));

        if (prediction) {
            const nextTimestamp = getNextTimestamp();
            if (nextTimestamp) {
                historicalChartData.push({
                    timestamp: new Date(nextTimestamp).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                    consumo: null,
                    predicao: prediction.predictedValue,
                    timestampValue: nextTimestamp,
                });
            }
        }

        return historicalChartData;
    })();

    const riskPercentage = prediction ? prediction.overloadRisk * 100 : 0;
    const riskColor = riskPercentage >= 70 ? "text-red-600" : riskPercentage >= 40 ? "text-yellow-600" : "text-green-600";

    return (
        <div className="flex flex-col gap-6 text-slate-900">
            <Header>Predição de Consumo</Header>

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

            {prediction && (
                <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <KpiCard
                        label="Consumo Previsto (A)"
                        value={parseFloat(prediction.predictedValue.toFixed(2))}
                    />
                    <KpiCard
                        label="Margem de Erro (A)"
                        value={parseFloat(prediction.errorMargin.toFixed(2))}
                    />
                    <article className="p-4 flex flex-col text-slate-900 gap-2 bg-white rounded-lg border border-gray-100">
                        <p className="uppercase text-sm text-gray-600">Risco de Sobrecarga</p>
                        <h2 className={`text-3xl font-bold ${riskColor}`}>
                            {riskPercentage.toFixed(1)}%
                        </h2>
                        <p className="text-sm text-gray-600">
                            {riskPercentage >= 70 ? "Alto" : riskPercentage >= 40 ? "Médio" : "Baixo"}
                        </p>
                    </article>
                </section>
            )}

            {isLoadingPrediction && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-700">Calculando predição...</p>
                </div>
            )}

            {errorPrediction && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700">{errorPrediction}</p>
                </div>
            )}

            <section className="p-4 bg-white shadow rounded-xl">
                <h2 className="text-lg font-medium mb-3">Série Temporal com Predição</h2>
                {isLoadingHistory ? (
                    <div className="h-64 flex items-center justify-center">
                        <p className="text-gray-500">Carregando dados...</p>
                    </div>
                ) : errorHistory ? (
                    <div className="h-64 flex items-center justify-center">
                        <p className="text-red-500">{errorHistory}</p>
                    </div>
                ) : chartData.length === 0 ? (
                    <div className="h-64 flex items-center justify-center">
                        <p className="text-gray-400">Nenhum dado encontrado para o período selecionado</p>
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
                                formatter={(value: any, name: string) => {
                                    if (value === null || value === undefined) return [null, name];
                                    return [`${Number(value).toFixed(2)} A`, name];
                                }}
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
                                name="Histórico (A)"
                                connectNulls={false}
                            />
                            {prediction && (
                                <Line
                                    type="monotone"
                                    dataKey="predicao"
                                    stroke="#ef4444"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    dot={{ r: 6, fill: "#ef4444" }}
                                    activeDot={{ r: 8 }}
                                    name="Predição (A)"
                                    connectNulls={false}
                                />
                            )}
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </section>

        </div>
    );
}

