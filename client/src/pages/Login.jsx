import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await login(email, password);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg rounded-lg w-full max-w-md">
                <h3 className="text-2xl font-bold text-center text-slate-900">CMMS Solpack</h3>
                <p className="text-center text-gray-600 mb-6">Sign in to your account</p>
                <form onSubmit={handleSubmit}>
                    <div className="mt-4">
                        <div className="block" >Email</div>
                        <input
                            type="email"
                            placeholder="Email"
                            className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mt-4">
                        <div className="block">Password</div>
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    <div className="flex items-baseline justify-between">
                        <button className="px-6 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-900 w-full transition-colors">Login</button>
                    </div>
                </form>
                <div className="mt-6 text-center text-sm text-slate-600">
                    ¿No tienes una cuenta?{' '}
                    <Link to="/register" className="text-blue-600 font-bold hover:underline">
                        Registrarse
                    </Link>
                </div>
            </div >
        </div >
    );
};

export default Login;
