"use client";

import { useState } from "react";
import { useNetworkStore } from "@/lib/store/networkStore";
import Modal from "@/components/ui/Modal";

interface AddEdgeModalProps {
    isOpen: boolean;
    onClose: () => void;
    sourceNodeId?: string;
    targetNodeId?: string;
}

export default function AddEdgeModal({
    isOpen,
    onClose,
    sourceNodeId,
    targetNodeId,
}: AddEdgeModalProps) {
    const addEdgeFromBackend = useNetworkStore((state) => state.addEdgeFromBackend);
    const nodes = useNetworkStore((state) => state.nodes);
    const [formData, setFormData] = useState({
        source: sourceNodeId || "",
        target: targetNodeId || "",
        distance: 0,
        resistance: 0,
        capacity: 0,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        if (!formData.source || !formData.target) {
            setError("Selecione os nós de origem e destino");
            setIsLoading(false);
            return;
        }

        if (formData.source === formData.target) {
            setError("O nó de origem e destino não podem ser o mesmo");
            setIsLoading(false);
            return;
        }

        const edges = useNetworkStore.getState().edges;
        const edgeExists = edges.some(
            (edge) =>
                (edge.source === formData.source && edge.target === formData.target) ||
                (edge.source === formData.target && edge.target === formData.source)
        );

        if (edgeExists) {
            setError("Esta conexão já existe");
            setIsLoading(false);
            return;
        }

        try {
            await addEdgeFromBackend({
                source: formData.source,
                target: formData.target,
                data: {
                    distance: formData.distance,
                    resistance: formData.resistance,
                    capacity: formData.capacity,
                    currentLoad: 0,
                    loss: 0,
                },
            });

            setFormData({
                source: sourceNodeId || "",
                target: targetNodeId || "",
                distance: 0,
                resistance: 0,
                capacity: 0,
            });

            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao adicionar linha");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Adicionar Linha"
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                        {error}
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nó de Origem
                    </label>
                    <select
                        value={formData.source}
                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    >
                        <option value="">Selecione...</option>
                        {nodes.map((node) => (
                            <option key={node.id} value={node.id}>
                                {node.data.label || node.id}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nó de Destino
                    </label>
                    <select
                        value={formData.target}
                        onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    >
                        <option value="">Selecione...</option>
                        {nodes
                            .filter((node) => node.id !== formData.source)
                            .map((node) => (
                                <option key={node.id} value={node.id}>
                                    {node.data.label || node.id}
                                </option>
                            ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Distância (km)
                    </label>
                    <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={formData.distance}
                        onChange={(e) =>
                            setFormData({ ...formData, distance: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Resistência (Ω)
                    </label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.resistance}
                        onChange={(e) =>
                            setFormData({ ...formData, resistance: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Capacidade Máxima (A)
                    </label>
                    <input
                        type="number"
                        min="0"
                        value={formData.capacity}
                        onChange={(e) =>
                            setFormData({ ...formData, capacity: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex gap-2 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isLoading ? "Adicionando..." : "Adicionar"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

