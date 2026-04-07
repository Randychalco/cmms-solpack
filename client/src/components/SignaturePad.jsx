import React, { useRef, useEffect, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';

const SignaturePad = ({ value, onChange, label }) => {
    const sigCanvas = useRef({});
    const [isDrawing, setIsDrawing] = useState(false);

    const clear = () => {
        sigCanvas.current.clear();
        onChange('');
        setIsDrawing(true);
    };

    const handleEnd = () => {
        onChange(sigCanvas.current.getTrimmedCanvas().toDataURL('image/png'));
    };

    // If we have an initial string value that looks like an image, show it
    // But if the user wants to change it, they hit "Clear"
    if (value && !isDrawing) {
        return (
            <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-2">{label}</label>
                <div className="border rounded p-2 bg-gray-50 flex flex-col items-center">
                    <img src={value} alt="Firma" className="max-h-40 mb-2" />
                    <button
                        type="button"
                        onClick={() => setIsDrawing(true)}
                        className="text-red-500 text-sm font-bold hover:underline"
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
                    onClick={() => {
                        sigCanvas.current.clear();
                        onChange('');
                    }}
                    className="text-gray-500 text-xs hover:text-red-500"
                >
                    Limpiar
                </button>
            </div>
            <div className="border rounded border-gray-300 bg-white shadow-inner">
                <SignatureCanvas
                    ref={sigCanvas}
                    penColor="black"
                    canvasProps={{
                        className: 'signature-canvas w-full h-40',
                    }}
                    onEnd={handleEnd}
                />
            </div>
        </div>
    );
};

export default SignaturePad;
