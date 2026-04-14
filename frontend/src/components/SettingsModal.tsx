import { useState, useEffect } from 'react';

const FONT_OPTIONS = {
    text: [
        { label: 'JetBrains Mono', value: "'JetBrains Mono', monospace" },
        { label: 'Inter', value: "'Inter', sans-serif" },
        { label: 'IBM Plex Sans', value: "'IBM Plex Sans', sans-serif" },
        { label: 'Source Sans 3', value: "'Source Sans 3', sans-serif" },
        { label: 'System Default', value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
    ],
    numbers: [
        { label: 'JetBrains Mono', value: "'JetBrains Mono', monospace" },
        { label: 'Fira Code', value: "'Fira Code', monospace" },
        { label: 'IBM Plex Mono', value: "'IBM Plex Mono', monospace" },
        { label: 'System Monospace', value: "monospace" },
    ],
};

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    isDark: boolean;
}

export function SettingsModal({ isOpen, onClose, isDark }: SettingsModalProps) {
    const [textFont, setTextFont] = useState(() => localStorage.getItem('fontText') || FONT_OPTIONS.text[0].value);
    const [numbersFont, setNumbersFont] = useState(() => localStorage.getItem('fontNumbers') || FONT_OPTIONS.numbers[0].value);

    useEffect(() => {
        document.documentElement.style.setProperty('--font-text', textFont);
        document.documentElement.style.setProperty('--font-numbers', numbersFont);
    }, [textFont, numbersFont]);

    const handleTextFont = (value: string) => {
        setTextFont(value);
        localStorage.setItem('fontText', value);
    };

    const handleNumbersFont = (value: string) => {
        setNumbersFont(value);
        localStorage.setItem('fontNumbers', value);
    };

    if (!isOpen) return null;

    const bg = isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-800';
    const labelCls = isDark ? 'text-gray-300' : 'text-gray-700';
    const selectCls = isDark
        ? 'bg-gray-700 text-white border-gray-600 focus:border-blue-500'
        : 'bg-white text-gray-900 border-gray-300 focus:border-blue-500';

    return (
        <div className="fixed inset-0 z-[60]">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-2px border-2 shadow-2xl p-6 z-50 ${bg}`}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className={`text-lg font-bold font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>Settings</h2>
                    <button onClick={onClose} className={`text-2xl leading-none ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>×</button>
                </div>

                <div className="space-y-5">
                    <div>
                        <label className={`block text-xs font-bold font-mono tracking-wider mb-2 ${labelCls}`}>TEXT FONT</label>
                        <select
                            value={textFont}
                            onChange={(e) => handleTextFont(e.target.value)}
                            className={`w-full px-3 py-2 rounded-2px border-2 text-sm font-mono outline-none ${selectCls}`}
                        >
                            {FONT_OPTIONS.text.map((f) => (
                                <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
                            ))}
                        </select>
                        <p className={`mt-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`} style={{ fontFamily: textFont }}>
                            Preview: The quick brown fox jumps over the lazy dog
                        </p>
                    </div>

                    <div>
                        <label className={`block text-xs font-bold font-mono tracking-wider mb-2 ${labelCls}`}>NUMBERS / CODE FONT</label>
                        <select
                            value={numbersFont}
                            onChange={(e) => handleNumbersFont(e.target.value)}
                            className={`w-full px-3 py-2 rounded-2px border-2 text-sm font-mono outline-none ${selectCls}`}
                        >
                            {FONT_OPTIONS.numbers.map((f) => (
                                <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
                            ))}
                        </select>
                        <p className={`mt-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`} style={{ fontFamily: numbersFont }}>
                            Preview: 0123456789 $1,234.56 #A1B2C3
                        </p>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-600">
                    <button
                        onClick={() => { handleTextFont(FONT_OPTIONS.text[0].value); handleNumbersFont(FONT_OPTIONS.numbers[0].value); }}
                        className={`text-xs font-mono font-bold ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        Reset to defaults
                    </button>
                </div>
            </div>
        </div>
    );
}
