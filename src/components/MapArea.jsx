
import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, LayersControl, GeoJSON, useMap, useMapEvents } from 'react-leaflet';
import { renderToString } from 'react-dom/server';
import { Calendar, AlertCircle, CheckCircle, Clock, MapPin, AlertTriangle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Helper to fly to location
const MapController = ({ center, zoom, activeOccurrence, layerRefs }) => {
    const map = useMap();

    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom || 14, { duration: 1.5 });
        }
    }, [center, zoom, map]);

    useEffect(() => {
        // Find layer for active occurrence
        // Since we aggregate by objectid, we might need to find the layer that represents that objectid
        // However, pointToLayer creates one marker per feature.
        // Wait, if we have stacked markers, the layerRefs might strictly map ID -> Layer.
        // But features at same location overlap. Since we use Z-index sorting, the active one is on top.
        // We just need to open the popup of the *top* marker or the *active* marker.

        if (activeOccurrence && activeOccurrence.id_ocorrencia) {
            const layer = layerRefs.current[activeOccurrence.id_ocorrencia];
            if (layer) {
                // The popup content is dynamic, so we might need to re-bind it or just open it.
                // Ideally onEachFeature already bound it.
                setTimeout(() => {
                    layer.openPopup();
                }, 500);
            }
        }
    }, [activeOccurrence, layerRefs]);

    return null;
};

// Helper for marker colors
const getMarkerColor = (status) => {
    if (!status) return "#94a3b8";
    const s = status.toLowerCase();
    if (s.includes('não') || s.includes('nao') || s.includes('pendente')) return "#ef4444";
    if (s.includes('em andamento')) return "#f59e0b";
    if (s.includes('resolvido')) return "#22c55e";
    return "#3b82f6";
};

