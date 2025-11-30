import { create } from "zustand";
import { LogLevel, LogEntry } from "../types";

export type { LogLevel, LogEntry };

interface LogStore {
    logs: LogEntry[];
    maxLogs: number;

    addLog: (message: string, level?: LogLevel, source?: string) => void;
    clearLogs: () => void;
    getRecentLogs: (count?: number) => LogEntry[];
    getLogsByLevel: (level: LogLevel) => LogEntry[];
    getLogsBySource: (source: string) => LogEntry[];
}

let logIdCounter = 1;

export const useLogStore = create<LogStore>((set, get) => ({
    logs: [],
    maxLogs: 100,

    addLog: (message, level = "info", source) => {
        const log: LogEntry = {
            id: `log-${logIdCounter++}`,
            timestamp: new Date(),
            level,
            message,
            source,
        };

        set((state) => {
            const newLogs = [log, ...state.logs].slice(0, state.maxLogs);
            return { logs: newLogs };
        });
    },

    clearLogs: () => {
        set({ logs: [] });
    },

    getRecentLogs: (count = 10) => {
        return get().logs.slice(0, count);
    },

    getLogsByLevel: (level) => {
        return get().logs.filter((log) => log.level === level);
    },

    getLogsBySource: (source) => {
        return get().logs.filter((log) => log.source === source);
    },
}));

