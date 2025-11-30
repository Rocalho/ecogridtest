export function isPositive(number?: number | null) {
    return number !== undefined && number !== null && number > 0;
}