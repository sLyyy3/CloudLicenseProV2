# CloudLicensePro - 5-Minute Quick Start

## What is CloudLicensePro?

A professional platform to manage software licenses. Think of it like managing Netflix subscriptions but for business software - you can create licenses, track usage, and manage devices.

## In Simple Terms 🎯

**3 Main Parts:**

1. **Admin Portal** - You (software company) manage everything
   - Create software products
   - Generate license keys
   - See who's using your software
   - Manage prices

2. **Customer Portal** - Your customers use this
   - View their licenses
   - Connect their devices
   - See when license expires
   - Renew subscription

3. **API** - Your software app uses this
   - Check if license is valid
   - Record feature usage
   - Activate licenses

## Step 1: Create Account

1. Go to the app
2. Click "Sign Up"
3. Enter email & password
4. Done! You now have an Admin account

## Step 2: Create Your First Product

1. Click "Products" in sidebar
2. Click "New Product"
3. Fill in:
   - Product Name: "My Amazing App"
   - Version: "1.0.0"
   - Description: "The best app ever"
4. Click "Save Product"

## Step 3: Create an Edition (Pricing Tier)

Editions are like "Basic", "Pro", "Enterprise":

1. In Products section, you should see your product
2. Click on it to expand
3. Click "Add Edition"
4. Fill in:
   - Name: "Pro"
   - Monthly Price: "99"
   - Annual Price: "999"
   - Max Devices: "5"
5. Click "Save"

## Step 4: Generate License Keys

1. Click "Licenses" in sidebar
2. Click "Generate Licenses"
3. Select the Edition you just created
4. Choose Type:
   - **Subscription** - Customer pays monthly/yearly
   - **Trial** - Free 30-day access
   - **Lifetime** - One-time purchase forever
5. Set Quantity: "10" (to create 10 licenses)
6. Click "Generate Licenses"

You now have 10 unique license keys! Copy one to test.

## Step 5: Give License to Customer

1. Share the license key with customer
2. They sign up in the app
3. They enter the license key
4. The license activates

## Step 6: Check Dashboard

1. Click "Dashboard"
2. You'll see:
   - Total licenses created
   - Active licenses (being used)
   - Monthly revenue estimate
   - List of recent licenses

## Step 7: View Analytics

1. Click "Analytics"
2. See:
   - How many times features are used
   - Which devices are active
   - Daily usage trends
   - Most popular features

## API Integration (For Your App)

Your software app needs to validate licenses. Here's how:

### Activate License in Your App

```javascript
// When user enters license key
const response = await fetch('api/license-api/activate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer YOUR_API_KEY`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    license_key: 'XXXX-XXXX-XXXX-XXXX',
    device_id: 'user-device-123',
    device_info: {
      name: 'John\'s Computer',
      os: 'windows',
    }
  }),
});

const data = await response.json();
if (data.success) {
  console.log('License activated!');
}
```

### Check if License is Still Valid

```javascript
// Before letting user use your app
const response = await fetch('api/license-api/validate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer YOUR_API_KEY`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    license_key: 'XXXX-XXXX-XXXX-XXXX'
  }),
});

const data = await response.json();
if (data.valid) {
  // User can use your app
} else {
  // License expired or invalid
  alert('Your license is ' + data.error);
}
```

### Track Feature Usage

```javascript
// When user exports a video (for pay-per-use)
await fetch('api/license-api/usage', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer YOUR_API_KEY`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    license_key: 'XXXX-XXXX-XXXX-XXXX',
    feature_key: 'video-export',
    amount: 1  // 1 video exported
  }),
});
```

## Getting Your API Key

1. Click "Settings"
2. Scroll to "API Keys"
3. Click "New API Key"
4. Name it: "Production"
5. Copy the key (you'll only see it once!)
6. Use it in your app

## Common Scenarios

### Scenario 1: SaaS Monthly Subscriptions
- License Type: **Subscription**
- Duration: 30 days, auto-renews
- Price: Monthly billing
- Best for: Cloud apps

### Scenario 2: Desktop App
- License Type: **Lifetime**
- Duration: Never expires
- Price: One-time purchase
- Best for: Installed software

### Scenario 3: Free Trial
- License Type: **Trial**
- Duration: 30 days
- Price: Free
- Best for: Evaluation

### Scenario 4: Metered Usage
- License Type: **Pay-per-Use**
- Usage: Track API calls, exports, etc.
- Price: Per unit
- Best for: API/SaaS services

### Scenario 5: Corporate Licenses
- License Type: **Floating**
- Concurrent Users: Max 100
- Price: Site license
- Best for: Companies

## Device Management

Each license can have multiple devices:

1. User activates license on Device A (gets offline token)
2. Later, user activates same license on Device B
3. Both devices can work offline for 30 days
4. Next time online, usage syncs back

## Offline Support

Users can work WITHOUT internet:

1. Activate license once (needs internet)
2. Get offline token (valid 30 days)
3. Can use app offline for 30 days
4. When back online, syncs everything

## Troubleshooting

### License Not Found
- Check license key spelling
- Make sure license exists in dashboard
- Try creating new license

### API Returns 401
- Check API key is copied correctly
- Make sure it's not expired
- Generate new API key if needed

### Device Can't Activate
- Check device isn't already on license with max devices
- Make sure license is activated (not still "inactive")
- Try refreshing the page

## Next Steps

1. ✅ Create products
2. ✅ Generate licenses
3. ✅ Integrate API in your app
4. ✅ Set up webhooks for events
5. ✅ Monitor analytics
6. ✅ Manage customer renewals

## File Structure

```
src/
├── App.tsx              # Main app routing
├── context/             # Auth state
│   └── AuthContext.tsx
├── pages/               # Pages for each section
│   ├── Auth.tsx
│   ├── Admin/
│   │   ├── Dashboard.tsx
│   │   ├── ProductManagement.tsx
│   │   ├── LicenseManagement.tsx
│   │   └── Analytics.tsx
│   ├── Customer/
│   │   └── MyLicenses.tsx
│   └── Settings.tsx
├── components/          # Reusable components
│   ├── Auth/
│   ├── Layout/
│   └── ...
├── services/            # Business logic
│   └── licenseService.ts
└── lib/                 # Utilities
    └── supabase.ts
```

## Key Concepts

| Term | Meaning |
|------|---------|
| **License Key** | Unique code customer gets (XXXX-XXXX-XXXX-XXXX) |
| **Edition** | Product version/tier (Basic, Pro, Enterprise) |
| **Device** | Computer/phone/device using license |
| **Offline Token** | Code that lets app work without internet |
| **API Key** | Secret credential to call the API |
| **Webhook** | Notification when something happens |

## Support & Help

- 📖 Full docs: README.md, API_DOCUMENTATION.md
- 🛠️ Dev guide: DEVELOPER_GUIDE.md
- ✨ Features: FEATURES.md
- 💬 Examples: See integration examples

---

**That's it!** You now have a complete license management system. 🚀

Next: Integrate the API into your app and start issuing licenses!
