import React, { useRef, useEffect, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';

const SignaturePad = ({ value, onChange, label }) => {
    const sigCanvas = useRef(null);
    const [mode, setMode] = useState(value && value.startsWith('data:image') ? 'view' : 'draw');

    // Only switch to view mode if the parent explicitly passes a NEW base64 signature from the backend AND we are currently empty.
    useEffect(() => {
        if (value && value.startsWith('data:image') && mode === 'draw' && !sigCanvas.current?.isEmpty?.()) {
            // Keep draw mode if canvas has strokes (user is drawing)
        } else if (value && value.startsWith('data:image') && mode === 'draw') {
             setMode('view');
        }
    }, []); // Run once on mount based on initial value

    const clear = () => {
        if (sigCanvas.current && typeof sigCanvas.current.clear === 'function') {
            sigCanvas.current.clear();
        }
        onChange('');
        setMode('draw');
    };

    const handleEnd = () => {
        if (sigCanvas.current) {
            try {
                // Using getCanvas() instead of getTrimmedCanvas() to avoid cropping bugs returning empty data on some resolutions
                const dataURL = sigCanvas.current.getCanvas().toDataURL('image/png');
                console.log('--- SIGNATURE GENERATED --- Length:', dataURL.length);
                onChange(dataURL);
            } catch (err) {
                console.error("Signature extraction failed:", err);
            }
        }
    };

    if (mode === 'view' && value) {
        return (
            <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-2">{label}</label>
                <div className="border rounded p-2 bg-gray-50 flex flex-col items-center shadow-sm">
                    <img src={value} alt="Firma" className="max-h-40 mb-3 object-contain" />
                    <button
                        type="button"
                        onClick={clear}
                        className="text-red-500 text-sm font-black hover:underline tracking-wider uppercase bg-white px-4 py-2 rounded-lg border border-red-200"
                    >
                        Borrar y Firmar de nuevo
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
                <label className="block text-gray-700 font-bold">{label}</label>
                <button
                    type="button"
                    onClick={clear}
                    className="text-gray-500 text-xs font-black uppercase tracking-widest hover:text-red-500"
                >
                    Limpiar
                </button>
            </div>
            <div 
                className="border rounded border-gray-300 bg-white shadow-inner overflow-hidden w-full" 
                style={{ height: '160px' }}
                onMouseLeave={handleEnd}
                onMouseUp={handleEnd}
                onTouchEnd={handleEnd}
            >
                <SignatureCanvas
                    ref={sigCanvas}
                    penColor="black"
                    canvasProps={{
                        width: 600,
                        height: 160,
                        className: 'signature-canvas w-full h-full touch-none',
                    }}
                    onEnd={handleEnd}
                />
            </div>
        </div>
    );
};

export default SignaturePad;
