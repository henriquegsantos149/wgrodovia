
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';

const ModelViewer = ({ modelPath, mtlPath }) => {
    const mountRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAutoRotating, setIsAutoRotating] = useState(true);
    const [activeTool, setActiveTool] = useState('none');
    const [drawingColor, setDrawingColor] = useState('#EF4444');
    const [textInput, setTextInput] = useState(null);
    const [debugInfo, setDebugInfo] = useState('');

    const controlsRef = useRef(null);
    const canvasRef = useRef(null);
    const isDrawingRef = useRef(false);
    const lastPosRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (!mountRef.current) return;

        // --- Setup Scene ---
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x111111); // Dark Gray, not pitch black

        // --- Setup Camera ---
        const camera = new THREE.PerspectiveCamera(
            50,
            mountRef.current.clientWidth / mountRef.current.clientHeight,
            0.1,
            2000
        );
        camera.position.set(0, 5, 10);

        // --- Setup Renderer ---
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true
        });
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        // Remove existing to prevent duplicates
        while (mountRef.current.firstChild) {
            mountRef.current.removeChild(mountRef.current.firstChild);
        }
        mountRef.current.appendChild(renderer.domElement);

        // --- Setup Controls ---
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.autoRotate = isAutoRotating;
        controlsRef.current = controls;

        // --- Setup Lights ---
        // Enhanced lighting setup to ensure visibility
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
        dirLight.position.set(10, 10, 10);
        scene.add(dirLight);

        const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
        fillLight.position.set(-10, 5, -10);
        scene.add(fillLight);

        // --- Load Assets ---
        const loadModel = async () => {
            try {
                setLoading(true);
                setError(null);

                const basePath = mtlPath.substring(0, mtlPath.lastIndexOf('/') + 1);

                // Load Materials
                const mtlLoader = new MTLLoader();
                mtlLoader.setPath(basePath);

                const materials = await new Promise((resolve, reject) => {
                    mtlLoader.load(
                        mtlPath.split('/').pop(),
                        (m) => {
                            m.preload();
                            resolve(m);
                        },
                        undefined,
                        (err) => {
                            console.warn("MTL Load Warning:", err);
                            // Resolve with default materials if MTL fails
                            resolve(null);
                        }
                    );
                });

                // Load Object
                const objLoader = new OBJLoader();
                if (materials) {
                    objLoader.setMaterials(materials);
                }
                objLoader.setPath(basePath);

                const object = await new Promise((resolve, reject) => {
                    objLoader.load(
                        modelPath.split('/').pop(),
                        resolve,
                        (xhr) => {
                            // console.log((xhr.loaded / xhr.total * 100) + '% loaded');
                        },
                        reject
                    );
                });

                // --- Geometry & Material Standardization ---
                const box = new THREE.Box3().setFromObject(object);
                const size = box.getSize(new THREE.Vector3());
                const center = box.getCenter(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);

                // Center logic
                object.position.x = -center.x;
                object.position.y = -center.y;
                object.position.z = -center.z;

                // Scale logic
                const targetSize = 10;
                if (maxDim > 0) {
                    object.scale.setScalar(targetSize / maxDim);
                }

                // MATERIAL SAFETY FIXES
                object.traverse((child) => {
                    if (child.isMesh) {
                        // Ensure material exists
                        if (!child.material) {
                            child.material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
                        }

                        // Handle Array of materials
                        const mats = Array.isArray(child.material) ? child.material : [child.material];

                        mats.forEach(mat => {
                            // 1. DoubleSide for visibility from all angles
                            mat.side = THREE.DoubleSide;

                            // 2. Reduce metallic effect which can cause black rendering without envMap
                            if (mat.metalness !== undefined) mat.metalness = 0.1;
                            if (mat.roughness !== undefined) mat.roughness = 0.8;

                            // 3. Ensure opacity
                            mat.transparent = false;
                            mat.opacity = 1.0;

                            // 4. Fallback color if map is missing but color is pitch black
                            if (!mat.map && mat.color && mat.color.getHex() === 0x000000) {
                                mat.color.setHex(0xaaaaaa); // Grey fallback
                            }

                            // 5. Ensure textures don't disappear at glancing angles
                            if (mat.map) {
                                mat.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
                            }
                        });
                    }
                });

                scene.add(object);
                setLoading(false);
                setDebugInfo(`Loaded: ${maxDim.toFixed(2)} units`);

            } catch (err) {
                console.error("Load Error:", err);
                setError("Falha ao carregar modelo: " + (err.message || "Erro desconhecido"));
                setLoading(false);
            }
        };

        loadModel();

        // --- Loop ---
        let animationId;
        const animate = () => {
            animationId = requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        // --- Resize ---
        const handleResize = () => {
            if (!mountRef.current) return;
            const w = mountRef.current.clientWidth;
            const h = mountRef.current.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);

            // Resize drawing canvas
            if (canvasRef.current) {
                canvasRef.current.width = w;
                canvasRef.current.height = h;
            }
        };
        window.addEventListener('resize', handleResize);

        // Initial canvas size
        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationId);
            renderer.dispose();
            if (mountRef.current && mountRef.current.innerHTML) {
                mountRef.current.innerHTML = '';
            }
        };
    }, [modelPath, mtlPath]);

    // Update AutoRotate
    useEffect(() => {
        if (controlsRef.current) {
            controlsRef.current.autoRotate = isAutoRotating;
        }
    }, [isAutoRotating]);


    // --- Interaction Handlers (Drawing/Text) ---
    // (Simplified integration for brevity while maintaining full functionality)
    const handleCanvasMouseDown = (e) => {
        // Prevent default behavior to avoid selection/drag issues
        if (e.cancelable) e.preventDefault();

        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();

        // Safer touch detection
        const hasTouch = e.touches && e.touches.length > 0;
        const clientX = hasTouch ? e.touches[0].clientX : e.clientX;
        const clientY = hasTouch ? e.touches[0].clientY : e.clientY;

        const x = clientX - rect.left;
        const y = clientY - rect.top;

        if (activeTool === 'text') {
            if (textInput?.visible && textInput.value) {
                // Commit previous text
                const ctx = canvasRef.current.getContext('2d');
                ctx.font = 'bold 16px sans-serif';
                ctx.fillStyle = drawingColor;
                ctx.fillText(textInput.value, textInput.x, textInput.y + 16);
            }
            setTextInput({ x, y, visible: true, value: '' });
            // Increased timeout slightly to ensure render
            setTimeout(() => inputRef.current?.focus(), 100);
        } else if (activeTool === 'draw') {
            isDrawingRef.current = true;
            lastPosRef.current = { x, y };
            const ctx = canvasRef.current.getContext('2d');
            ctx.fillStyle = drawingColor;
            ctx.fillRect(x, y, 2, 2);
        }
    };

    const handleCanvasMouseMove = (e) => {
        if (activeTool !== 'draw' || !isDrawingRef.current || !lastPosRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        const ctx = canvasRef.current.getContext('2d');
        ctx.strokeStyle = drawingColor;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        lastPosRef.current = { x, y };
    };

    const stopDrawing = () => {
        isDrawingRef.current = false;
    };

    const commitText = () => {
        if (textInput && textInput.visible && textInput.value && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            ctx.font = 'bold 16px sans-serif';
            ctx.fillStyle = drawingColor;
            ctx.fillText(textInput.value, textInput.x, textInput.y + 16);
        }
        setTextInput(null);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    const takeScreenshot = () => {
        if (!mountRef.current) return;
        try {
            const threeCanvas = mountRef.current.querySelector('canvas');
            const drawingCanvas = canvasRef.current;
            const mergedCanvas = document.createElement('canvas');
            mergedCanvas.width = threeCanvas.width;
            mergedCanvas.height = threeCanvas.height;
            const ctx = mergedCanvas.getContext('2d');
            ctx.drawImage(threeCanvas, 0, 0);
            if (drawingCanvas) ctx.drawImage(drawingCanvas, 0, 0);

            const link = document.createElement('a');
            link.download = `webgis-model-${Date.now()}.png`;
            link.href = mergedCanvas.toDataURL('image/png');
            link.click();
        } catch (e) { console.error("Screenshot error", e); }
    };

    return (
        <div className="w-full h-full relative bg-black overflow-hidden">
            {/* 3D Container */}
            <div ref={mountRef} className="absolute inset-0 z-0" />

            {/* Drawing Layer */}
            <canvas
                ref={canvasRef}
                className={`absolute inset-0 z-10 ${activeTool !== 'none' ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'}`}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={handleCanvasMouseDown}
                onTouchMove={handleCanvasMouseMove}
                onTouchEnd={stopDrawing}
            />

            {/* Text Input Overlay */}
            {textInput && textInput.visible && (
                <input
                    ref={inputRef}
                    type="text"
                    value={textInput.value}
                    onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
                    onKeyDown={(e) => {
                        e.stopPropagation(); // Stop control interference
                        if (e.key === 'Enter') commitText();
                    }}
                    onMouseDown={(e) => e.stopPropagation()} // Prevent canvas/controls interaction
                    onClick={(e) => {
                        e.stopPropagation();
                        inputRef.current?.focus();
                    }}
                    onBlur={commitText}
                    style={{
                        position: 'absolute',
                        left: textInput.x,
                        top: textInput.y,
                        color: drawingColor,
                        font: 'bold 16px sans-serif',
                        background: 'rgba(0,0,0,0.6)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        padding: '4px',
                        zIndex: 100,
                        pointerEvents: 'auto',
                    }}
                    autoFocus
                />
            )}

            {/* Loading / Error States */}
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm select-none">
                    <div className="bg-slate-800 text-white px-6 py-4 rounded shadow-lg flex flex-col items-center">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                        <span>Carregando Modelo 3D...</span>
                    </div>
                </div>
            )}
            {error && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-red-600/90 text-white px-4 py-2 rounded shadow-lg max-w-md text-center select-none">
                    {error}
                </div>
            )}

            {/* Tools UI */}
            <div className={`absolute top-4 right-4 flex gap-2 z-40 transition-opacity select-none ${loading ? 'opacity-0' : 'opacity-100'}`}>
                {/* Tools Group */}
                <div className="flex bg-slate-900/80 backdrop-blur rounded p-1 mr-2 border border-slate-700 items-center">
                    <button
                        onClick={() => { setActiveTool('none'); setIsAutoRotating(true); }}
                        className={`p-2 rounded transition-colors ${activeTool === 'none' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        title="Navegar"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M19 9l3 3-3 3M9 19l3 3 3-3M2 12h20M12 2v20" /></svg>
                    </button>
                    <div className="w-px h-6 bg-slate-700 mx-1"></div>
                    <button
                        onClick={() => { setActiveTool('draw'); setIsAutoRotating(false); }}
                        className={`p-2 rounded transition-colors ${activeTool === 'draw' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        title="Desenhar"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path></svg>
                    </button>
                    <button
                        onClick={() => { setActiveTool('text'); setIsAutoRotating(false); }}
                        className={`p-2 rounded transition-colors ${activeTool === 'text' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        title="Texto"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7V4h16v3" /><path d="M9 20h6" /><path d="M12 4v16" /></svg>
                    </button>

                    {activeTool !== 'none' && (
                        <>
                            <div className="w-px h-6 bg-slate-700 mx-1"></div>
                            <div className="flex gap-1 px-1">
                                {['#EF4444', '#EAB308', '#3B82F6', '#FFFFFF'].map(c => (
                                    <button
                                        key={c}
                                        className={`w-4 h-4 rounded-full border border-white/20 hover:scale-110 transition-transform ${drawingColor === c ? 'ring-2 ring-white' : ''}`}
                                        style={{ backgroundColor: c }}
                                        onClick={() => setDrawingColor(c)}
                                    />
                                ))}
                            </div>
                            <button onClick={clearCanvas} className="ml-1 text-red-400 hover:text-red-300 p-1" title="Limpar">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                            </button>
                        </>
                    )}
                </div>

                <div className="flex bg-slate-900/80 backdrop-blur rounded p-1 border border-slate-700 items-center">
                    <button onClick={() => setIsAutoRotating(!isAutoRotating)} className="px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10 rounded transition-colors">
                        {isAutoRotating ? 'Pausar' : 'Girar'}
                    </button>
                    <div className="w-px h-6 bg-slate-700 mx-1"></div>
                    <button onClick={takeScreenshot} className="px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10 rounded transition-colors flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg>
                        Foto
                    </button>
                </div>
            </div>

            {/* Subtle debug info */}
            {activeTool === 'none' && debugInfo && (
                <div className="absolute bottom-2 left-2 text-[10px] text-white/20 font-mono pointer-events-none select-none">
                    {debugInfo}
                </div>
            )}
        </div>
    );
};

export default ModelViewer;
