"use client";

import { useState } from "react";
import { useNetworkStore } from "@/lib/store/networkStore";
import Modal from "@/components/ui/Modal";
import { NodeType, getNodeTypeLabel } from "@/lib/utils/graph";

interface AddNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    position?: { x: number; y: number };
}

export default function AddNodeModal({ isOpen, onClose, position }: AddNodeModalProps) {
    const addNodeFromBackend = useNetworkStore((state) => state.addNodeFromBackend);
    const [formData, setFormData] = useState({
        label: "",
        type: NodeType.CONSUMER,
        load: 0,
        capacity: 100,
        efficiency: 0.95,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await addNodeFromBackend({
                data: {
                    label: formData.label || `Nó ${formData.type}`,
                    type: formData.type,
                    load: formData.load,
                    capacity: formData.capacity,
                    efficiency: formData.efficiency,
                    connections: [],
                },
                position,
            });

            setFormData({
                label: "",
                type: NodeType.CONSUMER,
                load: 0,
                capacity: 100,
                efficiency: 0.95,
            });

            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao adicionar nó");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Adicionar Nó"
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                        {error}
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                        Label/Nome
                    </label>
                    <input
                        type="text"
                        value={formData.label}
                        onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nome do nó"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Nó
                    </label>
                    <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as NodeType })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value={NodeType.SUBSTATION}>
                            {getNodeTypeLabel(NodeType.SUBSTATION)}
                        </option>
                        <option value={NodeType.TRANSFORMER}>
                            {getNodeTypeLabel(NodeType.TRANSFORMER)}
                        </option>
                        <option value={NodeType.CONSUMER}>
                            {getNodeTypeLabel(NodeType.CONSUMER)}
                        </option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Carga Atual (A)
                    </label>
                    <input
                        type="number"
                        min="0"
                        value={formData.load}
                        onChange={(e) => setFormData({ ...formData, load: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Capacidade Máxima (A)
                    </label>
                    <input
                        type="number"
                        min="1"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: parseFloat(e.target.value) || 100 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Eficiência (0-1)
                    </label>
                    <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        value={formData.efficiency}
                        onChange={(e) => setFormData({ ...formData, efficiency: parseFloat(e.target.value) || 0.95 })}
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

