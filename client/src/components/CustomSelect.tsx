import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
    value: string;
    label: string;
    className?: string; // For coloring the text or adding specifics
}

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
    className?: string;
    required?: boolean;
}

export default function CustomSelect({
    value,
    onChange,
    options,
    placeholder = 'Select option',
    className = '',
    required = false
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                type="button"
                className={`w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-left flex items-center justify-between focus:outline-none focus:border-blue-500 transition-colors ${selectedOption ? 'text-white' : 'text-zinc-500'}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={selectedOption?.className}>{selectedOption ? selectedOption.label : placeholder}</span>
                <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl max-h-60 overflow-auto">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-zinc-800 flex items-center justify-between ${option.value === value ? 'text-blue-400 bg-zinc-800/50' : 'text-zinc-300'}`}
                            onClick={() => handleSelect(option.value)}
                        >
                            <span className={option.className}>{option.label}</span>
                            {option.value === value && <Check className="w-4 h-4" />}
                        </button>
                    ))}
                </div>
            )}
            {/* Hidden input for HTML form validation if needed, though usually handled by state */}
            {required && (
                <input
                    type="text"
                    required
                    value={value}
                    onChange={() => { }}
                    className="absolute opacity-0 pointer-events-none -z-10 bottom-0 left-0 h-0 w-0"
                    tabIndex={-1}
                />
            )}
        </div>
    );
}
