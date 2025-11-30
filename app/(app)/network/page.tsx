"use client";

import { useEffect, useState } from "react";
import GraphCanvas from "@/components/networkEditor/GraphCanvas";
import NodeDetailsToast from "@/components/networkEditor/NodeDetailsToast";
import Toolbar from "@/components/networkEditor/Toolbar";
import { useNetworkStore } from "@/lib/store/networkStore";

export default function NetworkPage() {
    const loadNetworkFromBackend = useNetworkStore((state) => state.loadNetworkFromBackend);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadNetwork = async () => {
            try {
                setIsLoading(true);
                setError(null);
                await loadNetworkFromBackend();
            } catch (err) {
                console.error("Erro ao carregar rede:", err);
                setError(err instanceof Error ? err.message : "Erro ao carregar rede");
            } finally {
                setIsLoading(false);
            }
        };

        loadNetwork();
    }, [loadNetworkFromBackend]);

    if (isLoading) {
        return (
            <div className="h-[calc(100vh-8rem)] bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando rede...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-[calc(100vh-8rem)] bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative flex items-center justify-center">
                <div className="text-center p-6">
                    <p className="text-red-600 mb-4">Erro ao carregar rede: {error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Tentar novamente
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-8rem)] bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative">
            <Toolbar />
            <GraphCanvas />
            <NodeDetailsToast />
        </div>
    );
}
