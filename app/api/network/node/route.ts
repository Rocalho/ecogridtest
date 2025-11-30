import { NextRequest, NextResponse } from "next/server";
import { getNetworkInstance, NodeType, NodeStatus } from "@/lib/graph";
import { saveNetwork } from "@/lib/storage";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, type, capacity, demand, status, name } = body;

        if (!type || !Object.values(NodeType).includes(type)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Tipo de nó inválido. Deve ser: producer, consumer, substation ou transmission",
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

        if (typeof demand !== "number" || demand < 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Demanda deve ser um número não negativo",
                },
                { status: 400 }
            );
        }

        const network = await getNetworkInstance();
        const node = network.addNode({
            id,
            type: type as NodeType,
            capacity,
            demand,
            status: (status as NodeStatus) || NodeStatus.ACTIVE,
            name,
        });

        await saveNetwork({
            nodes: network.getAllNodes(),
            edges: network.getAllEdges(),
            edgeIdCounter: network.getEdgeIdCounter(),
        });

        return NextResponse.json(
            {
                success: true,
                data: node,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Erro ao adicionar nó:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Erro desconhecido",
            },
            { status: 500 }
        );
    }
}

