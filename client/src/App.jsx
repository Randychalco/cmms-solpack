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

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user || user.role !== 'admin') return <Navigate to="/" />;

  return children;
};

function App() {
  return (

    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="work-orders" element={<WorkOrders />} />
            <Route path="work-orders/new" element={<WorkOrderCreate />} />
            <Route path="work-orders/:id" element={<WorkOrderDetails />} />
            <Route path="work-orders/:id/edit" element={<WorkOrderEdit />} />
            <Route path="work-orders/:id/checklist" element={<WorkOrderChecklist />} />
            <Route path="checklists/fill/:templateId" element={<WorkOrderChecklist />} />
            <Route path="checklists/executions" element={<ChecklistExecutionsList />} />
            <Route path="checklists/execution/:executionId" element={<WorkOrderChecklist />} />
            <Route path="assets" element={<Assets />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="material-requests" element={<MaterialRequests />} />
            <Route path="repairs" element={<Repairs />} />
            <Route path="purchase-requests" element={<PurchaseRequests />} />
            <Route path="checklists" element={<Checklists />} />
            <Route path="preventive-plans" element={<PreventivePlans />} />
            <Route path="preventive-history" element={<PreventiveOrdersList />} />
            <Route path="preventive/new" element={<NewPreventiveOrder />} />
            <Route path="preventive/execution/:id" element={<PreventiveExecutionDetails />} />
            <Route path="preventive/execution/:id/edit" element={<PreventiveExecutionEdit />} />
            <Route path="users" element={
              <AdminRoute>
                <Users />
              </AdminRoute>
            } />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
