"use client";

import { useLogStore, LogLevel } from "@/lib/store/logStore";
import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";

export default function RecentLogs({ maxLogs = 10 }: { maxLogs?: number }) {
    const { getRecentLogs } = useLogStore();
    const logs = getRecentLogs(maxLogs);

    const getLogIcon = (level: LogLevel) => {
        switch (level) {
            case "error":
                return <AlertCircle className="w-4 h-4 text-red-500" />;
            case "warning":
                return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
            case "success":
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            default:
                return <Info className="w-4 h-4 text-blue-500" />;
        }
    };

    const getLogColor = (level: LogLevel) => {
        switch (level) {
            case "error":
                return "text-red-700 bg-red-50 border-red-200";
            case "warning":
                return "text-yellow-700 bg-yellow-50 border-yellow-200";
            case "success":
                return "text-green-700 bg-green-50 border-green-200";
            default:
                return "text-gray-700 bg-gray-50 border-gray-200";
        }
    };

    const formatTime = (date: Date) => {
        return new Intl.DateTimeFormat("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        }).format(date);
    };

    if (logs.length === 0) {
        return (
            <div className="text-md text-gray-500 italic">
                Nenhum log ainda...
            </div>
        );
    }

    return (
        <ul className="space-y-2">
            {logs.map((log) => (
                <li
                    key={log.id}
                    className={`flex items-start gap-2 p-2 rounded border text-md ${getLogColor(log.level)}`}
                >
                    <div className="mt-0.5 flex-shrink-0">
                        {getLogIcon(log.level)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">{log.message}</span>
                            <span className="text-xs opacity-70 flex-shrink-0">
                                {formatTime(log.timestamp)}
                            </span>
                        </div>
                        {log.source && (
                            <span className="text-xs opacity-60 mt-0.5 block">
                                {log.source}
                            </span>
                        )}
                    </div>
                </li>
            ))}
        </ul>
    );
}

