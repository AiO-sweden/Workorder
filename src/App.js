import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import CreateAccountPage from "./pages/CreateAccountPage";
import PasswordResetPage from "./pages/PasswordResetPage";
import Dashboard from "./pages/Dashboard";
import NewOrder from "./pages/NewOrder";
import CustomerList from "./pages/CustomerList";
import NewCustomer from "./pages/NewCustomer";
import CustomerDetails from "./pages/CustomerDetails";
import OrderDetails from "./pages/OrderDetails";
import SidebarLayout from "./layouts/SidebarLayout";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import MigrationPage from "./pages/MigrationPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/create-account" element={<CreateAccountPage />} />
        <Route path="/reset-password" element={<PasswordResetPage />} />
        <Route path="/migration" element={<MigrationPage />} />

        {/* Routes with SidebarLayout */}
        <Route element={<SidebarLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/orders/new" element={<NewOrder />} />
          <Route path="/orders/:id" element={<OrderDetails />} />
          <Route path="/customers" element={<CustomerList />} />
          <Route path="/customers/new" element={<NewCustomer />} />
          <Route path="/customers/:id" element={<CustomerDetails />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback or Not Found Route - Optional */}
        {/* <Route path="*" element={<div>Sidan hittades inte</div>} /> */}
      </Routes>
    </AuthProvider>
  );
}
