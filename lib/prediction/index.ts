import { HistoricalDataPoint, PredictionResult } from "../types";
import { LinearRegression } from "../algorithms/linearRegression";
import { MLP } from "../algorithms/mlp";

/**
 * Realiza predição de consumo usando regressão linear e MLP
 * Combina os resultados dos dois modelos para melhor precisão
 */
export function predict(historical: HistoricalDataPoint[]): PredictionResult {
    if (historical.length < 2) {
        throw new Error("Precisa de pelo menos 2 pontos históricos para predição");
    }

    // Ordenar dados por timestamp
    const sortedData = [...historical].sort((a, b) => a.timestamp - b.timestamp);

    // Calcular próximo timestamp (assumindo intervalo médio)
    const timestamps = sortedData.map(d => d.timestamp);
    const lastTimestamp = timestamps[timestamps.length - 1];
    const secondLastTimestamp = timestamps[timestamps.length - 2];
    const timeStep = lastTimestamp - secondLastTimestamp;
    const nextTimestamp = lastTimestamp + timeStep;

    // Predição com Regressão Linear
    const linearModel = new LinearRegression();
    linearModel.train(sortedData);
    const linearPrediction = linearModel.predict(nextTimestamp);
    const linearError = linearModel.calculateErrorStdDev(sortedData);

    // Predição com MLP (para padrões mais complexos)
    let mlpPrediction = linearPrediction;
    let mlpError = linearError;

    try {
        // Usar MLP apenas se houver dados suficientes (melhor para padrões complexos)
        if (sortedData.length >= 5) {
            const mlpModel = new MLP(10, 0.01, 500);
            mlpModel.train(sortedData);
            mlpPrediction = mlpModel.predict(nextTimestamp);
            mlpError = mlpModel.calculateErrorStdDev(sortedData);
        }
    } catch (error) {
        // Se MLP falhar, usar apenas regressão linear
        console.warn("Erro ao treinar MLP, usando apenas regressão linear:", error);
    }

    // Combinar predições (média ponderada: MLP tem mais peso se disponível)
    const weights = sortedData.length >= 5 
        ? { linear: 0.4, mlp: 0.6 }  // MLP tem mais peso se houver dados suficientes
        : { linear: 1.0, mlp: 0.0 }; // Apenas linear se poucos dados

    const predictedValue = weights.mlp > 0
        ? linearPrediction * weights.linear + mlpPrediction * weights.mlp
        : linearPrediction;

    // Margem de erro (média dos erros dos modelos)
    const errorMargin = weights.mlp > 0
        ? (linearError * weights.linear + mlpError * weights.mlp)
        : linearError;

    // Calcular risco de sobrecarga baseado no consumo atual e tendência
    const currentConsumption = sortedData[sortedData.length - 1].consumo;
    const averageConsumption = sortedData.reduce((sum, d) => sum + d.consumo, 0) / sortedData.length;
    const trend = predictedValue - currentConsumption;
    
    // Risco aumenta se:
    // 1. Predição está acima da média
    // 2. Tendência é crescente
    // 3. Predição está próxima ou acima de 80% da capacidade (assumindo capacidade padrão de 100A por nó)
    const capacityThreshold = 80; // 80% de capacidade
    const normalizedPrediction = (predictedValue / capacityThreshold) * 100;
    const trendRisk = Math.max(0, Math.min(1, trend / (averageConsumption * 0.1))); // Normalizar tendência
    const capacityRisk = Math.max(0, Math.min(1, (normalizedPrediction - 50) / 50)); // Risco aumenta acima de 50%
    
    const overloadRisk = Math.min(1, Math.max(0, (capacityRisk * 0.6 + trendRisk * 0.4)));

    return {
        predictedValue: Math.max(0, predictedValue), // Garantir que não seja negativo
        errorMargin: Math.max(0, errorMargin),
        overloadRisk,
    };
}

// Re-exportar tipos para facilitar importação
export type { HistoricalDataPoint } from "../types";



