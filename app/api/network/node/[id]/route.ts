import { NextResponse } from "next/server";
import { getNetworkInstance } from "@/lib/graph";
import { saveNetwork } from "@/lib/storage";

export async function DELETE(
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                {
                    success: false,
                    error: "ID do nó é obrigatório",
                },
                { status: 400 }
            );
        }

        const network = await getNetworkInstance();
        const removed = network.removeNode(id);

        if (!removed) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Nó com id ${id} não encontrado`,
                },
                { status: 404 }
            );
        }

        await saveNetwork({
            nodes: network.getAllNodes(),
            edges: network.getAllEdges(),
            edgeIdCounter: network.getEdgeIdCounter(),
        });

        return NextResponse.json({
            success: true,
            message: `Nó ${id} removido com sucesso`,
        });
    } catch (error) {
        console.error("Erro ao remover nó:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Erro desconhecido",
            },
            { status: 500 }
        );
    }
}

