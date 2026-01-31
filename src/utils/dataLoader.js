
export const fetchGeoJSON = async (filename) => {
    try {
        const response = await fetch(`/data/${filename}?t=${Date.now()}`);
        if (!response.ok) throw new Error(`Failed to fetch ${filename}`);
        return await response.json();
    } catch (error) {
        console.error(error);
        return null;
    }
};

export const fetchJSON = async (filename) => {
    try {
        const response = await fetch(`/data/${filename}`);
        if (!response.ok) throw new Error(`Failed to fetch ${filename}`);
        return await response.json();
    } catch (error) {
        console.error(error);
        return [];
    }
};

// Start data loading
export const loadAllData = async () => {
    const layerFiles = [
        'curvas_nivel_1_50000.geojson',
        'ocorrencias_consolidated.geojson',
        'rodovia_br101_trecho_ViaSul.geojson',
        'trechos_inundacao.geojson'
    ];

    const layers = {};
    for (const file of layerFiles) {
        const name = file.split('.')[0];
        const data = await fetchGeoJSON(`${file}?t=${Date.now()}`);

        // Normalize properties if it's the consolidated occurrences file
        if (name === 'ocorrencias_consolidated' && data && data.features) {
            data.features = data.features.map(f => {
                const newProps = { ...f.properties };
                // Map the long keys to simple keys
                const prefix = 'historico_ocorrencias_demonstrativo — Sheet1_';
                Object.keys(newProps).forEach(key => {
                    if (key.startsWith(prefix)) {
                        const simpleKey = key.replace(prefix, '');
                        newProps[simpleKey] = newProps[key];
                    }
                });
                // Ensure id_ocorrencia is available
                newProps.id_ocorrencia = newProps.id_ocorrencia || newProps.objectid;
                f.properties = newProps;
                return f;
            });
        }

        layers[name] = data;
    }

    // Extract history directly from the features of the consolidated file
    let historyFull = [];
    if (layers.ocorrencias_consolidated) {
        historyFull = layers.ocorrencias_consolidated.features.map(f => f.properties);
    } else {
        historyFull = await fetchJSON('history_full.json');
    }

    return { layers, historyFull };
};
