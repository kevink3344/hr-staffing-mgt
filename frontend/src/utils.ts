// Color classes for user-defined filter row colors
const FILTER_ROW_COLORS: Record<string, { bg: string; hover: string }> = {
    blue: { bg: 'bg-blue-100', hover: 'hover:bg-blue-200' },
    purple: { bg: 'bg-purple-100', hover: 'hover:bg-purple-200' },
    pink: { bg: 'bg-pink-100', hover: 'hover:bg-pink-200' },
    orange: { bg: 'bg-orange-100', hover: 'hover:bg-orange-200' },
    teal: { bg: 'bg-teal-100', hover: 'hover:bg-teal-200' },
    cyan: { bg: 'bg-cyan-100', hover: 'hover:bg-cyan-200' },
    indigo: { bg: 'bg-indigo-100', hover: 'hover:bg-indigo-200' },
    rose: { bg: 'bg-rose-100', hover: 'hover:bg-rose-200' },
    lime: { bg: 'bg-lime-100', hover: 'hover:bg-lime-200' },
    amber: { bg: 'bg-amber-100', hover: 'hover:bg-amber-200' },
};

interface ActiveFilter {
    column: string;
    filter_type: string;
    value: string;
    color?: string;
}

function recordMatchesFilter(record: any, f: ActiveFilter): boolean {
    const recordVal = (record[f.column] || '').toLowerCase();
    const filterVal = f.value.toLowerCase();
    switch (f.filter_type) {
        case 'contains': return recordVal.includes(filterVal);
        case 'does_not_equal': return recordVal !== filterVal;
        case 'does_not_contain': return !recordVal.includes(filterVal);
        default: return recordVal === filterVal;
    }
}

export function getRowColorClass(record: any, activeFilters?: ActiveFilter[]): string {
    // Check user-defined colored filters first (last matching wins)
    if (activeFilters) {
        for (let i = activeFilters.length - 1; i >= 0; i--) {
            const f = activeFilters[i];
            if (f.color && FILTER_ROW_COLORS[f.color] && recordMatchesFilter(record, f)) {
                const c = FILTER_ROW_COLORS[f.color];
                return `${c.bg} ${c.hover} text-gray-900`;
            }
        }
    }

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
