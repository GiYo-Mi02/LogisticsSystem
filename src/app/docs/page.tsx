'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

/**
 * API Documentation Page
 * ======================
 * Interactive Swagger/OpenAPI documentation for the LogIQ API.
 * 
 * Access at: /docs
 */
export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-6 px-8 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">🚀 LogIQ API Documentation</h1>
          <p className="text-blue-100 mt-2">
            Interactive OpenAPI documentation for the Logistics Management System
          </p>
          <div className="flex gap-4 mt-4">
            <a
              href="/dashboard/admin"
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
            >
              ← Back to Dashboard
            </a>
            <a
              href="/api/docs/spec"
              target="_blank"
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
            >
              📄 OpenAPI JSON
            </a>
          </div>
        </div>
      </header>

      {/* Swagger UI */}
      <main className="max-w-7xl mx-auto py-8 px-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <SwaggerUI url="/api/docs/spec" />
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-500">
        <p>LogIQ - Demonstrating OOP Principles with Real-World Application</p>
        <p className="text-sm mt-1">
          Factory Pattern • Strategy Pattern • Builder Pattern • Observer Pattern
        </p>
      </footer>
    </div>
  );
}
