import { NextRequest, NextResponse } from "next/server";
import { getHistoryTreeInstance, resetHistoryTreeInstance } from "@/lib/history";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const fromParam = searchParams.get("from");
        const toParam = searchParams.get("to");

        if (!fromParam || !toParam) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Parâmetros 'from' e 'to' são obrigatórios",
                },
                { status: 400 }
            );
        }

        const from = Number(fromParam);
        const to = Number(toParam);

        if (isNaN(from) || isNaN(to)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Parâmetros 'from' e 'to' devem ser números válidos",
                },
                { status: 400 }
            );
        }

        if (from > to) {
            return NextResponse.json(
                {
                    success: false,
                    error: "O parâmetro 'from' deve ser menor ou igual a 'to'",
                },
                { status: 400 }
            );
        }

        // Forçar recarga da árvore do disco para garantir dados atualizados
        resetHistoryTreeInstance();
        const tree = await getHistoryTreeInstance();
        const results = tree.rangeQuery(from, to);

        return NextResponse.json({
            success: true,
            data: {
                from,
                to,
                count: results.length,
                results,
            },
        });
    } catch (error) {
        console.error("Erro ao consultar histórico:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Erro desconhecido",
            },
            { status: 500 }
        );
    }
}

