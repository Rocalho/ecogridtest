import { NextRequest, NextResponse } from "next/server";
import { getNetworkInstance } from "@/lib/graph";
import { saveNetwork } from "@/lib/storage";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, origin, destination, resistance, capacity, currentFlow } = body;

        if (!origin) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Origem (origin) é obrigatória",
                },
                { status: 400 }
            );
        }

        if (!destination) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Destino (destination) é obrigatório",
                },
                { status: 400 }
            );
        }

        if (origin === destination) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Origem e destino não podem ser o mesmo nó",
                },
                { status: 400 }
            );
        }

        if (typeof resistance !== "number" || resistance < 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Resistência deve ser um número não negativo",
                },
                { status: 400 }
            );
        }

        if (typeof capacity !== "number" || capacity < 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Capacidade deve ser um número não negativo",
                },
                { status: 400 }
            );
        }

        const network = await getNetworkInstance();
        const edge = network.addEdge({
            id,
            origin,
            destination,
            resistance,
            capacity,
            currentFlow: currentFlow || 0,
        });

        await saveNetwork({
            nodes: network.getAllNodes(),
            edges: network.getAllEdges(),
            edgeIdCounter: network.getEdgeIdCounter(),
        });

        return NextResponse.json(
            {
                success: true,
                data: edge,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Erro ao adicionar aresta:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Erro desconhecido",
            },
            { status: 500 }
        );
    }
}

