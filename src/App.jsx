
import React, { useState, useEffect } from 'react';
import MapArea from './components/MapArea';
import Sidebar from './components/Sidebar';
import { loadAllData } from './utils/dataLoader';
import { Loader2 } from 'lucide-react';

import OccurrenceFormModal from './components/OccurrenceFormModal';
import Model3DModal from './components/Model3DModal';

function App() {
  const [layers, setLayers] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeOccurrence, setActiveOccurrence] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);

  // New State for Adding
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCoordinates, setNewCoordinates] = useState(null);

  // Mobile Sidebar State
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // 3D Model State
  const [is3DModalOpen, setIs3DModalOpen] = useState(false);

  useEffect(() => {
    const initData = async () => {
      const { layers, historyFull } = await loadAllData();
      setLayers(layers);
      if (historyFull && historyFull.length > 0) {
        setHistoryItems(historyFull);
      }
      setLoading(false);
    };
    initData();
  }, []);

  const handleAddClick = () => {
    setIsAddingMode(!isAddingMode);
    setActiveOccurrence(null); // Deselect current item
    setIsMobileSidebarOpen(false); // Close sidebar on mobile when adding
  };

  const handleMapClick = (latlng) => {
    setNewCoordinates(latlng);
    setIsModalOpen(true);
    setIsAddingMode(false); // Turn off adding mode after picking a point
  };

  const handleSaveOccurrence = (formData) => {
    const newId = Math.max(...historyItems.map(i => parseInt(i.id_ocorrencia) || 0)) + 1;

    const newProperties = {
      id_ocorrencia: newId,
      objectid: newId, // Keep consistent
      tipo: formData.tipo,
      status: formData.status,
      descricao_detalhada: formData.descricao,
      km: formData.km,
      Local: formData.local,
      data_hora: formData.data_hora
    };

    // Update History
    const newHistory = [newProperties, ...historyItems];
    setHistoryItems(newHistory);

    // Update Map Layers
    if (layers.ocorrencias_consolidated) {
      const newFeature = {
        type: "Feature",
        properties: newProperties,
        geometry: {
          type: "Point",
          coordinates: [formData.coordinates.lng, formData.coordinates.lat]
        }
      };

      const updatedFeatures = [...layers.ocorrencias_consolidated.features, newFeature];

      setLayers(prev => ({
        ...prev,
        ocorrencias_consolidated: {
          ...prev.ocorrencias_consolidated,
          features: updatedFeatures
        }
      }));
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 relative">
      <OccurrenceFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveOccurrence}
        coordinates={newCoordinates}
      />

      {/* 3D Model Modal */}
      <Model3DModal
        isOpen={is3DModalOpen}
        onClose={() => setIs3DModalOpen(false)}
      />

      {/* Adding Mode Indicator Overlay */}
      {isAddingMode && (
        <div className="absolute top-16 md:top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-blue-600 text-white px-4 py-2 rounded-full shadow-xl animate-pulse font-bold border-2 border-white pointer-events-none text-xs md:text-base w-11/12 md:w-auto text-center">
          Modo de Adição: Toque no mapa para inserir
        </div>
      )}

      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileSidebarOpen(true)}
        className="md:hidden absolute top-4 left-4 z-[400] bg-white p-2 rounded shadow-lg border border-slate-200 text-slate-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
      </button>

      {/* Sidebar - Responsive */}
      <Sidebar
        history={historyItems}
        loading={loading}
        onSelect={(item) => {
          setActiveOccurrence(item);
          setIsMobileSidebarOpen(false); // Auto close on selection (mobile)
        }}
        onAddClick={handleAddClick}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Map Area */}
      <div className="flex-1 relative transition-colors">
        <MapArea
          layers={layers}
          activeOccurrence={activeOccurrence}
          isAddingMode={isAddingMode}
          onMapClick={handleMapClick}
          onOpen3D={() => setIs3DModalOpen(true)}
        />
      </div>
    </div>
  );
}

export default App;
