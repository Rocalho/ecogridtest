import { isPositive } from "@/lib/utils/isPositive";

type kpiCardType = {
    label: string;
    value: number;
    varianceLabel?: number;
}


export default function KpiCard({ label, value, varianceLabel }: kpiCardType) {
    const isPositiveChange = isPositive(varianceLabel);

    const variantColor = isPositiveChange ? "text-green-600" : "text-red-600";

    const formattedVariance =
        varianceLabel !== undefined && varianceLabel !== null && varianceLabel === 0
            ? "0%"
            : `${isPositiveChange ? "+" : "-"} ${Math.abs(varianceLabel ?? 0).toFixed(1)}%`;

    // Garantir que o valor não seja NaN ou undefined
    const safeValue = (typeof value === 'number' && !isNaN(value) && isFinite(value))
        ? value
        : 0;

    return (
        <article className="p-4 flex flex-col text-slate-900 gap-2 bg-white rounded-lg border border-gray-100">
            <p className="uppercase">{label}</p>
            <h2 className="text-3xl font-bold">{safeValue}</h2>
            {varianceLabel !== undefined && varianceLabel !== null && <p className={`text-sm ${variantColor}`}>{formattedVariance}</p>}
        </article>
    )
}