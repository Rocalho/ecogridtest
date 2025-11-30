import "server-only";
import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const NETWORK_FILE = path.join(DATA_DIR, "network.json");

import { NetworkData } from "./types";

export type { NetworkData };

async function ensureDataDirectory(): Promise<void> {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
}

export async function saveNetwork(data: NetworkData): Promise<void> {
    try {
        await ensureDataDirectory();
        await fs.writeFile(NETWORK_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (error) {
        console.error("Erro ao salvar rede:", error);
        throw new Error(`Falha ao salvar rede: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    }
}

export async function loadNetwork(): Promise<NetworkData | null> {
    try {
        await fs.access(NETWORK_FILE);
        const fileContent = await fs.readFile(NETWORK_FILE, "utf-8");
        const networkData: NetworkData = JSON.parse(fileContent);
        return networkData;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            return null;
        }
        console.error("Erro ao carregar rede:", error);
        throw new Error(`Falha ao carregar rede: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    }
}

export async function resetNetwork(): Promise<void> {
    try {
        await fs.unlink(NETWORK_FILE);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            return;
        }
        console.error("Erro ao resetar rede:", error);
        throw new Error(`Falha ao resetar rede: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    }
}

