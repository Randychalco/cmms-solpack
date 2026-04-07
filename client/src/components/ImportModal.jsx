import { useState, useRef } from 'react';
import { Upload, X, FileSpreadsheet, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import api from '../api/axios';

const ImportModal = ({ isOpen, onClose, onSuccess, title = "Carga Masiva", uploadUrl, templateUrl, templateName }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setResults(null);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await api.get(templateUrl, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', templateName || 'plantilla.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error downloading template:', error);
            alert('Error al descargar la plantilla');
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post(uploadUrl, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setResults(response.data.results);
            if (response.data.results.success > 0) {
                onSuccess(); // Refresh list via parent callback
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            alert(error.response?.data?.message || 'Error al procesar el archivo');
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setFile(null);
        setResults(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
                        <p className="text-sm text-slate-500">Importa registros desde Excel</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {!results ? (
                        <>
                            <div className="mb-6 bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                    <FileSpreadsheet size={20} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-blue-900">Antes de empezar</h3>
                                    <p className="text-sm text-blue-700 mt-1 mb-2">
                                        Descarga la plantilla base para asegurar que tu archivo tenga el formato correcto.
                                    </p>
                                    <button
                                        onClick={handleDownloadTemplate}
                                        className="text-sm font-medium text-blue-600 hover:text-blue-800 underline"
                                    >
                                        Descargar Plantilla Excel
                                    </button>
                                </div>
                            </div>

                            <div
                                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${file ? 'border-indigo-300 bg-indigo-50/50' : 'border-slate-300 hover:border-indigo-400'
                                    }`}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const droppedFile = e.dataTransfer.files[0];
                                    if (droppedFile) setFile(droppedFile);
                                }}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".xlsx, .xls"
                                    className="hidden"
                                />

                                {file ? (
                                    <div className="flex flex-col items-center">
                                        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-4">
                                            <FileSpreadsheet size={32} />
                                        </div>
                                        <h3 className="text-lg font-semibold text-slate-800">{file.name}</h3>
                                        <p className="text-sm text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                                        <button
                                            onClick={reset}
                                            className="mt-4 text-sm text-red-500 hover:text-red-700 font-medium"
                                        >
                                            Eliminar archivo
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
                                            <Upload size={32} />
                                        </div>
                                        <h3 className="text-lg font-semibold text-slate-800">Arrastra tu archivo aquí</h3>
                                        <p className="text-sm text-slate-500 mt-1">o haz click para seleccionar</p>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="mt-4 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                                        >
                                            Seleccionar Excel
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="flex-1 bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                                    <h4 className="text-sm font-medium text-green-600">Procesados Exitosamente</h4>
                                    <p className="text-2xl font-bold text-green-700">{results.success}</p>
                                </div>
                                <div className="flex-1 bg-red-50 border border-red-100 rounded-xl p-4 text-center">
                                    <h4 className="text-sm font-medium text-red-600">Errores</h4>
                                    <p className="text-2xl font-bold text-red-700">{results.errors.length}</p>
                                </div>
                            </div>

                            {results.errors.length > 0 && (
                                <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                                    <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 font-medium text-sm text-slate-700">
                                        Detalle de Errores ({results.errors.length})
                                    </div>
                                    <div className="max-h-60 overflow-y-auto p-2 space-y-2">
                                        {results.errors.map((err, idx) => (
                                            <div key={idx} className="bg-white p-3 rounded-lg border border-red-100 shadow-sm flex items-start gap-3">
                                                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                                                <div className="text-sm">
                                                    <span className="font-semibold text-slate-700">Fila {err.row}:</span>{' '}
                                                    <span className="text-slate-600">{err.message}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                    {!results ? (
                        <>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={!file || loading}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-lg shadow-indigo-200"
                            >
                                {loading ? (
                                    <>
                                        <Loader size={18} className="animate-spin" /> Procesando...
                                    </>
                                ) : (
                                    <>
                                        <Upload size={18} /> Importar
                                    </>
                                )}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => {
                                reset();
                                onClose();
                            }}
                            className="px-6 py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900 transition-colors"
                        >
                            Cerrar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImportModal;
