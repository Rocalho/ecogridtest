import { NextRequest, NextResponse } from "next/server";
import { getHistoryTreeInstance, persistHistoryTree } from "@/lib/history";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { timestamp, consumo } = body;

        if (typeof timestamp !== "number" || timestamp <= 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: "timestamp deve ser um número positivo",
                },
                { status: 400 }
            );
        }

        if (typeof consumo !== "number") {
            return NextResponse.json(
                {
                    success: false,
                    error: "consumo deve ser um número",
                },
                { status: 400 }
            );
        }

        const tree = await getHistoryTreeInstance();
        tree.insert(timestamp, consumo);

        await persistHistoryTree();

        return NextResponse.json({
            success: true,
            message: "Registro adicionado com sucesso",
            data: {
                timestamp,
                consumo,
            },
        });
    } catch (error) {
        console.error("Erro ao adicionar histórico:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Erro desconhecido",
            },
            { status: 500 }
        );
    }
}

