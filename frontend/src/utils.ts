export function getRowColorClass(record: any): string {
    // Red for Pos End = 2026-06-30
    if (record.pos_end === '2026-06-30') {
        return 'bg-red-100 hover:bg-red-200 text-gray-900';
    }

    // Yellow for Contract = "T" or "TR"
    if (record.contract === 'T' || record.contract === 'TR') {
        return 'bg-yellow-100 hover:bg-yellow-200 text-gray-900';
    }

    return 'bg-white hover:bg-gray-100 text-gray-900';
}

export function getCellColorClass(
    column: string,
    record: any
): string {
    // Green for Pos Start = 2026-07-01
    if (column === 'pos_start' && record.pos_start === '2026-07-01') {
        return 'bg-green-200 text-green-900 font-bold';
    }

    return '';
}
