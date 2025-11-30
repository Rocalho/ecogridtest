"use client";

import { useState } from "react";
import { useNetworkStore } from "@/lib/store/networkStore";
import { Zap, Activity, TrendingUp, Link2, AlertTriangle, Trash2 } from "lucide-react";
import { getNodeTypeLabel } from "@/lib/utils/graph";
import Modal from "@/components/ui/Modal";
import Dialog from "@/components/ui/Dialog";

interface DialogState {
    isOpen: boolean;
    title: string;
    message: string;
    type: "confirm" | "alert" | "success" | "error";
    onConfirm?: () => void;
}

export default function NodeDetailsToast() {
    const [dialog, setDialog] = useState<DialogState>({
        isOpen: false,
        title: "",
        message: "",
        type: "confirm",
    });

    const selectedNode = useNetworkStore((state) => state.selectedNode);
    const selectedEdge = useNetworkStore((state) => state.selectedEdge);
    const edges = useNetworkStore((state) => state.edges);
    const nodes = useNetworkStore((state) => state.nodes);
    const selectNode = useNetworkStore((state) => state.selectNode);
    const selectEdge = useNetworkStore((state) => state.selectEdge);
    const deleteNode = useNetworkStore((state) => state.deleteNode);
    const deleteEdge = useNetworkStore((state) => state.deleteEdge);

    const isOpen = !!(selectedNode || selectedEdge);

    const showDialog = (
        title: string,
        message: string,
        type: "confirm" | "alert" | "success" | "error",
        onConfirm?: () => void
    ) => {
        setDialog({
            isOpen: true,
            title,
            message,
            type,
            onConfirm,
        });
    };

    const closeDialog = () => {
        setDialog({ ...dialog, isOpen: false });
    };

    const handleClose = () => {
        if (selectedNode) {
            selectNode(null);
        }
        if (selectedEdge) {
            selectEdge(null);
        }
    };

    const handleDeleteNode = () => {
        if (selectedNode) {
            showDialog(
                "Deletar Nó",
                `Tem certeza que deseja deletar o nó "${selectedNode.data.label}"?`,
                "confirm",
                () => {
                    deleteNode(selectedNode.id);
                    handleClose();
                }
            );
        }
    };

    const handleDeleteEdge = () => {
        if (selectedEdge) {
            showDialog(
                "Deletar Conexão",
                "Tem certeza que deseja deletar esta conexão?",
                "confirm",
                () => {
                    deleteEdge(selectedEdge.id);
                    handleClose();
                }
            );
        }
    };

    if (selectedEdge) {
        const sourceNode = nodes.find((n) => n.id === selectedEdge.source);
        const targetNode = nodes.find((n) => n.id === selectedEdge.target);

        return (
            <>
                <Modal
                    isOpen={isOpen}
                    onClose={handleClose}
                    title="Detalhes da Linha"
                    size="md"
                >
                <div className="space-y-4">
                    <div>
                        <p className="text-sm text-gray-600 mb-1">Origem</p>
                        <p className="font-semibold">{sourceNode?.data.label || selectedEdge.source}</p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-600 mb-1">Destino</p>
                        <p className="font-semibold">{targetNode?.data.label || selectedEdge.target}</p>
                    </div>

                    {selectedEdge.data && (
                        <>
                            <div className="border-t pt-4">
                                <p className="text-sm text-gray-600 mb-1">Distância</p>
                                <p className="text-lg font-semibold">{selectedEdge.data.distance} km</p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-600 mb-1">Resistência</p>
                                <p className="text-lg font-semibold">{selectedEdge.data.resistance} Ω</p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-600 mb-1">Capacidade Máxima</p>
                                <p className="text-lg font-semibold">{selectedEdge.data.capacity} A</p>
                            </div>

                            {selectedEdge.data.currentLoad !== undefined && (
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Carga Atual</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-lg font-semibold">{selectedEdge.data.currentLoad} A</p>
                                        <span className="text-xs text-gray-500">
                                            ({((selectedEdge.data.currentLoad / selectedEdge.data.capacity) * 100).toFixed(1)}%)
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                        <div
                                            className="h-2 rounded-full transition-all"
                                            style={{
                                                width: `${Math.min((selectedEdge.data.currentLoad / selectedEdge.data.capacity) * 100, 100)}%`,
                                                backgroundColor:
                                                    (selectedEdge.data.currentLoad / selectedEdge.data.capacity) * 100 >= 90
                                                        ? "#ef4444"
                                                        : (selectedEdge.data.currentLoad / selectedEdge.data.capacity) * 100 >= 75
                                                            ? "#f59e0b"
                                                            : "#22c55e",
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {selectedEdge.data.loss !== undefined && (
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Perdas</p>
                                    <p className="text-lg font-semibold">{selectedEdge.data.loss.toFixed(2)} W</p>
                                </div>
                            )}
                        </>
                    )}

                    <div className="border-t pt-4 mt-4">
                        <button
                            onClick={handleDeleteEdge}
                            className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center gap-2 transition-colors"
                        >
                            <Trash2 size={18} />
                            <span>Deletar Conexão</span>
                        </button>
                    </div>
                </div>
            </Modal>

                <Dialog
                    isOpen={dialog.isOpen}
                    onClose={closeDialog}
                    onConfirm={dialog.onConfirm}
                    title={dialog.title}
                    message={dialog.message}
                    type={dialog.type}
                    confirmText={dialog.type === "confirm" ? "Confirmar" : "OK"}
                />
            </>
        );
    }

    if (selectedNode) {
        const loadPercentage = (selectedNode.data.load / selectedNode.data.capacity) * 100;
        const connectedEdges = edges.filter(
            (edge) => edge.source === selectedNode.id || edge.target === selectedNode.id
        );
        const connectedNodes = connectedEdges.map((edge) => {
            const connectedId = edge.source === selectedNode.id ? edge.target : edge.source;
            return nodes.find((n) => n.id === connectedId);
        }).filter(Boolean);

        const isOverloaded = loadPercentage >= 90;
        const isWarning = loadPercentage >= 75 && loadPercentage < 90;

        return (
            <>
                <Modal
                    isOpen={isOpen}
                    onClose={handleClose}
                    title={
                        <div className="flex items-center gap-2">
                            <Zap size={20} className="text-yellow-500" />
                            <span>{selectedNode.data.label || `Nó ${selectedNode.id}`}</span>
                            <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                                {getNodeTypeLabel(selectedNode.data.type)}
                            </span>
                        </div>
                    }
                    size="md"
                >
                <div className="space-y-4">
                    {(isOverloaded || isWarning) && (
                        <div
                            className={`p-3 rounded-lg flex items-start gap-2 ${isOverloaded ? "bg-red-50 border border-red-200" : "bg-yellow-50 border border-yellow-200"
                                }`}
                        >
                            <AlertTriangle
                                size={20}
                                className={isOverloaded ? "text-red-600 mt-0.5" : "text-yellow-600 mt-0.5"}
                            />
                            <div>
                                <p className={`font-semibold text-sm ${isOverloaded ? "text-red-800" : "text-yellow-800"}`}>
                                    {isOverloaded ? "Sobrecarga Crítica" : "Atenção"}
                                </p>
                                <p className={`text-xs mt-1 ${isOverloaded ? "text-red-700" : "text-yellow-700"}`}>
                                    {isOverloaded
                                        ? "Este nó está operando acima de 90% da capacidade"
                                        : "Este nó está próximo do limite de capacidade"}
                                </p>
                            </div>
                        </div>
                    )}

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Activity size={16} />
                                Carga Atual
                            </p>
                            <span className="text-sm font-semibold">
                                {selectedNode.data.load} / {selectedNode.data.capacity} A
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className="h-3 rounded-full transition-all flex items-center justify-end pr-2"
                                style={{
                                    width: `${Math.min(loadPercentage, 100)}%`,
                                    backgroundColor: isOverloaded
                                        ? "#ef4444"
                                        : isWarning
                                            ? "#f59e0b"
                                            : loadPercentage >= 50
                                                ? "#eab308"
                                                : "#22c55e",
                                }}
                            >
                                <span className="text-xs font-bold text-white">
                                    {loadPercentage.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <TrendingUp size={16} />
                            Eficiência
                        </p>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-3">
                                <div
                                    className="h-3 rounded-full bg-green-500"
                                    style={{ width: `${selectedNode.data.efficiency * 100}%` }}
                                />
                            </div>
                            <span className="text-sm font-semibold">
                                {(selectedNode.data.efficiency * 100).toFixed(1)}%
                            </span>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                            <Link2 size={16} />
                            Conexões ({connectedNodes.length})
                        </p>
                        {connectedNodes.length > 0 ? (
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                {connectedNodes.map((node) => {
                                    if (!node) return null;
                                    const edge = connectedEdges.find(
                                        (e) =>
                                            (e.source === selectedNode.id && e.target === node.id) ||
                                            (e.target === selectedNode.id && e.source === node.id)
                                    );
                                    return (
                                        <div
                                            key={node.id}
                                            className="p-2 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors"
                                        >
                                            <p className="font-semibold text-sm">{node.data.label || node.id}</p>
                                            {edge?.data && (
                                                <p className="text-xs text-gray-600 mt-1">
                                                    {edge.data.distance}km • {edge.data.capacity}A
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">Nenhuma conexão</p>
                        )}
                    </div>

                    <div className="border-t pt-4">
                        <p className="text-sm font-medium text-gray-700 mb-3">Informações Técnicas</p>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">ID:</span>
                                <span className="font-mono text-xs">{selectedNode.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Tipo:</span>
                                <span>{getNodeTypeLabel(selectedNode.data.type)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Posição:</span>
                                <span className="font-mono text-xs">
                                    ({Math.round(selectedNode.position.x)}, {Math.round(selectedNode.position.y)})
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-4 mt-4">
                        <button
                            onClick={handleDeleteNode}
                            className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center gap-2 transition-colors"
                        >
                            <Trash2 size={18} />
                            <span>Deletar Nó</span>
                        </button>
                    </div>
                </div>
            </Modal>

            <Dialog
                isOpen={dialog.isOpen}
                onClose={closeDialog}
                onConfirm={dialog.onConfirm}
                title={dialog.title}
                message={dialog.message}
                type={dialog.type}
                confirmText={dialog.type === "confirm" ? "Confirmar" : "OK"}
            />
        </>
    );
    }

    return null;
}
