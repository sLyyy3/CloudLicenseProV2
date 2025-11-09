// src/pages/LicenseLogin.tsx
// ===== LICENSE LOGIN PAGE WITH API VALIDATION =====

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaKey, FaArrowLeft, FaCheck, FaTimes, FaRocket } from "react-icons/fa";
import { useDialog } from "../components/Dialog";
import { validateLicense, incrementActivation } from "../lib/licenseValidator";

interface LicenseLoginProps {
  onSuccess: (key: string, product: string, customer: string) => void;
  licenseAuth: {
    licensed: boolean;
    licenseKey?: string;
  };
}

export default function LicenseLogin({ onSuccess, licenseAuth }: LicenseLoginProps) {
  const navigate = useNavigate();
  const { Dialog: DialogComponent, open: openDialog } = useDialog();

  const [licenseKey, setLicenseKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);

  // ===== VALIDATE LICENSE FUNCTION =====
  async function handleValidateLicense() {
    if (!licenseKey.trim()) {
      openDialog({
        type: "warning",
        title: "⚠️ License Key Required",
        message: "Please enter a license key to continue",
        closeButton: "OK",
      });
      return;
    }

    setLoading(true);
    try {
      console.log("🔍 Validating license key...");

      // Call validator API
      const result = await validateLicense(licenseKey.toUpperCase());
      setValidationResult(result);

      if (result.valid) {
        // Try to increment activation
        const activationResult = await incrementActivation(
          licenseKey.toUpperCase()
        );

        console.log(
          "📊 Activation increment result:",
          activationResult ? "Success" : "Failed"
        );

        // Show success dialog
        openDialog({
          type: "success",
          title: "✅ License Valid!",
          message: (
            <div className="text-left space-y-3">
              <div className="bg-green-600/20 border border-green-600 rounded p-3 mb-3">
                <p className="font-bold text-green-400">🎉 Welcome!</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm">
                  <strong>Product:</strong> {result.product_name}
                </p>
                <p className="text-sm">
                  <strong>Email:</strong> {result.customer_email}
                </p>

                {result.expires_at && (
                  <p className="text-sm">
                    <strong>Expires:</strong>{" "}
                    {new Date(result.expires_at).toLocaleDateString("en-US")}
                  </p>
                )}

                {result.status && (
                  <p className="text-sm">
                    <strong>Status:</strong>{" "}
                    <span className="text-green-400 font-bold">
                      {result.status.toUpperCase()}
                    </span>
                  </p>
                )}
              </div>

              <p className="text-xs text-gray-400 italic mt-4">
                🚀 Redirecting to dashboard in 2 seconds...
              </p>
            </div>
          ),
          closeButton: "OK",
        });

        // Save license key to localStorage
        localStorage.setItem("license_key", licenseKey.toUpperCase());

        // Redirect to app
        setTimeout(() => {
          onSuccess(
            licenseKey.toUpperCase(),
            result.product_name || "Unknown",
            result.customer_email || "Unknown"
          );
          navigate("/dashboard", { replace: true });
        }, 2000);
      } else {
        // License invalid
        openDialog({
          type: "error",
          title: "❌ License Invalid",
          message: result.message,
          closeButton: "OK",
        });
      }
    } catch (err: any) {
      console.error("❌ Error:", err);
      openDialog({
        type: "error",
        title: "❌ Error",
        message: err.message || "An error occurred during validation",
        closeButton: "OK",
      });
    } finally {
      setLoading(false);
    }
  }

  // If already licensed, show different UI
  if (licenseAuth.licensed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0E0E12] to-[#1A1A1F] text-[#E0E0E0] flex items-center justify-center p-4">
        <div className="bg-[#1A1A1F] border border-green-600 rounded-lg p-8 max-w-md w-full text-center">
          <FaCheck className="text-5xl text-green-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-3">✅ Already Licensed</h1>
          <p className="text-gray-400 mb-6">
            You are already logged in with a valid license key.
          </p>

          <div className="bg-green-600/20 border border-green-600 rounded p-4 mb-6">
            <p className="text-sm text-gray-400 mb-2">License Key:</p>
            <p className="font-mono text-green-400 font-bold break-all">
              {licenseAuth.licenseKey}
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate("/dashboard", { replace: true })}
              className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 font-bold rounded-lg transition"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("license_key");
                window.location.reload();
              }}
              className="w-full px-4 py-3 bg-gray-600 hover:bg-gray-700 font-bold rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {DialogComponent}

      <div className="min-h-screen bg-gradient-to-br from-[#0E0E12] to-[#1A1A1F] text-[#E0E0E0]">
        {/* BACK BUTTON */}
        <div className="bg-[#1A1A1F] border-b border-[#2C2C34] p-6">
          <div className="max-w-md mx-auto">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-gray-400 hover:text-[#00FF9C] transition"
            >
              <FaArrowLeft /> Back to Home
            </button>
          </div>
        </div>

        {/* LOGIN FORM */}
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-8 w-full max-w-md shadow-xl">
            {/* HEADER */}
            <div className="mb-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <FaRocket className="text-[#00FF9C] text-3xl" />
                <h1 className="text-2xl font-bold">CloudLicensePro</h1>
              </div>
              <h2 className="text-3xl font-bold">🔐 License Login</h2>
              <p className="text-gray-400 mt-2">
                Sign in with your license key
              </p>
            </div>

            {/* LICENSE KEY INPUT */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  🔑 License Key
                </label>
                <input
                  type="text"
                  placeholder="LIC-ABC123DEF..."
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                  onKeyPress={(e) =>
                    e.key === "Enter" && handleValidateLicense()
                  }
                  className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition font-mono text-sm"
                  disabled={loading}
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2">
                  💡 Paste your license key from your developer dashboard
                </p>
              </div>
            </div>

            {/* VALIDATION RESULT DISPLAY */}
            {validationResult && (
              <div
                className={`mb-6 p-4 rounded border ${
                  validationResult.valid
                    ? "bg-green-600/20 border-green-600"
                    : "bg-red-600/20 border-red-600"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {validationResult.valid ? (
                    <FaCheck className="text-green-400 text-xl" />
                  ) : (
                    <FaTimes className="text-red-400 text-xl" />
                  )}
                  <p className="font-bold">
                    {validationResult.valid ? "✅ Valid" : "❌ Invalid"}
                  </p>
                </div>

                <p className="text-sm text-gray-300">
                  {validationResult.message}
                </p>

                {validationResult.product_name && (
                  <p className="text-xs text-gray-400 mt-2">
                    📦 Product: {validationResult.product_name}
                  </p>
                )}

                {validationResult.customer_email && (
                  <p className="text-xs text-gray-400">
                    👤 Email: {validationResult.customer_email}
                  </p>
                )}

                {validationResult.status && (
                  <p className="text-xs text-gray-400">
                    ✔️ Status: {validationResult.status}
                  </p>
                )}

                {validationResult.expires_at && (
                  <p className="text-xs text-gray-400">
                    📅 Expires:{" "}
                    {new Date(validationResult.expires_at).toLocaleDateString(
                      "en-US"
                    )}
                  </p>
                )}
              </div>
            )}

            {/* LOGIN BUTTON */}
            <button
              onClick={handleValidateLicense}
              disabled={loading || !licenseKey.trim()}
              className="w-full py-3 bg-[#00FF9C] text-[#0E0E12] hover:bg-[#00cc80] font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed mb-6 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin">⏳</span>
                  Validating...
                </>
              ) : (
                <>
                  <FaKey /> Login with License Key
                </>
              )}
            </button>

            {/* DIVIDER */}
            <div className="border-t border-[#2C2C34] my-6"></div>

            {/* INFO SECTION */}
            <div className="space-y-4 text-sm">
              <div className="bg-blue-600/20 border border-blue-600 rounded p-4">
                <p className="font-bold text-blue-400 mb-2">💡 How it works:</p>
                <ol className="text-blue-300 text-xs space-y-1 ml-4 list-decimal">
                  <li>Get your license key from your developer</li>
                  <li>Paste it in the field above</li>
                  <li>Click "Login with License Key"</li>
                  <li>Your license will be validated</li>
                  <li>Access your dashboard!</li>
                </ol>
              </div>

              <div className="bg-green-600/20 border border-green-600 rounded p-4">
                <p className="font-bold text-green-400 mb-2">✨ Features:</p>
                <ul className="text-green-300 text-xs space-y-1 ml-4 list-disc">
                  <li>Real-time license validation</li>
                  <li>Encrypted data transfer</li>
                  <li>Activation tracking</li>
                  <li>Expiration date check</li>
                </ul>
              </div>
            </div>

            {/* DIVIDER */}
            <div className="border-t border-[#2C2C34] my-6"></div>

            {/* FOOTER */}
            <div className="text-center text-xs text-gray-500">
              <p>🔒 Secure license validation system</p>
              <p className="mt-2">
                Don't have a license?{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="text-[#00FF9C] hover:underline font-bold"
                >
                  Sign up here
                </button>
              </p>
            </div>

            {/* DEBUG TOGGLE */}
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="mt-4 w-full py-2 text-xs text-gray-500 hover:text-gray-400 border border-gray-600 rounded hover:bg-[#2C2C34] transition"
            >
              {showDebug ? "Hide" : "Show"} Debug Info
            </button>

            {/* DEBUG INFO (Development Only) */}
            {showDebug && (
              <div className="mt-4 bg-yellow-600/20 border border-yellow-600 rounded p-3">
                <p className="text-xs font-bold text-yellow-400 mb-2">
                  🔧 DEBUG INFO (Dev Only)
                </p>
                <div className="text-xs text-gray-400 space-y-1 font-mono">
                  <p>License Key: {licenseKey || "empty"}</p>
                  <p>Validation Result: {validationResult ? "yes" : "no"}</p>
                  {validationResult && (
                    <>
                      <p>Valid: {validationResult.valid ? "true" : "false"}</p>
                      <p>Product: {validationResult.product_name}</p>
                      <p>Status: {validationResult.status}</p>
                      <p>Message: {validationResult.message}</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ALTERNATIVE LOGIN OPTIONS */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl w-full">
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-4 text-center hover:border-purple-600 transition cursor-pointer"
              onClick={() => navigate("/dev-login")}
            >
              <p className="text-2xl mb-2">👨‍💻</p>
              <h3 className="font-bold mb-1">Developer</h3>
              <p className="text-xs text-gray-400">Developer account login</p>
            </div>

            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-4 text-center hover:border-green-600 transition cursor-pointer"
              onClick={() => navigate("/reseller-login")}
            >
              <p className="text-2xl mb-2">🛍️</p>
              <h3 className="font-bold mb-1">Reseller</h3>
              <p className="text-xs text-gray-400">Reseller account login</p>
            </div>

            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-4 text-center hover:border-blue-600 transition cursor-pointer"
              onClick={() => navigate("/login")}
            >
              <p className="text-2xl mb-2">👤</p>
              <h3 className="font-bold mb-1">Customer</h3>
              <p className="text-xs text-gray-400">Customer account login</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}