import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Layout from './components/Layout';

import Dashboard from './pages/Dashboard';
import WorkOrders from './pages/WorkOrders';
import WorkOrderCreate from './pages/WorkOrderCreate';
import WorkOrderEdit from './pages/WorkOrderEdit';
import WorkOrderDetails from './pages/WorkOrderDetails';
import WorkOrderChecklist from './pages/WorkOrderChecklist';
import Checklists from './pages/Checklists';
import ChecklistExecutionsList from './pages/ChecklistExecutionsList';
import Assets from './pages/Assets';
import Inventory from './pages/Inventory';
import Users from './pages/Users';
import MaterialRequests from './pages/MaterialRequests';
import Repairs from './pages/Repairs';
import PurchaseRequests from './pages/PurchaseRequests';
import PreventivePlans from './pages/PreventivePlans';
import PreventiveExecutionDetails from './pages/PreventiveExecutionDetails';
import NewPreventiveOrder from './pages/NewPreventiveOrder';
import PreventiveOrdersList from './pages/PreventiveOrdersList';
import PreventiveExecutionEdit from './pages/PreventiveExecutionEdit';
import SafetyChecklists from './pages/SafetyChecklists';
import MaintenanceNotifications from './pages/MaintenanceNotifications';
import MaintenanceNotificationCreate from './pages/MaintenanceNotificationCreate';
import MaintenanceNotificationDetails from './pages/MaintenanceNotificationDetails';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return children;
};

const RoleRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  if (!allowedRoles.includes(user.role)) {
    if (user.role === 'production') return <Navigate to="/notifications" />;
    return <Navigate to="/" />;
  }

  return children;
};

// Role Groups
const ALL_ROLES = ['admin', 'supervisor', 'planner', 'technician', 'reader', 'production'];
const MAINT_ROLES = ['admin', 'supervisor', 'planner', 'technician', 'reader'];
const PLANNER_ROLES = ['admin', 'supervisor', 'planner', 'reader'];
const ADMIN_ROLES = ['admin'];

function App() {
  return (

    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<RoleRoute allowedRoles={ALL_ROLES}><Dashboard /></RoleRoute>} />
            <Route path="work-orders" element={<RoleRoute allowedRoles={MAINT_ROLES}><WorkOrders /></RoleRoute>} />
            <Route path="work-orders/new" element={<RoleRoute allowedRoles={MAINT_ROLES}><WorkOrderCreate /></RoleRoute>} />
            <Route path="work-orders/:id" element={<RoleRoute allowedRoles={MAINT_ROLES}><WorkOrderDetails /></RoleRoute>} />
            <Route path="work-orders/:id/edit" element={<RoleRoute allowedRoles={MAINT_ROLES}><WorkOrderEdit /></RoleRoute>} />
            <Route path="work-orders/:id/checklist" element={<RoleRoute allowedRoles={MAINT_ROLES}><WorkOrderChecklist /></RoleRoute>} />
            <Route path="checklists/fill/:templateId" element={<RoleRoute allowedRoles={MAINT_ROLES}><WorkOrderChecklist /></RoleRoute>} />
            <Route path="checklists/executions" element={<RoleRoute allowedRoles={MAINT_ROLES}><ChecklistExecutionsList /></RoleRoute>} />
            <Route path="checklists/execution/:executionId" element={<RoleRoute allowedRoles={MAINT_ROLES}><WorkOrderChecklist /></RoleRoute>} />
            <Route path="assets" element={<RoleRoute allowedRoles={MAINT_ROLES}><Assets /></RoleRoute>} />
            <Route path="inventory" element={<RoleRoute allowedRoles={PLANNER_ROLES}><Inventory /></RoleRoute>} />
            <Route path="material-requests" element={<RoleRoute allowedRoles={MAINT_ROLES}><MaterialRequests /></RoleRoute>} />
            <Route path="repairs" element={<RoleRoute allowedRoles={PLANNER_ROLES}><Repairs /></RoleRoute>} />
            <Route path="purchase-requests" element={<RoleRoute allowedRoles={PLANNER_ROLES}><PurchaseRequests /></RoleRoute>} />
            <Route path="checklists" element={<RoleRoute allowedRoles={PLANNER_ROLES}><Checklists /></RoleRoute>} />
            <Route path="safety" element={<RoleRoute allowedRoles={PLANNER_ROLES}><SafetyChecklists /></RoleRoute>} />
            <Route path="preventive-plans" element={<RoleRoute allowedRoles={PLANNER_ROLES}><PreventivePlans /></RoleRoute>} />
            <Route path="preventive-history" element={<RoleRoute allowedRoles={MAINT_ROLES}><PreventiveOrdersList /></RoleRoute>} />
            <Route path="preventive/new" element={<RoleRoute allowedRoles={PLANNER_ROLES}><NewPreventiveOrder /></RoleRoute>} />
            <Route path="preventive/execution/:id" element={<RoleRoute allowedRoles={MAINT_ROLES}><PreventiveExecutionDetails /></RoleRoute>} />
            <Route path="preventive/execution/:id/edit" element={<RoleRoute allowedRoles={MAINT_ROLES}><PreventiveExecutionEdit /></RoleRoute>} />
            
            {/* Notifications (Avisos) - Everyone including production can access */}
            <Route path="notifications" element={<RoleRoute allowedRoles={ALL_ROLES}><MaintenanceNotifications /></RoleRoute>} />
            <Route path="notifications/new" element={<RoleRoute allowedRoles={ALL_ROLES}><MaintenanceNotificationCreate /></RoleRoute>} />
            <Route path="notifications/:id" element={<RoleRoute allowedRoles={ALL_ROLES}><MaintenanceNotificationDetails /></RoleRoute>} />
            
            <Route path="users" element={<RoleRoute allowedRoles={ADMIN_ROLES}><Users /></RoleRoute>} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
