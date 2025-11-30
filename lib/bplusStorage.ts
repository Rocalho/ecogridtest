import { promises as fs } from "fs";
import path from "path";
import { BPlusTree } from "./algorithms/bplus";
import { BPlusTreeSerialized } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const HISTORY_FILE = path.join(DATA_DIR, "history.json");

async function ensureDataDirectory(): Promise<void> {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
}

export async function saveHistoryTree(tree: BPlusTree): Promise<void> {
    try {
        await ensureDataDirectory();

        const serialized = tree.serialize();
        await fs.writeFile(HISTORY_FILE, JSON.stringify(serialized, null, 2), "utf-8");
    } catch (error) {
        console.error("Erro ao salvar histórico:", error);
        throw new Error(`Falha ao salvar histórico: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    }
}

export async function loadHistoryTree(order: number = 4): Promise<BPlusTree | null> {
    try {
        await fs.access(HISTORY_FILE);
        const fileContent = await fs.readFile(HISTORY_FILE, "utf-8");
        const serialized: BPlusTreeSerialized = JSON.parse(fileContent);
        return BPlusTree.deserialize(serialized);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            return null;
        }
        console.error("Erro ao carregar histórico:", error);
        throw new Error(`Falha ao carregar histórico: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    }
}

export async function resetHistoryTree(): Promise<void> {
    try {
        await fs.unlink(HISTORY_FILE);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            return;
        }
        console.error("Erro ao resetar histórico:", error);
        throw new Error(`Falha ao resetar histórico: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    }
}

