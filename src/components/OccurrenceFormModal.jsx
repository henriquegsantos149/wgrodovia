
import React, { useState } from 'react';
import { X, Save } from 'lucide-react';

const OccurrenceFormModal = ({ isOpen, onClose, onSave, coordinates }) => {
    const [formData, setFormData] = useState({
        tipo: 'Novo Registro',
        status: 'Não Resolvido',
        descricao: '',
        km: '',
        local: 'Rodovia BR-101',
        data: new Date().toISOString().slice(0, 16) // Default to now
    });

    if (!isOpen || !coordinates) return null;

    const handleSubmit = (e) => {
        // ... same logic
        e.preventDefault();
        const dateObj = new Date(formData.data);
        const formattedDate = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()} ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;

        onSave({
            ...formData,
            data_hora: formattedDate,
            coordinates
        });
        onClose();
        setFormData({
            tipo: 'Novo Registro',
            status: 'Não Resolvido',
            descricao: '',
            km: '',
            local: 'Rodovia BR-101',
            data: new Date().toISOString().slice(0, 16)
        });
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-2xl w-96 max-w-full m-4 overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
                <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Save size={18} />
                        Nova Ocorrência
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo</label>
                        <select
                            className="w-full p-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.tipo}
                            onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                        >
                            <option>Novo Registro</option>
                            <option>Deslizamento</option>
                            <option>Alagamento</option>
                            <option>Obstrução na Pista</option>
                            <option>Sinalização Danificada</option>
                            <option>Acidente</option>
                            <option>Obras de Manutenção</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
                            <select
                                className="w-full p-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="Não Resolvido">Não Resolvido</option>
                                <option value="Em Andamento">Em Andamento</option>
                                <option value="Resolvido">Resolvido</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">KM Local</label>
                            <input
                                type="text"
                                className="w-full p-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Ex: 45.2"
                                value={formData.km}
                                onChange={(e) => setFormData({ ...formData, km: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Data e Hora</label>
                        <input
                            type="datetime-local"
                            className="w-full p-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.data}
                            onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Descrição</label>
                        <textarea
                            className="w-full p-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none"
                            placeholder="Descreva a ocorrência..."
                            value={formData.descricao}
                            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                        ></textarea>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded transition-colors flex justify-center items-center gap-2"
                        >
                            <Save size={16} />
                            Salvar Ocorrência
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OccurrenceFormModal;
