// src/pages/DeveloperDocs.tsx - API DOKUMENTATION
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBook, FaArrowLeft, FaCode, FaCheck, FaCopy } from "react-icons/fa";
import { useDialog } from "../components/Dialog";

export default function DeveloperDocs() {
  const navigate = useNavigate();
  const { Dialog: DialogComponent, open: openDialog } = useDialog();

  const [copied, setCopied] = useState<string | null>(null);

  function copyToClipboard(code: string, id: string) {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  const codeExamples = {
    validate: `// POST /api/v1/licenses/validate
const response = await fetch(
  'https://api.cloudlicensepro.com/v1/licenses/validate',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      license_key: 'PROD-CUST-ABC123-XYZ1',
      program_id: 'mein-programm',
      version: '1.0.0'
    })
  }
);

const data = await response.json();
// Response: { valid: true, status: 'active', expires_at: '2025-12-31' }`,

    python: `# Python Example
import requests

api_key = 'YOUR_API_KEY'
headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json'
}

data = {
    'license_key': 'PROD-CUST-ABC123-XYZ1',
    'program_id': 'mein-programm'
}

response = requests.post(
    'https://api.cloudlicensepro.com/v1/licenses/validate',
    json=data,
    headers=headers
)

result = response.json()
if result['valid'] and result['status'] == 'active':
    print('✅ License valid!')
else:
    print('❌ License invalid!')`,

    csharp: `// C# Example
using System;
using System.Net.Http;
using System.Threading.Tasks;

class Program {
    static async Task Main() {
        using (var client = new HttpClient()) {
            client.DefaultRequestHeaders.Add(
                "Authorization",
                "Bearer YOUR_API_KEY"
            );

            var content = new StringContent(
                @"{ ""license_key"": ""PROD-CUST-ABC123-XYZ1"",
                    ""program_id"": ""mein-programm"" }",
                System.Text.Encoding.UTF8,
                "application/json"
            );

            var response = await client.PostAsync(
                "https://api.cloudlicensepro.com/v1/licenses/validate",
                content
            );

            var result = await response.Content.ReadAsAsync<dynamic>();
            if (result.valid && result.status == "active") {
                Console.WriteLine("✅ License valid!");
            }
        }
    }
}`,
  };

  return (
    <>
      {DialogComponent}

      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0]">
        {/* HEADER */}
        <div className="bg-[#1A1A1F] border-b border-[#2C2C34] p-6 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto">
            <button
              onClick={() => navigate("/dev-dashboard")}
              className="flex items-center gap-2 text-gray-400 hover:text-[#00FF9C] transition mb-4"
            >
              <FaArrowLeft /> Zurück
            </button>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FaBook className="text-[#00FF9C]" />
              API Dokumentation
            </h1>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-8">
          {/* TABLE OF CONTENTS */}
          <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 mb-8">
            <h2 className="font-bold text-lg mb-4">📑 Inhaltsverzeichnis</h2>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#intro" className="text-[#00FF9C] hover:underline">
                  → Einleitung
                </a>
              </li>
              <li>
                <a href="#auth" className="text-[#00FF9C] hover:underline">
                  → Authentication
                </a>
              </li>
              <li>
                <a href="#endpoints" className="text-[#00FF9C] hover:underline">
                  → Endpoints
                </a>
              </li>
              <li>
                <a href="#examples" className="text-[#00FF9C] hover:underline">
                  → Code Beispiele
                </a>
              </li>
              <li>
                <a href="#errors" className="text-[#00FF9C] hover:underline">
                  → Fehlerbehandlung
                </a>
              </li>
            </ul>
          </div>

          {/* INTRODUCTION */}
          <div id="intro" className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">🎯 Einleitung</h2>
            <p className="text-gray-300 mb-4">
              Die CloudLicensePro API ermöglicht es dir, Lizenzen in deinen Anwendungen zu
              validieren und zu verwalten. Mit einfachen REST API Calls kannst du:
            </p>
            <ul className="space-y-2 text-gray-300">
              <li>✅ License Keys validieren</li>
              <li>✅ Lizenz-Status prüfen</li>
              <li>✅ Aktivierungen tracken</li>
              <li>✅ Abgelaufene Lizenzen erkennen</li>
            </ul>
          </div>

          {/* AUTHENTICATION */}
          <div id="auth" className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">🔐 Authentication</h2>
            <p className="text-gray-300 mb-4">
              Alle API Requests müssen deinen API Key im Authorization Header enthalten:
            </p>

            <div className="bg-[#0E0E12] border border-[#2C2C34] rounded p-3 mb-4">
              <p className="text-xs text-gray-400 mb-2">Authorization Header:</p>
              <code className="text-sm font-mono text-[#00FF9C]">
                Authorization: Bearer sk_live_xxxxxxxxxxxxx
              </code>
            </div>

            <div className="bg-yellow-600/20 border border-yellow-600 rounded p-4">
              <p className="text-sm text-yellow-300">
                <strong>⚠️ Wichtig:</strong> Speichere deinen API Key niemals in öffentlichem Code
                (GitHub, etc.). Nutze Environment Variablen!
              </p>
            </div>
          </div>

          {/* ENDPOINTS */}
          <div id="endpoints" className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6">🔌 API Endpoints</h2>

            {/* Endpoint 1 */}
            <div className="mb-8 pb-8 border-b border-[#2C2C34]">
              <h3 className="text-lg font-bold text-[#00FF9C] mb-2">
                POST /v1/licenses/validate
              </h3>
              <p className="text-gray-400 mb-4">
                Validiert einen License Key und gibt seinen Status zurück.
              </p>

              <div className="bg-[#0E0E12] border border-[#2C2C34] rounded p-4 mb-4">
                <p className="text-xs text-gray-400 mb-2">Request Body:</p>
                <pre className="text-xs font-mono text-gray-300 overflow-x-auto">{`{
  "license_key": "PROD-CUST-ABC123-XYZ1",
  "program_id": "mein-programm",
  "version": "1.0.0" (optional)
}`}</pre>
              </div>

              <div className="bg-[#0E0E12] border border-green-600 rounded p-4">
                <p className="text-xs text-gray-400 mb-2">Response (200 OK):</p>
                <pre className="text-xs font-mono text-green-300 overflow-x-auto">{`{
  "valid": true,
  "status": "active",
  "expires_at": "2025-12-31",
  "program_id": "mein-programm",
  "customer_name": "John Doe"
}`}</pre>
              </div>
            </div>

            {/* Endpoint 2 */}
            <div className="mb-8 pb-8 border-b border-[#2C2C34]">
              <h3 className="text-lg font-bold text-[#00FF9C] mb-2">
                GET /v1/licenses/status/:license_key
              </h3>
              <p className="text-gray-400 mb-4">
                Fragt den Status eines License Keys ab.
              </p>

              <div className="bg-[#0E0E12] border border-[#2C2C34] rounded p-4 mb-4">
                <p className="text-xs text-gray-400 mb-2">URL:</p>
                <pre className="text-xs font-mono text-gray-300">{`GET /v1/licenses/status/PROD-CUST-ABC123-XYZ1`}</pre>
              </div>

              <div className="bg-[#0E0E12] border border-green-600 rounded p-4">
                <p className="text-xs text-gray-400 mb-2">Response (200 OK):</p>
                <pre className="text-xs font-mono text-green-300 overflow-x-auto">{`{
  "license_key": "PROD-CUST-ABC123-XYZ1",
  "status": "active",
  "expires_at": "2025-12-31",
  "activations": 2,
  "max_activations": 5
}`}</pre>
              </div>
            </div>

            {/* Error Response */}
            <div className="bg-red-600/20 border border-red-600 rounded p-4">
              <p className="text-sm font-bold text-red-400 mb-2">Error Response (400):</p>
              <pre className="text-xs font-mono text-red-300 overflow-x-auto">{`{
  "valid": false,
  "error": "License key not found",
  "status": 400
}`}</pre>
            </div>
          </div>

          {/* CODE EXAMPLES */}
          <div id="examples" className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6">💻 Code Beispiele</h2>

            {/* JavaScript */}
            <div className="mb-8 pb-8 border-b border-[#2C2C34]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-yellow-400 flex items-center gap-2">
                  <FaCode /> JavaScript / Node.js
                </h3>
                <button
                  onClick={() => copyToClipboard(codeExamples.validate, "validate")}
                  className={`px-3 py-1 rounded text-sm font-bold transition ${
                    copied === "validate"
                      ? "bg-green-600"
                      : "bg-gray-600 hover:bg-gray-700"
                  }`}
                >
                  {copied === "validate" ? (
                    <>
                      <FaCheck className="inline mr-1" /> Kopiert!
                    </>
                  ) : (
                    <>
                      <FaCopy className="inline mr-1" /> Kopieren
                    </>
                  )}
                </button>
              </div>

              <div className="bg-[#0E0E12] border border-[#2C2C34] rounded p-4 overflow-x-auto">
                <pre className="text-xs font-mono text-gray-300">
                  {codeExamples.validate}
                </pre>
              </div>
            </div>

            {/* Python */}
            <div className="mb-8 pb-8 border-b border-[#2C2C34]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2">
                  <FaCode /> Python
                </h3>
                <button
                  onClick={() => copyToClipboard(codeExamples.python, "python")}
                  className={`px-3 py-1 rounded text-sm font-bold transition ${
                    copied === "python"
                      ? "bg-green-600"
                      : "bg-gray-600 hover:bg-gray-700"
                  }`}
                >
                  {copied === "python" ? (
                    <>
                      <FaCheck className="inline mr-1" /> Kopiert!
                    </>
                  ) : (
                    <>
                      <FaCopy className="inline mr-1" /> Kopieren
                    </>
                  )}
                </button>
              </div>

              <div className="bg-[#0E0E12] border border-[#2C2C34] rounded p-4 overflow-x-auto">
                <pre className="text-xs font-mono text-gray-300">
                  {codeExamples.python}
                </pre>
              </div>
            </div>

            {/* C# */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-purple-400 flex items-center gap-2">
                  <FaCode /> C#
                </h3>
                <button
                  onClick={() => copyToClipboard(codeExamples.csharp, "csharp")}
                  className={`px-3 py-1 rounded text-sm font-bold transition ${
                    copied === "csharp"
                      ? "bg-green-600"
                      : "bg-gray-600 hover:bg-gray-700"
                  }`}
                >
                  {copied === "csharp" ? (
                    <>
                      <FaCheck className="inline mr-1" /> Kopiert!
                    </>
                  ) : (
                    <>
                      <FaCopy className="inline mr-1" /> Kopieren
                    </>
                  )}
                </button>
              </div>

              <div className="bg-[#0E0E12] border border-[#2C2C34] rounded p-4 overflow-x-auto">
                <pre className="text-xs font-mono text-gray-300">
                  {codeExamples.csharp}
                </pre>
              </div>
            </div>
          </div>

          {/* ERROR HANDLING */}
          <div id="errors" className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">⚠️ Fehlerbehandlung</h2>

            <div className="space-y-4">
              <div className="bg-[#0E0E12] border border-[#2C2C34] rounded p-4">
                <p className="font-bold text-red-400 mb-2">400 - Invalid Request</p>
                <p className="text-sm text-gray-300">
                  Der Request ist ungültig (fehlende Parameter, falsches Format)
                </p>
              </div>

              <div className="bg-[#0E0E12] border border-[#2C2C34] rounded p-4">
                <p className="font-bold text-red-400 mb-2">401 - Unauthorized</p>
                <p className="text-sm text-gray-300">
                  API Key ist ungültig oder fehlt
                </p>
              </div>

              <div className="bg-[#0E0E12] border border-[#2C2C34] rounded p-4">
                <p className="font-bold text-red-400 mb-2">404 - Not Found</p>
                <p className="text-sm text-gray-300">
                  License Key existiert nicht
                </p>
              </div>

              <div className="bg-[#0E0E12] border border-[#2C2C34] rounded p-4">
                <p className="font-bold text-red-400 mb-2">429 - Rate Limited</p>
                <p className="text-sm text-gray-300">
                  Zu viele Requests. Bitte warten und erneut versuchen.
                </p>
              </div>
            </div>
          </div>

          {/* SUPPORT */}
          <div className="bg-green-600/20 border border-green-600 rounded-lg p-6">
            <h3 className="font-bold text-green-400 mb-3">💬 Support & Hilfe</h3>
            <p className="text-sm text-gray-300 mb-3">
              Fragen zur API? Wir helfen gerne!
            </p>
            <div className="space-y-2 text-sm">
              <p>📧 Email: support@cloudlicensepro.com</p>
              <p>💬 Discord: <button className="text-[#00FF9C] hover:underline">Join Community</button></p>
              <p>📚 Status: <button className="text-[#00FF9C] hover:underline">api.cloudlicensepro.com/status</button></p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
