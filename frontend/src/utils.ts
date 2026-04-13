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
    yellow: { bg: 'bg-yellow-100', hover: 'hover:bg-yellow-200' },
    red: { bg: 'bg-red-100', hover: 'hover:bg-red-200' },
    green: { bg: 'bg-green-200', hover: 'hover:bg-green-300' },
};

interface ActiveFilter {
    column: string;
    filter_type: string;
    value: string | string[];
    color?: string;
    highlight_type?: string;
}

function matchesSingleValue(recordVal: string, filterVal: string, filterType: string): boolean {
    const rv = recordVal.toLowerCase();
    const fv = filterVal.toLowerCase();
    switch (filterType) {
        case 'contains': return rv.includes(fv);
        case 'does_not_equal': return rv !== fv;
        case 'does_not_contain': return !rv.includes(fv);
        default: return rv === fv;
    }
}

function recordMatchesFilter(record: any, f: ActiveFilter): boolean {
    const recordVal = record[f.column] || '';
    const values = Array.isArray(f.value) ? f.value : [f.value];
    // For negative filters (does_not_equal/contain), ALL values must not match (AND)
    // For positive filters (equals/contains), ANY value can match (OR)
    if (f.filter_type === 'does_not_equal' || f.filter_type === 'does_not_contain') {
        return values.every(v => matchesSingleValue(recordVal, v, f.filter_type));
    }
    return values.some(v => matchesSingleValue(recordVal, v, f.filter_type));
}

export function getRowColorClass(record: any, activeFilters?: ActiveFilter[]): string {
    // Check user-defined colored filters first (last matching wins, skip cell-only)
    if (activeFilters) {
        for (let i = activeFilters.length - 1; i >= 0; i--) {
            const f = activeFilters[i];
            if (f.highlight_type === 'cell') continue;
            if (f.color && FILTER_ROW_COLORS[f.color] && recordMatchesFilter(record, f)) {
                const c = FILTER_ROW_COLORS[f.color];
                return `${c.bg} ${c.hover} text-gray-900`;
            }
        }
    }

    return 'bg-white hover:bg-gray-100 text-gray-900';
}

export function getRowBgClass(record: any, activeFilters?: ActiveFilter[]): string {
    if (activeFilters) {
        for (let i = activeFilters.length - 1; i >= 0; i--) {
            const f = activeFilters[i];
            if (f.highlight_type === 'cell') continue;
            if (f.color && FILTER_ROW_COLORS[f.color] && recordMatchesFilter(record, f)) {
                return FILTER_ROW_COLORS[f.color].bg;
            }
        }
    }
    return 'bg-white';
}

export function getCellColorClass(
    column: string,
    record: any,
    activeFilters?: ActiveFilter[]
): string {
    // Check cell-only user filters (last matching wins)
    if (activeFilters) {
        for (let i = activeFilters.length - 1; i >= 0; i--) {
            const f = activeFilters[i];
            if (f.highlight_type === 'cell' && f.column === column && f.color && FILTER_ROW_COLORS[f.color] && recordMatchesFilter(record, f)) {
                const c = FILTER_ROW_COLORS[f.color];
                return `${c.bg} text-gray-900 font-bold`;
            }
        }
    }

    return '';
}
