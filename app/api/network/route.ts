import { NextRequest, NextResponse } from "next/server";
import { getNetworkInstance, NetworkNode, NetworkEdge } from "@/lib/graph";
import { saveNetwork, loadNetwork } from "@/lib/storage";

export async function GET() {
    try {
        const network = await getNetworkInstance();

        if (network.getAllNodes().length === 0) {
            const savedData = await loadNetwork();
            if (savedData) {
                network.restore(
                    savedData.nodes as NetworkNode[],
                    savedData.edges as NetworkEdge[],
                    savedData.edgeIdCounter
                );
            }
        }

        const nodes = network.getAllNodes();
        const edges = network.getAllEdges();
        const stats = network.getStats();

        return NextResponse.json({
            success: true,
            data: {
                nodes,
                edges,
                stats,
            },
        });
    } catch (error) {
        console.error("Erro ao obter rede:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Erro desconhecido",
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { nodes, edges, edgeIdCounter } = body;

        if (!Array.isArray(nodes) || !Array.isArray(edges)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Formato inválido. Esperado: { nodes: [], edges: [], edgeIdCounter?: number }",
                },
                { status: 400 }
            );
        }

        const network = await getNetworkInstance();
        network.restore(nodes, edges, edgeIdCounter || 1);

        await saveNetwork({
            nodes: network.getAllNodes(),
            edges: network.getAllEdges(),
            edgeIdCounter: network.getEdgeIdCounter(),
        });

        return NextResponse.json({
            success: true,
            message: "Rede salva com sucesso",
        });
    } catch (error) {
        console.error("Erro ao salvar rede:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Erro desconhecido",
            },
            { status: 500 }
        );
    }
}

export async function DELETE() {
    try {
        const { resetNetwork } = await import("@/lib/storage");
        const { resetNetworkInstance } = await import("@/lib/graph");

        await resetNetwork();
        resetNetworkInstance();

        return NextResponse.json({
            success: true,
            message: "Rede resetada com sucesso",
        });
    } catch (error) {
        console.error("Erro ao resetar rede:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Erro desconhecido",
            },
            { status: 500 }
        );
    }
}

