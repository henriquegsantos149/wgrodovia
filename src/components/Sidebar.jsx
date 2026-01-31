
import React from 'react';
import { FileText, Loader2, X } from 'lucide-react';

const Sidebar = ({ history, loading, onSelect, onAddClick, isOpen, onClose }) => {
    // Responsive Classes
    // Mobile: fixed, full height, width 80%, slide behavior
    // Desktop: relative, fixed width (w-96), always visible
    const sidebarClasses = `
        fixed inset-y-0 left-0 z-[500] w-80 bg-white shadow-xl flex flex-col border-r border-slate-200
        transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:w-96 md:z-20
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `;

    if (loading) {
        return (
            <div className={`w-96 bg-white shadow-xl z-20 flex flex-col border-r border-slate-200 md:block hidden`}>
                <div className="p-4 bg-slate-800 text-white shadow-md">
                    <div className="animate-pulse h-6 w-32 bg-slate-600 rounded mb-2"></div>
                    <div className="animate-pulse h-3 w-48 bg-slate-600 rounded"></div>
                </div>
                <div className="flex-1 flex items-center justify-center text-slate-400">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                        <p>Carregando dados...</p>
                    </div>
                </div>
            </div>
        );
    }

    const getStatusStyle = (status) => {
        if (!status) return "bg-slate-50 border-slate-200";
        const s = status.toLowerCase();
        if (s.includes('não resolvido')) return "bg-red-50 border-red-200 hover:bg-red-100";
        if (s.includes('em andamento')) return "bg-amber-50 border-amber-200 hover:bg-amber-100";
        return "bg-white border-slate-200 hover:bg-slate-50";
    };

    const getStatusBadge = (status) => {
        if (!status) return null;
        const s = status.toLowerCase();
        let colorClass = "bg-slate-100 text-slate-600";
        if (s.includes('resolvido')) colorClass = "bg-green-100 text-green-700";
        if (s.includes('não resolvido')) colorClass = "bg-red-100 text-red-700";
        if (s.includes('em andamento')) colorClass = "bg-amber-100 text-amber-700";

        return (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${colorClass}`}>
                {status}
            </span>
        );
    };

    // Sort: Newest to Oldest (Date Descending)
    const sortedHistory = [...history].sort((a, b) => {
        const parseDate = (dateStr) => {
            if (!dateStr) return 0;
            const str = String(dateStr).trim();

            const ptBRMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
            if (ptBRMatch) {
                const day = parseInt(ptBRMatch[1], 10);
                const month = parseInt(ptBRMatch[2], 10) - 1;
                const year = parseInt(ptBRMatch[3], 10);

                let hour = 0, minute = 0;
                const timeMatch = str.match(/(\d{1,2}):(\d{1,2})/);
                if (timeMatch) {
                    hour = parseInt(timeMatch[1], 10);
                    minute = parseInt(timeMatch[2], 10);
                }
                return new Date(year, month, day, hour, minute).getTime();
            }

            const timestamp = Date.parse(str);
            return isNaN(timestamp) ? 0 : timestamp;
        };

        const dateA = parseDate(a.data_hora);
        const dateB = parseDate(b.data_hora);

        return dateB - dateA;
    });

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[450] md:hidden backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            <div className={sidebarClasses}>
                <div className="p-4 bg-slate-800 text-white shadow-md z-10 flex-shrink-0">
                    <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                            <FileText className="w-6 h-6 text-blue-400" />
                            <h1 className="text-xl font-bold tracking-wide">Histórico</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={onAddClick}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1.5 rounded flex items-center gap-1 transition-colors"
                                title="Adicionar nova ocorrência"
                            >
                                <span className="font-bold text-lg leading-none">+</span>
                                <span>Novo</span>
                            </button>
                            {/* Close Button (Mobile Only) */}
                            <button
                                onClick={onClose}
                                className="md:hidden text-slate-400 hover:text-white"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>
                    <p className="text-xs text-slate-400">{history.length} registros encontrados</p>
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-100 p-2 space-y-2">
                    {sortedHistory.map((item, index) => (
                        <div
                            key={index}
                            onClick={() => onSelect(item)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all shadow-sm ${getStatusStyle(item.status)}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-semibold text-slate-500">
                                    {item.tipo || 'Ocorrência'}
                                </span>
                                {getStatusBadge(item.status)}
                            </div>

                            <h3 className="text-sm font-bold text-slate-800 leading-tight mb-1">
                                ID: {item.id_ocorrencia} - {item.tipo}
                            </h3>

                            <div className="flex justify-between items-end mt-2">
                                <span className="text-xs text-slate-400 font-mono">{item.data_hora}</span>
                                {item.Local && <span className="text-xs text-slate-500 bg-white/50 px-1 rounded">{item.Local}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default Sidebar;
