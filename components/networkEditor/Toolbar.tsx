"use client";

import { useState } from "react";
import { useNetworkStore } from "@/lib/store/networkStore";
import { Plus, Link2, RotateCcw, Save, Download } from "lucide-react";
import AddNodeModal from "./AddNodeModal";
import AddEdgeModal from "./AddEdgeModal";
import Dialog from "@/components/ui/Dialog";
import Tooltip from "@/components/ui/Tooltip";

interface DialogState {
    isOpen: boolean;
    title: string;
    message: string;
    type: "confirm" | "alert" | "success" | "error";
    onConfirm?: () => void;
}

export default function Toolbar() {
    const [isAddNodeOpen, setIsAddNodeOpen] = useState(false);
    const [isAddEdgeOpen, setIsAddEdgeOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [dialog, setDialog] = useState<DialogState>({
        isOpen: false,
        title: "",
        message: "",
        type: "confirm",
    });

    const selectedNode = useNetworkStore((state) => state.selectedNode);
    const clearNetwork = useNetworkStore((state) => state.clearNetwork);
    const saveNetworkToBackend = useNetworkStore((state) => state.saveNetworkToBackend);
    const loadNetworkFromBackend = useNetworkStore((state) => state.loadNetworkFromBackend);
    const nodes = useNetworkStore((state) => state.nodes);

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


    const handleClearNetwork = () => {
        showDialog(
            "Limpar Rede",
            "Tem certeza que deseja limpar toda a rede? Esta ação não pode ser desfeita.",
            "confirm",
            () => {
                clearNetwork();
            }
        );
    };

    const handleSaveNetwork = async () => {
        try {
            setIsSaving(true);
            await saveNetworkToBackend();
            showDialog("Sucesso", "Rede salva com sucesso!", "success");
        } catch (error) {
            showDialog(
                "Erro",
                `Erro ao salvar rede: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
                "error"
            );
        } finally {
            setIsSaving(false);
        }
    };

    const handleLoadNetwork = () => {
        showDialog(
            "Carregar Rede",
            "Tem certeza que deseja carregar a rede do servidor? As alterações não salvas serão perdidas.",
            "confirm",
            async () => {
                try {
                    setIsLoading(true);
                    await loadNetworkFromBackend();
                    showDialog("Sucesso", "Rede carregada com sucesso!", "success");
                } catch (error) {
                    showDialog(
                        "Erro",
                        `Erro ao carregar rede: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
                        "error"
                    );
                } finally {
                    setIsLoading(false);
                }
            }
        );
    };

    return (
        <>
            <div className="absolute bottom-4 right-4 bg-white shadow-lg rounded-lg p-2 flex flex-col gap-1 z-10 border border-gray-200">
                <Tooltip content="Adicionar Nó" position="left">
                    <button
                        onClick={() => setIsAddNodeOpen(true)}
                        className="p-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                        <Plus size={20} />
                    </button>
                </Tooltip>

                <Tooltip content="Adicionar Linha" position="left">
                    <button
                        onClick={() => setIsAddEdgeOpen(true)}
                        disabled={nodes.length < 2}
                        className="p-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                        <Link2 size={20} />
                    </button>
                </Tooltip>

                <div className="h-px bg-gray-300 my-1" />

                <Tooltip content="Limpar Rede" position="left">
                    <button
                        onClick={handleClearNetwork}
                        disabled={nodes.length === 0}
                        className="p-2.5 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                        <RotateCcw size={20} />
                    </button>
                </Tooltip>

                <div className="h-px bg-gray-300 my-1" />

                <Tooltip content="Salvar Rede" position="left">
                    <button
                        onClick={handleSaveNetwork}
                        disabled={isSaving || nodes.length === 0}
                        className="p-2.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                        <Save size={20} />
                    </button>
                </Tooltip>

                <Tooltip content="Carregar Rede" position="left">
                    <button
                        onClick={handleLoadNetwork}
                        disabled={isLoading}
                        className="p-2.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                        <Download size={20} />
                    </button>
                </Tooltip>
            </div>

            <AddNodeModal
                isOpen={isAddNodeOpen}
                onClose={() => setIsAddNodeOpen(false)}
            />

            <AddEdgeModal
                isOpen={isAddEdgeOpen}
                onClose={() => setIsAddEdgeOpen(false)}
                sourceNodeId={selectedNode?.id}
                targetNodeId={undefined}
            />

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

