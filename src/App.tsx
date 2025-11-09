// src/App.tsx - FIXED: Licenses Route zeigt jetzt Licenses statt Dashboard
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Toaster from "./components/Toaster";

// ===== LICENSE VALIDATION =====
import { validateLicense } from "./lib/licenseValidator";

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

// ===== LICENSE LOGIN =====
import LicenseLogin from "./pages/LicenseLogin";

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
import ResellerSales from "./pages/ResellerSales";

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
import Licenses from "./pages/Licenses";
import ProfileSettings from "./pages/ProfileSettings";
import CustomerDashboard from "./pages/CustomerDashboard";
import ResellerShop from "./pages/ResellerShop";
import ResellerShopsBrowse from "./pages/ResellerShopsBrowse";

// ===== LICENSE AUTH STATE =====
interface LicenseAuthState {
  licensed: boolean;
  licenseKey?: string;
  productName?: string;
  customerEmail?: string;
  loading: boolean;
}

export default function App() {
  const [licenseAuth, setLicenseAuth] = useState<LicenseAuthState>({
    licensed: false,
    loading: true,
  });

  // ===== CHECK LICENSE AT APP START =====
  useEffect(() => {
    async function checkLicense() {
      console.log("🔐 Checking for existing license...");

      // Try to get license key from 3 sources:
      // 1. localStorage
      let licenseKey = localStorage.getItem("license_key");

      // 2. URL parameters (?key=LIC-... or ?license_key=LIC-...)
      if (!licenseKey) {
        const params = new URLSearchParams(window.location.search);
        licenseKey = params.get("key") || params.get("license_key");

        if (licenseKey) {
          localStorage.setItem("license_key", licenseKey);
        }
      }

      // 3. sessionStorage (current session only)
      if (!licenseKey) {
        licenseKey = sessionStorage.getItem("license_key") || undefined;
      }

      if (licenseKey) {
        console.log("🔐 License key found, validating...");

        try {
          const result = await validateLicense(licenseKey);

          if (result.valid) {
            console.log("✅ License is valid!");
            setLicenseAuth({
              licensed: true,
              licenseKey,
              productName: result.product_name,
              customerEmail: result.customer_email,
              loading: false,
            });
          } else {
            console.log("❌ License is invalid:", result.message);
            localStorage.removeItem("license_key");
            sessionStorage.removeItem("license_key");
            setLicenseAuth({
              licensed: false,
              loading: false,
            });
          }
        } catch (err) {
          console.error("❌ Error validating:", err);
          setLicenseAuth({
            licensed: false,
            loading: false,
          });
        }
      } else {
        console.log("ℹ️ No license key found");
        setLicenseAuth({
          licensed: false,
          loading: false,
        });
      }
    }

    checkLicense();

    // Revalidate every 5 minutes
    const interval = setInterval(() => {
      console.log("🔄 Revalidating license...");
      checkLicense();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // ===== HANDLE LICENSE LOGIN =====
  function handleLicenseLogin(
    key: string,
    product: string,
    customer: string
  ) {
    console.log("✅ License login successful");
    localStorage.setItem("license_key", key);
    setLicenseAuth({
      licensed: true,
      licenseKey: key,
      productName: product,
      customerEmail: customer,
      loading: false,
    });
  }

  // ===== HANDLE LICENSE LOGOUT =====
  function handleLicenseLogout() {
    console.log("👋 License logout");
    localStorage.removeItem("license_key");
    sessionStorage.removeItem("license_key");
    setLicenseAuth({
      licensed: false,
      loading: false,
    });
  }

  if (licenseAuth.loading) {
    return (
      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0] flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-block animate-spin text-2xl">⏳</div>
          </div>
          <p className="text-lg">🔄 Initializing...</p>
        </div>
      </div>
    );
  }

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
        <Route path="/reseller-shops" element={<ResellerShopsBrowse />} />
        <Route path="/reseller-shop/:resellerId" element={<ResellerShop />} />

        {/* ===== LICENSE LOGIN ROUTE ===== */}
        <Route
          path="/license-login"
          element={
            <LicenseLogin
              onSuccess={handleLicenseLogin}
              licenseAuth={licenseAuth}
            />
          }
        />

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
          path="/developer-dashboard"
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
          path="/reseller-sales"
          element={
            <ProtectedRoute>
              <ResellerSales />
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
          path="/customer-dashboard"
          element={
            <ProtectedRoute>
              <CustomerDashboard />
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

        {/* ✅ FIXED: /licenses Route jetzt mit Licenses Komponente statt Dashboard! */}
        <Route
          path="/licenses"
          element={
            <ProtectedRoute>
              <Licenses />
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
        <Route
          path="/profile-settings"
          element={
            <ProtectedRoute>
              <ProfileSettings />
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