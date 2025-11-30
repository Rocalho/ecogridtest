import { NextResponse } from "next/server";
import { getHistoryTreeInstance, resetHistoryTreeInstance } from "@/lib/history";

export async function GET() {
    try {
        // Forçar recarga da árvore do disco para garantir dados atualizados
        resetHistoryTreeInstance();
        const tree = await getHistoryTreeInstance();

        const structure = tree.getTreeStructure();
        const stats = tree.getStats();

        return NextResponse.json({
            success: true,
            data: {
                structure,
                stats,
            },
        });
    } catch (error) {
        console.error("Erro ao obter estrutura da árvore:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Erro desconhecido",
            },
            { status: 500 }
        );
    }
}

