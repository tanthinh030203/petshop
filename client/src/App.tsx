import { Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';

import MainLayout from '@/components/Layout/MainLayout';
import ProtectedRoute from '@/components/Layout/ProtectedRoute';

import LoginPage from '@/pages/LoginPage';
import Dashboard from '@/pages/Dashboard';
import CustomersPage from '@/pages/CustomersPage';
import CustomerDetailPage from '@/pages/CustomerDetailPage';
import PetsPage from '@/pages/PetsPage';
import PetDetailPage from '@/pages/PetDetailPage';
import AppointmentsPage from '@/pages/AppointmentsPage';
import AppointmentCalendarPage from '@/pages/AppointmentCalendarPage';
import MedicalRecordsPage from '@/pages/MedicalRecordsPage';
import VaccinationsPage from '@/pages/VaccinationsPage';
import GroomingPage from '@/pages/GroomingPage';
import HotelPage from '@/pages/HotelPage';
import POSPage from '@/pages/POSPage';
import ProductsPage from '@/pages/ProductsPage';
import CategoriesPage from '@/pages/CategoriesPage';
import StockPage from '@/pages/StockPage';
import InvoicesPage from '@/pages/InvoicesPage';
import InvoiceDetailPage from '@/pages/InvoiceDetailPage';
import ReportsPage from '@/pages/ReportsPage';
import BranchesPage from '@/pages/BranchesPage';
import UsersPage from '@/pages/UsersPage';

export default function App() {
  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6,
        },
      }}
    >
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="customers/:id" element={<CustomerDetailPage />} />
          <Route path="pets" element={<PetsPage />} />
          <Route path="pets/:id" element={<PetDetailPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="appointments/calendar" element={<AppointmentCalendarPage />} />
          <Route path="medical" element={<MedicalRecordsPage />} />
          <Route path="vaccinations" element={<VaccinationsPage />} />
          <Route path="grooming" element={<GroomingPage />} />
          <Route path="hotel" element={<HotelPage />} />
          <Route path="pos" element={<POSPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/categories" element={<CategoriesPage />} />
          <Route path="stock" element={<StockPage />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="invoices/:id" element={<InvoiceDetailPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings/branches" element={<BranchesPage />} />
          <Route path="settings/users" element={<UsersPage />} />
        </Route>
      </Routes>
    </ConfigProvider>
  );
}
