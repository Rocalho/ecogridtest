import { HistoricalDataPoint } from "../types";

export class LinearRegression {
    private slope: number = 0;
    private intercept: number = 0;
    private trained: boolean = false;

    train(data: HistoricalDataPoint[]): void {
        if (data.length < 2) {
            throw new Error("Precisa de pelo menos 2 pontos para treinar a regressão linear");
        }

        const n = data.length;
        let sumX = 0;
        let sumY = 0;
        let sumXY = 0;
        let sumX2 = 0;

        for (const point of data) {
            sumX += point.timestamp;
            sumY += point.consumo;
            sumXY += point.timestamp * point.consumo;
            sumX2 += point.timestamp * point.timestamp;
        }

        const denominator = n * sumX2 - sumX * sumX;
        if (Math.abs(denominator) < 1e-10) {
            this.slope = 0;
            this.intercept = sumY / n;
        } else {
            this.slope = (n * sumXY - sumX * sumY) / denominator;
            this.intercept = (sumY - this.slope * sumX) / n;
        }

        this.trained = true;
    }

    predict(timestamp: number): number {
        if (!this.trained) {
            throw new Error("Modelo não foi treinado ainda");
        }
        return this.slope * timestamp + this.intercept;
    }

    calculateMSE(data: HistoricalDataPoint[]): number {
        if (!this.trained || data.length === 0) {
            return 0;
        }

        let sumSquaredError = 0;
        for (const point of data) {
            const predicted = this.predict(point.timestamp);
            const error = point.consumo - predicted;
            sumSquaredError += error * error;
        }

        return sumSquaredError / data.length;
    }

    calculateErrorStdDev(data: HistoricalDataPoint[]): number {
        const mse = this.calculateMSE(data);
        return Math.sqrt(mse);
    }
}

