import { HistoricalDataPoint } from "../types";

export class MLP {
    private inputSize: number = 1;
    private hiddenSize: number = 10;
    private outputSize: number = 1;
    private learningRate: number = 0.01;
    private epochs: number = 1000;

    private weightsInputHidden: number[][] = [];
    private biasHidden: number[] = [];
    private weightsHiddenOutput: number[][] = [];
    private biasOutput: number[] = [];

    private trained: boolean = false;
    private minTimestamp: number = 0;
    private maxTimestamp: number = 1;
    private minConsumo: number = 0;
    private maxConsumo: number = 1;

    constructor(hiddenSize: number = 10, learningRate: number = 0.01, epochs: number = 1000) {
        this.hiddenSize = hiddenSize;
        this.learningRate = learningRate;
        this.epochs = epochs;
    }

    private relu(x: number): number {
        return Math.max(0, x);
    }

    private reluDerivative(x: number): number {
        return x > 0 ? 1 : 0;
    }

    private normalize(value: number, min: number, max: number): number {
        if (max === min) return 0.5;
        return (value - min) / (max - min);
    }

    private denormalize(value: number, min: number, max: number): number {
        return value * (max - min) + min;
    }

    private initializeWeights(): void {
        this.weightsInputHidden = [];
        for (let i = 0; i < this.hiddenSize; i++) {
            this.weightsInputHidden[i] = [];
            for (let j = 0; j < this.inputSize; j++) {
                this.weightsInputHidden[i][j] = (Math.random() - 0.5) * 2 * Math.sqrt(2.0 / this.inputSize);
            }
        }

        this.biasHidden = new Array(this.hiddenSize).fill(0).map(() => (Math.random() - 0.5) * 0.1);

        this.weightsHiddenOutput = [];
        for (let i = 0; i < this.outputSize; i++) {
            this.weightsHiddenOutput[i] = [];
            for (let j = 0; j < this.hiddenSize; j++) {
                this.weightsHiddenOutput[i][j] = (Math.random() - 0.5) * 2 * Math.sqrt(2.0 / this.hiddenSize);
            }
        }

        this.biasOutput = new Array(this.outputSize).fill(0).map(() => (Math.random() - 0.5) * 0.1);
    }

    private forward(input: number[]): { hidden: number[]; output: number[] } {
        const hidden: number[] = [];
        for (let i = 0; i < this.hiddenSize; i++) {
            let sum = this.biasHidden[i];
            for (let j = 0; j < this.inputSize; j++) {
                sum += this.weightsInputHidden[i][j] * input[j];
            }
            hidden[i] = this.relu(sum);
        }

        const output: number[] = [];
        for (let i = 0; i < this.outputSize; i++) {
            let sum = this.biasOutput[i];
            for (let j = 0; j < this.hiddenSize; j++) {
                sum += this.weightsHiddenOutput[i][j] * hidden[j];
            }
            output[i] = sum;
        }

        return { hidden, output };
    }

    train(data: HistoricalDataPoint[]): void {
        if (data.length < 2) {
            throw new Error("Precisa de pelo menos 2 pontos para treinar o MLP");
        }

        const timestamps = data.map(d => d.timestamp);
        const consumos = data.map(d => d.consumo);
        this.minTimestamp = Math.min(...timestamps);
        this.maxTimestamp = Math.max(...timestamps);
        this.minConsumo = Math.min(...consumos);
        this.maxConsumo = Math.max(...consumos);

        this.initializeWeights();

        for (let epoch = 0; epoch < this.epochs; epoch++) {
            for (const point of data) {
                const normalizedInput = [this.normalize(point.timestamp, this.minTimestamp, this.maxTimestamp)];
                const normalizedTarget = [this.normalize(point.consumo, this.minConsumo, this.maxConsumo)];

                const { hidden, output } = this.forward(normalizedInput);

                const error = normalizedTarget[0] - output[0];

                const outputDelta = error;

                const hiddenDelta: number[] = [];
                for (let i = 0; i < this.hiddenSize; i++) {
                    let delta = 0;
                    for (let j = 0; j < this.outputSize; j++) {
                        delta += this.weightsHiddenOutput[j][i] * outputDelta;
                    }
                    let preActivation = this.biasHidden[i];
                    for (let j = 0; j < this.inputSize; j++) {
                        preActivation += this.weightsInputHidden[i][j] * normalizedInput[j];
                    }
                    hiddenDelta[i] = delta * this.reluDerivative(preActivation);
                }

                for (let i = 0; i < this.outputSize; i++) {
                    for (let j = 0; j < this.hiddenSize; j++) {
                        this.weightsHiddenOutput[i][j] += this.learningRate * outputDelta * hidden[j];
                    }
                    this.biasOutput[i] += this.learningRate * outputDelta;
                }

                for (let i = 0; i < this.hiddenSize; i++) {
                    for (let j = 0; j < this.inputSize; j++) {
                        this.weightsInputHidden[i][j] += this.learningRate * hiddenDelta[i] * normalizedInput[j];
                    }
                    this.biasHidden[i] += this.learningRate * hiddenDelta[i];
                }
            }
        }

        this.trained = true;
    }

    predict(timestamp: number): number {
        if (!this.trained) {
            throw new Error("Modelo não foi treinado ainda");
        }

        const normalizedInput = [this.normalize(timestamp, this.minTimestamp, this.maxTimestamp)];
        const { output } = this.forward(normalizedInput);
        return this.denormalize(output[0], this.minConsumo, this.maxConsumo);
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