// Popup Component for rendering
const PopupContent = ({ features, activeOccurrence }) => {
    const activeId = activeOccurrence?.id_ocorrencia;

    return (
        <div className="font-sans text-sm min-w-[300px] max-w-[320px]">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-3 rounded-t-lg shadow-md sticky top-0 z-10">
                <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-base truncate pr-2" title={features[0].properties.Local}>
                        {features[0].properties.Local || 'Local'}
                    </h3>
                    <div className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full">
                        <MapPin size={12} className="text-blue-300" />
                        <span className="text-xs font-medium">{features.length}</span>
                    </div>
                </div>
                {features[0].properties.sigla_adm && (
                    <p className="text-xs text-slate-400 opacity-80">{features[0].properties.sigla_adm}</p>
                )}
            </div>

            <div className="max-h-[320px] overflow-y-auto p-2 bg-slate-50 space-y-2 custom-scrollbar">
                {features.map((f, idx) => {
                    const p = f.properties;
                    const status = p.status || 'Não informado';
                    const isActive = activeId === p.id_ocorrencia;

                    let StatusIcon = AlertCircle;
                    let statusColor = "text-slate-500";
                    const s = status.toLowerCase();
                    // Check negative/pending status FIRST to avoid 'resolvido' matching 'não resolvido'
                    if (s.includes('não') || s.includes('nao') || s.includes('pendente')) {
                        StatusIcon = AlertTriangle;
                        statusColor = "text-red-500";
                    }
                    else if (s.includes('em andamento')) {
                        StatusIcon = Clock;
                        statusColor = "text-amber-500";
                    }
                    else if (s.includes('resolvido')) {
                        StatusIcon = CheckCircle;
                        statusColor = "text-green-500";
                    }

                    return (
                        <div
                            key={idx}
                            className={`p-3 rounded-lg border shadow-sm transition-all duration-200 ${isActive
                                ? 'bg-blue-50/80 border-blue-400 ring-1 ring-blue-400'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-1.5">
                                    <StatusIcon size={14} className={statusColor} />
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>
                                        {status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 text-slate-400" title="Data">
                                    <Calendar size={12} />
                                    <span className="text-[10px] font-mono">{p.data_hora?.split(' ')[0] || '-'}</span>
                                </div>
                            </div>

                            <h4 className="font-bold text-slate-800 text-sm mb-1 line-clamp-2">
                                #{p.id_ocorrencia} - {p.tipo}
                            </h4>

                            {p.descricao_detalhada && (
                                <p className="text-xs text-slate-600 leading-relaxed italic border-l-2 border-slate-200 pl-2 my-1.5">
                                    "{p.descricao_detalhada}"
                                </p>
                            )}

                            {p.km && (
                                <div className="flex justify-end mt-1">
                                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                        KM {p.km}
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}

            </div>

            {/* 3D Model Button for ID 414 */}
            {features.some(f => String(f.properties.objectid) === '414') && (
                <div
                    className="p-2 bg-slate-100 border-t border-slate-200"
                    dangerouslySetInnerHTML={{
                        __html: `
                        <button 
                            onclick="window.trigger3DModal && window.trigger3DModal()" 
                            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded flex items-center justify-center gap-2 transition-colors text-xs uppercase tracking-wide shadow-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                            Visualizar Modelo 3D
                        </button>
                        `
                    }}
                />
            )}

            <div className="p-2 bg-slate-100 text-[10px] text-center text-slate-400 rounded-b-lg border-t border-slate-200">
                Total de Ocorrências: {features.length}
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                .leaflet-popup-content-wrapper { padding: 0; overflow: hidden; border-radius: 0.5rem; }
                .leaflet-popup-content { margin: 0; width: auto !important; }
            `}</style>
        </div>
    );
};

// Helper to handle map clicks
const MapClickHandler = ({ isAddingMode, onMapClick }) => {
    const map = useMap();

    // Optimize cursor behavior using useEffect instead of mousemove event
    useEffect(() => {
        if (isAddingMode) {
            map.getContainer().style.cursor = 'crosshair';
        } else {
            map.getContainer().style.cursor = '';
        }
        return () => {
            map.getContainer().style.cursor = ''; // Cleanup
        };
    }, [isAddingMode, map]);

    useMapEvents({
        click: (e) => {
            if (isAddingMode && onMapClick) {
                // Pass plain object to avoid Leaflet reference issues in State
                onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
            }
        }
    });

    return null;
};

const MapArea = ({ layers, activeOccurrence, isAddingMode, onMapClick, onOpen3D }) => {
    const layerRefs = useRef({});
    const [flyToPosition, setFlyToPosition] = useState(null);

    // Expose 3D trigger to window for popup buttons
    useEffect(() => {
        if (onOpen3D) {
            window.trigger3DModal = onOpen3D;
        }
        return () => {
            delete window.trigger3DModal;
        };
    }, [onOpen3D]);

    // Identify active occurrence location
    useEffect(() => {
        if (activeOccurrence && layers.ocorrencias_consolidated) {
            const feature = layers.ocorrencias_consolidated.features.find(f => f.properties.id_ocorrencia === activeOccurrence.id_ocorrencia);
            if (feature) {
                const [lng, lat] = feature.geometry.coordinates;
                setFlyToPosition([lat, lng]);
            }
        }
    }, [activeOccurrence, layers]);

    const onEachFeature = (feature, layer) => {
        // If adding mode is on, we might want to disable popup opening on click
        // But Leaflet handles bubble up. If we click a marker, it traps the event.
        // For now, let's allow it.

        const id = feature.properties.id_ocorrencia;
        if (id) {
            layerRefs.current[id] = layer;
        }

        // Aggregate features by roughly same location
        const sameLocationFeatures = layers.ocorrencias_consolidated.features.filter(f => {
            // Match by Coordinates (approx 11cm tolerance)
            const [lng1, lat1] = f.geometry.coordinates;
            const [lng2, lat2] = feature.geometry.coordinates;
            return Math.abs(lng1 - lng2) < 0.000001 && Math.abs(lat1 - lat2) < 0.000001;
        });

        // Sort: Newest First (Date Descending)
        sameLocationFeatures.sort((a, b) => {
            // REMOVED Active First logic to strictly respect Date sorting as requested

            const parseDate = (dateStr) => {
                if (!dateStr) return 0;
                const str = String(dateStr).trim();

                // Explicitly handle "DD/MM/YYYY" format (Brazil)
                // regex captures: 1=Day, 2=Month, 3=Year
                const ptBRMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                if (ptBRMatch) {
                    const day = parseInt(ptBRMatch[1], 10);
                    const month = parseInt(ptBRMatch[2], 10) - 1; // 0-indexed
                    const year = parseInt(ptBRMatch[3], 10);

                    let hour = 0, minute = 0;
                    // Look for time HH:MM
                    const timeMatch = str.match(/(\d{1,2}):(\d{1,2})/);
                    if (timeMatch) {
                        hour = parseInt(timeMatch[1], 10);
                        minute = parseInt(timeMatch[2], 10);
                    }

                    return new Date(year, month, day, hour, minute).getTime();
                }

                // Fallback to standard ISO parsing
                const timestamp = Date.parse(str);
                return isNaN(timestamp) ? 0 : timestamp;
            };

            const dateA = parseDate(a.properties.data_hora);
            const dateB = parseDate(b.properties.data_hora);

            return dateB - dateA;
        });

        // Render React Component to HTML string
        const popupHtml = renderToString(
            <PopupContent features={sameLocationFeatures} activeOccurrence={activeOccurrence} />
        );

        layer.bindPopup(popupHtml, {
            maxWidth: 350,
            className: 'custom-popup-clean' // We can target this in global css if needed, but styling is inline
        });
    };

    const inundationStyle = {
        color: "#3b82f6", // Blue
        fillColor: "#3b82f6",
        fillOpacity: 0.4,
        weight: 1
    };

    const countourStyle = {
        color: "#eab308", // Yellow-500
        weight: 1.5,
        opacity: 0.8
    };

    // Sort features to ensure "Não Resolvido" and Active markers are on top
    const sortedOcorrencias = React.useMemo(() => {
        if (!layers.ocorrencias_consolidated) return null;

        const features = [...layers.ocorrencias_consolidated.features];

        const getScore = (status) => {
            if (!status) return 0;
            const s = status.toLowerCase();
            // Check negative/pending status FIRST
            if (s.includes('não') || s.includes('nao') || s.includes('pendente')) return 2; // Top
            if (s.includes('em andamento')) return 1; // Middle
            if (s.includes('resolvido')) return 0; // Bottom
            return 0;
        };

        features.sort((a, b) => {
            // Active occurrence always on very top
            if (activeOccurrence) {
                if (a.properties.id_ocorrencia === activeOccurrence.id_ocorrencia) return 1;
                if (b.properties.id_ocorrencia === activeOccurrence.id_ocorrencia) return -1;
            }
            return getScore(a.properties.status) - getScore(b.properties.status);
        });

        return {
            ...layers.ocorrencias_consolidated,
            features: features
        };
    }, [layers.ocorrencias_consolidated, activeOccurrence]);

    return (
        <MapContainer
            center={[-29.6, -50.1]}
            zoom={10}
            minZoom={10}
            style={{ height: '100%', width: '100%' }}
        >
            <MapClickHandler isAddingMode={isAddingMode} onMapClick={onMapClick} />

            <MapController
                center={flyToPosition}
                activeOccurrence={activeOccurrence}
                layerRefs={layerRefs}
            />

            <LayersControl position="topright">
                <LayersControl.BaseLayer name="OpenStreetMap">
                    <TileLayer
                        attribution='&copy; Osm'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer checked name="Satélite">
                    <TileLayer
                        attribution='Tiles &copy; Esri'
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Claro">
                    <TileLayer
                        attribution='&copy; CartoDB'
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    />
                </LayersControl.BaseLayer>

                {layers.curvas_nivel_1_50000 && (
                    <LayersControl.Overlay name="Curvas de Nível">
                        <GeoJSON data={layers.curvas_nivel_1_50000} style={countourStyle} />
                    </LayersControl.Overlay>
                )}

                {layers.trechos_inundacao && (
                    <LayersControl.Overlay checked name="Trechos com risco de Inundações">
                        <GeoJSON data={layers.trechos_inundacao} style={inundationStyle} />
                    </LayersControl.Overlay>
                )}

                {layers.rodovia_br101_trecho_ViaSul && (
                    <LayersControl.Overlay checked name="Rodovia BR-101">
                        <GeoJSON data={layers.rodovia_br101_trecho_ViaSul} style={{ color: '#1e293b', weight: 4 }} />
                    </LayersControl.Overlay>
                )}

                {sortedOcorrencias && (
                    <LayersControl.Overlay checked name="Ocorrências">
                        <GeoJSON
                            key={`ocorrencias-${sortedOcorrencias.features.length}-${activeOccurrence ? activeOccurrence.id_ocorrencia : 'none'}`}
                            data={sortedOcorrencias}
                            onEachFeature={onEachFeature}
                            pointToLayer={(feature, latlng) => {
                                let status = feature.properties.status;
                                if (activeOccurrence && feature.properties.id_ocorrencia === activeOccurrence.id_ocorrencia) {
                                    status = activeOccurrence.status;
                                }
                                return L.circleMarker(latlng, {
                                    radius: 7,
                                    fillColor: getMarkerColor(status),
                                    color: "#fff",
                                    weight: 2,
                                    opacity: 1,
                                    fillOpacity: 1
                                });
                            }}
                        />
                    </LayersControl.Overlay>
                )}
            </LayersControl>
        </MapContainer>
    );
};

export default MapArea;
