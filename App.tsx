// src/App.tsx - COMPLETE WITH ALL ROUTES (Admin + Bonus Features)
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Toaster from "./components/Toaster";

// ===== CENTRAL ENTRY =====
import Home from "./pages/Home";

// ===== AUTH PAGES =====
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import DeveloperRegister from "./pages/DeveloperRegister";
import DeveloperLogin from "./pages/DeveloperLogin";
import ResellerRegister from "./pages/ResellerRegister";
import ResellerLogin from "./pages/ResellerLogin";

// ===== PUBLIC PAGES =====
import CustomerShop from "./pages/CustomerShop";
import KeyValidator from "./pages/KeyValidator";

// ===== DEVELOPER PAGES =====
import DeveloperDashboard from "./pages/DeveloperDashboard";
import DeveloperProducts from "./pages/DeveloperProducts";
import DeveloperLicenses from "./pages/DeveloperLicenses";
import DeveloperCustomers from "./pages/DeveloperCustomers";
import DeveloperAnalytics from "./pages/DeveloperAnalytics";
import DeveloperResellers from "./pages/DeveloperResellers";
import DeveloperAPIKeys from "./pages/DeveloperAPIKeys";
import DeveloperBilling from "./pages/DeveloperBilling";
import DeveloperDocs from "./pages/DeveloperDocs";

// ===== RESELLER PAGES =====
import ResellerDashboard from "./pages/ResellerDashboard";
import ResellerMarketplace from "./pages/ResellerMarketplace";
import ResellerInventory from "./pages/ResellerInventory";
import ResellerDevelopers from "./pages/ResellerDevelopers";
import ResellerAnalytics from "./pages/ResellerAnalytics";

// ===== ADMIN PAGES =====
import AdminDashboard from "./pages/AdminDashboard";

// ===== BONUS FEATURES =====
import KeyBundles from "./pages/KeyBundles";
import CustomerReviews from "./pages/CustomerReviews";
import ReferralProgram from "./pages/ReferralProgram";

// ===== MAIN APP PAGES =====
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Analytics from "./pages/Analytics";
import Customers from "./pages/Customers";
import Products from "./pages/Products";
import Activations from "./pages/Activations";
import CustomerPortal from "./pages/CustomerPortal";
import CreateLicense from "./pages/CreateLicense";

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        {/* ===== CENTRAL HOME PAGE (LANDING PAGE) ===== */}
        <Route path="/" element={<Home />} />

        {/* ===== PUBLIC PAGES ===== */}
        <Route path="/shop" element={<CustomerShop />} />
        <Route path="/validate-key" element={<KeyValidator />} />
        <Route path="/bundles" element={<KeyBundles />} />
        <Route path="/reviews" element={<CustomerReviews />} />
        <Route path="/portal" element={<CustomerPortal />} />

        {/* ===== NORMAL USER AUTH ROUTES ===== */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* ===== DEVELOPER AUTH ROUTES ===== */}
        <Route path="/dev-register" element={<DeveloperRegister />} />
        <Route path="/dev-login" element={<DeveloperLogin />} />

        {/* ===== DEVELOPER PROTECTED ROUTES ===== */}
        <Route
          path="/dev-dashboard"
          element={
            <ProtectedRoute>
              <DeveloperDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dev-products"
          element={
            <ProtectedRoute>
              <DeveloperProducts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dev-licenses"
          element={
            <ProtectedRoute>
              <DeveloperLicenses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dev-customers"
          element={
            <ProtectedRoute>
              <DeveloperCustomers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dev-analytics"
          element={
            <ProtectedRoute>
              <DeveloperAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dev-resellers"
          element={
            <ProtectedRoute>
              <DeveloperResellers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dev-api-keys"
          element={
            <ProtectedRoute>
              <DeveloperAPIKeys />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dev-billing"
          element={
            <ProtectedRoute>
              <DeveloperBilling />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dev-docs"
          element={
            <ProtectedRoute>
              <DeveloperDocs />
            </ProtectedRoute>
          }
        />

        {/* ===== RESELLER AUTH ROUTES ===== */}
        <Route path="/reseller-register" element={<ResellerRegister />} />
        <Route path="/reseller-login" element={<ResellerLogin />} />

        {/* ===== RESELLER PROTECTED ROUTES ===== */}
        <Route
          path="/reseller-dashboard"
          element={
            <ProtectedRoute>
              <ResellerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reseller-marketplace"
          element={
            <ProtectedRoute>
              <ResellerMarketplace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reseller-inventory"
          element={
            <ProtectedRoute>
              <ResellerInventory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reseller-developers"
          element={
            <ProtectedRoute>
              <ResellerDevelopers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reseller-analytics"
          element={
            <ProtectedRoute>
              <ResellerAnalytics />
            </ProtectedRoute>
          }
        />

        {/* ===== REFERRAL ROUTE (PUBLIC) ===== */}
        <Route
          path="/referral"
          element={
            <ProtectedRoute>
              <ReferralProgram />
            </ProtectedRoute>
          }
        />

        {/* ===== ADMIN PROTECTED ROUTES ===== */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* ===== NORMAL USER PROTECTED ROUTES ===== */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/create"
          element={
            <ProtectedRoute>
              <CreateLicense />
            </ProtectedRoute>
          }
        />
        <Route
          path="/licenses"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <Customers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          }
        />
        <Route
          path="/activations"
          element={
            <ProtectedRoute>
              <Activations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* ===== FALLBACK ===== */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster />
    </BrowserRouter>
  );
}