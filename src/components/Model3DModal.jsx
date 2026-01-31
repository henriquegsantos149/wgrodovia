
import React from 'react';
import { X, Box } from 'lucide-react';
import ModelViewer from './ModelViewer';

const Model3DModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 w-full h-full max-w-6xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col border border-slate-700 overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="bg-slate-800 p-4 flex justify-between items-center border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <Box className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-lg">Modelo Digital 3D</h2>
                            <p className="text-slate-400 text-xs">Visualização interativa - Use o mouse para girar e dar zoom</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Viewer Content */}
                <div className="flex-1 relative bg-black">
                    <ModelViewer
                        modelPath="/data/3d/25_04_2025.obj"
                        mtlPath="/data/3d/25_04_2025.mtl"
                    />
                </div>
            </div>
        </div>
    );
};

export default Model3DModal;
