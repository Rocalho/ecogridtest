import { NextRequest, NextResponse } from "next/server";
import { predict, HistoricalDataPoint } from "@/lib/prediction";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { historical } = body;

        if (!historical) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Campo 'historical' é obrigatório",
                },
                { status: 400 }
            );
        }

        if (!Array.isArray(historical)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Campo 'historical' deve ser um array",
                },
                { status: 400 }
            );
        }

        if (historical.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Array 'historical' não pode estar vazio",
                },
                { status: 400 }
            );
        }

        for (let i = 0; i < historical.length; i++) {
            const point = historical[i];
            if (!point || typeof point !== "object") {
                return NextResponse.json(
                    {
                        success: false,
                        error: `Ponto ${i} do histórico é inválido`,
                    },
                    { status: 400 }
                );
            }

            if (typeof point.timestamp !== "number" || isNaN(point.timestamp)) {
                return NextResponse.json(
                    {
                        success: false,
                        error: `Ponto ${i} do histórico: 'timestamp' deve ser um número válido`,
                    },
                    { status: 400 }
                );
            }

            if (typeof point.consumo !== "number" || isNaN(point.consumo)) {
                return NextResponse.json(
                    {
                        success: false,
                        error: `Ponto ${i} do histórico: 'consumo' deve ser um número válido`,
                    },
                    { status: 400 }
                );
            }
        }

        const historicalData: HistoricalDataPoint[] = historical.map((point: any) => ({
            timestamp: point.timestamp,
            consumo: point.consumo,
        }));

        const result = predict(historicalData);

        return NextResponse.json({
            success: true,
            data: {
                predictedValue: result.predictedValue,
                errorMargin: result.errorMargin,
                overloadRisk: result.overloadRisk,
            },
        });
    } catch (error) {
        console.error("Erro ao realizar predição:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Erro desconhecido ao realizar predição",
            },
            { status: 500 }
        );
    }
}

