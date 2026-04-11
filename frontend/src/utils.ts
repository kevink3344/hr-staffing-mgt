export function getRowColorClass(record: any): string {
    // Red for Pos End = 2026-06-30
    if (record.pos_end === '2026-06-30') {
        return 'bg-red-50 hover:bg-red-100';
    }

    // Yellow for Contract = "T" or "TR"
    if (record.contract === 'T' || record.contract === 'TR') {
        return 'bg-yellow-50 hover:bg-yellow-100';
    }

    return 'bg-white hover:bg-gray-50';
}

export function getCellColorClass(
    column: string,
    record: any
): string {
    // Green for Pos Start = 2026-07-01
    if (column === 'pos_start' && record.pos_start === '2026-07-01') {
        return 'bg-green-100 text-green-900';
    }

    return '';
}
