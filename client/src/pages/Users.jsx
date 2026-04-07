import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Users as UsersIcon, X, Search, Shield, Mail, Check, Ban, Trash2, Edit } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const { user: currentUser } = useAuth();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'technician',
        status: 'active'
    });
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data } = await api.get('/users');
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingId) {
                await api.put(`/users/${editingId}`, formData);
                alert('Usuario actualizado correctamente');
            } else {
                await api.post('/auth/register', formData);
                alert('Usuario registrado correctamente');
            }
            setShowForm(false);
            setEditingId(null);
            setFormData({ name: '', email: '', password: '', role: 'technician', status: 'active' });
            fetchUsers();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Error al guardar usuario');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (user) => {
        setFormData({
            name: user.name,
            email: user.email,
            password: '', // Keep empty to not change
            role: user.role,
            status: user.status || 'active'
        });
        setEditingId(user.id);
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({ name: '', email: '', password: '', role: 'technician', status: 'active' });
    };

    const handleStatusChange = async (userId, newStatus) => {
        if (!window.confirm(`¿Estás seguro de cambiar el estado a ${newStatus}?`)) return;
        try {
            await api.put(`/users/${userId}/status`, { status: newStatus });
            fetchUsers();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Error al actualizar estado');
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) return;
        try {
            await api.delete(`/users/${userId}`);
            fetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Error al eliminar usuario');
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleBadge = (role) => {
        const colors = {
            admin: 'bg-purple-100 text-purple-800',
            supervisor: 'bg-blue-100 text-blue-800',
            technician: 'bg-green-100 text-green-800',
            viewer: 'bg-gray-100 text-gray-800'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${colors[role] || colors.viewer}`}>
                {role}
            </span>
        );
    };

    const getStatusBadge = (status) => {
        const styles = {
            active: 'bg-green-100 text-green-800',
            pending: 'bg-yellow-100 text-yellow-800',
            inactive: 'bg-red-100 text-red-800'
        };
        const labels = {
            active: 'Activo',
            pending: 'Pendiente',
            inactive: 'Inactivo'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${styles[status] || styles.inactive}`}>
                {labels[status] || status}
            </span>
        );
    };

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <UsersIcon className="text-blue-600" /> Gestión de Usuarios
                </h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                >
                    {showForm ? <X size={20} /> : <Plus size={20} />}
                    <span className="hidden md:inline">{showForm ? 'Cancelar' : 'Nuevo Usuario'}</span>
                </button>
            </div>

            {showForm && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-6 border-l-4 border-blue-500 animate-in fade-in slide-in-from-top-4">
                    <h2 className="text-xl font-bold mb-4 text-slate-800">{editingId ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">Nombre Completo</label>
                                <input
                                    type="text"
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="Ej. Juan Pérez"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">Correo Electrónico</label>
                                <input
                                    type="email"
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required={!editingId}
                                    disabled={editingId} // Email usually not editable or handled carefully
                                    placeholder="usuario@solpack.com"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">{editingId ? 'Nueva Contraseña (Opcional)' : 'Contraseña'}</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none pr-10"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required={!editingId}
                                        placeholder={editingId ? "Dejar en blanco para mantener" : "******"}
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 focus:outline-none z-10 font-bold"
                                    >
                                        {showPassword ? "🚫" : "👁️"}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">Rol</label>
                                <select
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="technician">Técnico</option>
                                    <option value="supervisor">Supervisor</option>
                                    <option value="admin">Administrador</option>
                                    <option value="viewer">Visualizador</option>
                                </select>
                            </div>
                            {editingId && (
                                <div>
                                    <label className="block text-gray-700 font-bold mb-2">Estado</label>
                                    <select
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="active">Activo</option>
                                        <option value="pending">Pendiente</option>
                                        <option value="inactive">Inactivo</option>
                                    </select>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Guardando...' : (editingId ? 'Actualizar Usuario' : 'Registrar Usuario')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar usuarios..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-600 font-semibold text-sm uppercase">
                            <tr>
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Rol</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                                                    {u.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-medium text-slate-800">{u.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getRoleBadge(u.role)}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <Mail size={16} className="text-slate-400" />
                                                {u.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(u.status || 'active')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(u)}
                                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                    title="Editar"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                {u.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleStatusChange(u.id, 'active')}
                                                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                        title="Aprobar"
                                                    >
                                                        <Check size={18} />
                                                    </button>
                                                )}
                                                {u.status === 'active' && u.id !== currentUser.id && (
                                                    <button
                                                        onClick={() => handleStatusChange(u.id, 'inactive')}
                                                        className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                                                        title="Desactivar"
                                                    >
                                                        <Ban size={18} />
                                                    </button>
                                                )}
                                                {u.status === 'inactive' && (
                                                    <button
                                                        onClick={() => handleStatusChange(u.id, 'active')}
                                                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                        title="Reactivar"
                                                    >
                                                        <Check size={18} />
                                                    </button>
                                                )}
                                                {u.id !== currentUser.id && (
                                                    <button
                                                        onClick={() => handleDelete(u.id)}
                                                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                                        No se encontraron usuarios
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Users;
