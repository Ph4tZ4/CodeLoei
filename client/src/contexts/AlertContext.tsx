import React, { createContext, useContext, useState, useRef, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface AlertOptions {
    title: string;
    message?: string;
    type?: 'danger' | 'success' | 'info' | 'warning';
}

interface AlertContextType {
    alert: (title: string, message?: string, type?: 'danger' | 'success' | 'info' | 'warning') => Promise<void>;
    confirm: (title: string, message?: string, type?: 'danger' | 'info') => Promise<boolean>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};

interface AlertProviderProps {
    children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<'alert' | 'confirm'>('alert');
    const [options, setOptions] = useState<AlertOptions>({ title: '', message: '', type: 'info' });

    // Resolvers for Promises
    const alertResolve = useRef<(() => void) | null>(null);
    const confirmResolve = useRef<((value: boolean) => void) | null>(null);

    const alert = (title: string, message?: string, type: 'danger' | 'success' | 'info' | 'warning' = 'info') => {
        setOptions({ title, message, type });
        setMode('alert');
        setIsOpen(true);
        return new Promise<void>((resolve) => {
            alertResolve.current = resolve;
        });
    };

    const confirm = (title: string, message?: string, type: 'danger' | 'info' = 'danger') => {
        setOptions({ title, message, type });
        setMode('confirm');
        setIsOpen(true);
        return new Promise<boolean>((resolve) => {
            confirmResolve.current = resolve;
        });
    };

    const handleClose = (result?: boolean) => {
        setIsOpen(false);
        if (mode === 'alert') {
            if (alertResolve.current) alertResolve.current();
        } else {
            if (confirmResolve.current) confirmResolve.current(result || false);
        }
    };

    // Icon helper
    const getIcon = () => {
        switch (options.type) {
            case 'danger':
            case 'warning':
                return <AlertTriangle className={`w-6 h-6 ${options.type === 'danger' ? 'text-red-500' : 'text-yellow-500'}`} />;
            case 'success':
                return <CheckCircle className="w-6 h-6 text-green-500" />;
            case 'info':
            default:
                return <Info className="w-6 h-6 text-blue-500" />;
        }
    };

    const getPrimaryButtonColor = () => {
        switch (options.type) {
            case 'danger':
                return 'bg-red-600 hover:bg-red-500';
            case 'success':
                return 'bg-green-600 hover:bg-green-500';
            case 'warning':
                return 'bg-yellow-600 hover:bg-yellow-500';
            case 'info':
            default:
                return 'bg-blue-600 hover:bg-blue-500';
        }
    };

    return (
        <AlertContext.Provider value={{ alert, confirm }}>
            {children}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-md shadow-2xl animate-modal-in overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                <div className={`p-2 rounded-lg bg-zinc-900 border border-zinc-800 shrink-0`}>
                                    {getIcon()}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-white mb-2">{options.title}</h3>
                                    {options.message && (
                                        <p className="text-zinc-400 text-sm leading-relaxed">{options.message}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-zinc-900/50 px-6 py-4 flex justify-end gap-3 border-t border-zinc-800">
                            {mode === 'confirm' && (
                                <button
                                    onClick={() => handleClose(false)}
                                    className="px-4 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                onClick={() => handleClose(true)}
                                className={`px-4 py-2 text-white rounded-lg text-sm font-bold shadow-lg shadow-black/20 ${getPrimaryButtonColor()} transition-colors`}
                            >
                                {mode === 'confirm' && options.type === 'danger' ? 'Confirm' : 'OK'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AlertContext.Provider>
    );
};
