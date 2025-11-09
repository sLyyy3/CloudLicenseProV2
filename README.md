# CloudLicensePro - Enterprise License Management Platform

A comprehensive web-based platform for managing software licenses, tracking usage, supporting multiple license models, and integrating with back-office systems.

## 🚀 Features

### License Management
- Generate and manage unique license keys
- Support for 5 license types: Subscription, Trial, Lifetime, Pay-per-Use, Floating
- License activation, validation, renewal, and revocation
- Hardware/device binding and device switching
- Offline license validation support

### Analytics & Dashboards
- Real-time usage tracking and visualization
- Feature usage analytics
- Device monitoring
- Time-range based reporting
- Revenue and licensing KPIs

### Multi-Portal Architecture
- **Admin Portal** - Vendor dashboard for license management
- **Customer Portal** - End-user license and device management
- **Reseller Portal** - Reseller customer and license management

### API & Integration
- REST API for license validation and activation
- Webhook system for real-time events
- API key management and security
- Code examples for JavaScript, Python, and C#

### Security & Compliance
- Row-level security (RLS) with role-based access control
- Multi-tenant data isolation
- HMAC-SHA256 webhook signatures
- Audit logging and activity tracking
- GDPR-ready data handling

## 📋 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- Modern browser

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Environment Setup

Create `.env` with your Supabase credentials:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 🏗️ Architecture

```
Frontend (React + TypeScript)
├── Auth Pages
├── Admin Portal
├── Customer Portal
├── Reseller Portal
└── Settings

Backend (Supabase)
├── PostgreSQL Database
├── Authentication (Email/Password)
├── Edge Functions (API & Webhooks)
└── RLS Policies (Security)

API Layer
├── License Activation
├── License Validation
├── Usage Tracking
└── Webhook Dispatch
```

## 📚 Documentation

- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Complete API reference with examples
- **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** - Development setup and architecture
- **[FEATURES.md](./FEATURES.md)** - Complete feature list (150+ features)

## 🔑 Core API Endpoints

### Activate License
```bash
POST /license-api/activate
{
  "license_key": "XXXX-XXXX-XXXX-XXXX",
  "device_id": "device-123",
  "device_info": { "name": "My Device", "os": "windows" }
}
```

### Validate License
```bash
POST /license-api/validate
{
  "license_key": "XXXX-XXXX-XXXX-XXXX"
}
```

### Record Usage
```bash
POST /license-api/usage
{
  "license_key": "XXXX-XXXX-XXXX-XXXX",
  "feature_key": "video-exports",
  "amount": 5
}
```

## 📊 Database Schema

### Core Tables
- `organizations` - Vendors and Resellers
- `products` - Software products
- `editions` - Product SKUs (Basic, Pro, Enterprise)
- `licenses` - Individual licenses
- `devices` - Hardware bound to licenses
- `usage_events` - Feature usage tracking
- `customers` - End-users
- `api_keys` - Integration credentials
- `audit_logs` - Activity tracking

## 🔐 License Types

| Type | Duration | Devices | Use Case |
|------|----------|---------|----------|
| **Subscription** | Time-limited | Multiple | SaaS applications |
| **Trial** | 30 days | Single | Evaluation |
| **Lifetime** | Perpetual | Multiple | Desktop apps |
| **Pay-per-Use** | Flexible | Multiple | Metered services |
| **Floating** | Time-limited | Concurrent pool | Corporate use |

## 🎯 User Roles

- **Admin** - Vendor dashboard, full license management
- **Reseller** - Customer management, license distribution
- **Customer** - View licenses, manage devices

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Icons**: Lucide React
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **API**: REST with JSON payloads
- **Authentication**: Email/Password + JWT

## 📱 Responsive Design

Fully responsive design supporting:
- Desktop (1920px+)
- Tablet (768px-1919px)
- Mobile (320px-767px)

## 🔄 Integration Examples

### JavaScript
```javascript
const response = await fetch('api/license-api/validate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ license_key: 'XXXX-XXXX-XXXX-XXXX' }),
});
```

### Python
```python
import requests

response = requests.post(
  'api/license-api/validate',
  headers={'Authorization': f'Bearer {api_key}'},
  json={'license_key': 'XXXX-XXXX-XXXX-XXXX'}
)
```

## 📊 Dashboard Features

### Admin Dashboard
- License KPIs (total, active, expired)
- Monthly revenue
- Recent licenses table
- Quick action buttons
- Analytics overview

### Customer Dashboard
- License overview
- Connected devices
- Expiration alerts
- Renewal options
- Usage history

### Analytics Dashboard
- Usage trends
- Top features
- Device breakdown
- Time-range filtering
- Export capabilities

## 🚀 Deployment

### Frontend
Deploy to Vercel, Netlify, or any static host:
```bash
npm run build
# Upload dist/ to your host
```

### Backend
Edge Functions deploy automatically via Supabase.

## 🔐 Security Features

- ✅ Row-level security on all tables
- ✅ Multi-tenant data isolation
- ✅ API key encryption
- ✅ HMAC-SHA256 webhook signatures
- ✅ Audit logging
- ✅ Session management
- ✅ HTTPS enforced

## 📈 Performance

- Build size: ~142KB (gzipped)
- Lazy loading components
- Optimized database queries
- Indexed frequently-queried columns
- Response caching support

## 🐛 Troubleshooting

### API Returns 401
- Verify API key is valid
- Check Authorization header format
- Ensure key hasn't expired

### License Not Found
- Verify license_key format
- Check license exists in database
- Confirm organization_id

### Offline Mode
- Offline tokens valid for 30 days
- Must go online to refresh
- Sync usage on reconnection

## 📞 Support

For issues, questions, or contributions:
- 📧 Email: support@cloudlicensepro.com
- 📖 Documentation: See docs folder
- 🐙 GitHub: [repository]

## 📄 License

CloudLicensePro Platform © 2024

## 🙏 Acknowledgments

Built with:
- React
- Supabase
- Tailwind CSS
- Lucide React
- TypeScript

---

**Current Version:** 1.0.0
**Last Updated:** 2024
**Status:** Production Ready
