import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { Eye, EyeOff } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);
        try {
            // Role defaults to 'technician' and status to 'pending' in backend
            await api.post('/auth/register', {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: 'technician'
            });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al registrar usuario');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center animate-in fade-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">✓</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Registro Exitoso!</h2>
                    <p className="text-slate-600 mb-6">
                        Tu cuenta ha sido creada y está <span className="font-bold text-yellow-600">pendiente de aprobación</span>.
                        El administrador revisará tu solicitud pronto.
                    </p>
                    <Link
                        to="/login"
                        className="inline-flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        Volver al Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                <div className="flex items-center gap-2 mb-6">
                    <Link to="/login" className="text-slate-400 hover:text-slate-600 transition-colors">
                        ←
                    </Link>
                    <h2 className="text-2xl font-bold text-slate-800 flex-1 text-center pr-6">Crear Cuenta</h2>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 flex items-center gap-2 text-sm">
                        <span>!</span>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-slate-700 text-sm font-bold mb-2">Nombre Completo</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            placeholder="Ej. Juan Pérez"
                        />
                    </div>
                    <div>
                        <label className="block text-slate-700 text-sm font-bold mb-2">Correo Electrónico</label>
                        <input
                            type="email"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            placeholder="usuario@empresa.com"
                        />
                    </div>
                    <div>
                        <label className="block text-slate-700 text-sm font-bold mb-2">Contraseña</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                placeholder="Mínimo 6 caracteres"
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-slate-700 text-sm font-bold mb-2">Confirmar Contraseña</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                required
                                placeholder="Repite tu contraseña"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-70 flex items-center justify-center gap-2 mt-2"
                    >
                        {loading ? 'Registrando...' : (
                            <>
                                <span>+</span> Registrarse
                            </>
                        )}
                    </button>
                </form>

                <p className="mt-6 text-center text-slate-600 text-sm">
                    ¿Ya tienes una cuenta?{' '}
                    <Link to="/login" className="text-blue-600 font-bold hover:underline">
                        Inicia Sesión
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
