import { BPlusTree } from "./algorithms/bplus";
import { loadHistoryTree, saveHistoryTree } from "./bplusStorage";

let historyTreeInstance: BPlusTree | null = null;
const DEFAULT_ORDER = 4;

export async function getHistoryTreeInstance(order: number = DEFAULT_ORDER): Promise<BPlusTree> {
    if (historyTreeInstance === null) {
        const loaded = await loadHistoryTree(order);
        if (loaded !== null) {
            historyTreeInstance = loaded;
        } else {
            historyTreeInstance = new BPlusTree(order);
        }
    }
    return historyTreeInstance;
}

export function resetHistoryTreeInstance(): void {
    historyTreeInstance = null;
}

export async function persistHistoryTree(): Promise<void> {
    if (historyTreeInstance !== null) {
        await saveHistoryTree(historyTreeInstance);
    }
}

