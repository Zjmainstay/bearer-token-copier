# Privacy Policy

**Bearer Token Copier** respects and protects user privacy.

---

## 1. Data Collection

**This extension does not collect, store, or transmit any user data.**

We do not collect:
- Personal identification information
- Browsing history
- Website content
- User behavior data
- Authentication tokens or Cookie values (except temporarily in memory during copy operation)

---

## 2. Data Processing

All operations are performed **locally on your device**:

- **Tokens / Cookie values exist only temporarily in browser memory**
  - Captured when you click the extension icon
  - Copied to clipboard immediately
  - Released from memory after copy operation
  - Automatically cleared when browser is closed

- **Local configuration storage**
  - Uses `chrome.storage.local` to save your selected copy mode (Bearer Token or Cookie) and Cookie name
  - Configuration data is stored only on your device and is never synced to the cloud or sent to any server

- **No remote servers**
  - No data is sent to any server
  - No cloud services are used
  - Works completely offline

---

## 3. Third-Party Sharing

**This extension does not share data with any third parties.**

- No analytics tools
- No advertising networks
- No third-party services
- No external APIs

---

## 4. Permission Usage

This extension requests the following permissions, used only for core functionality:

### webRequest
- **Purpose**: Read HTTP request headers to capture Authorization tokens
- **Scope**: Read-only, does not modify requests
- **Privacy**: Does not log complete request content

### activeTab
- **Purpose**: Refresh current tab to trigger new requests
- **Scope**: Only when user clicks extension icon
- **Privacy**: Does not access other tabs

### clipboardWrite
- **Purpose**: Copy captured token or Cookie value to clipboard
- **Scope**: Write-only, does not read clipboard
- **Privacy**: Only copies the value actively triggered by the user

### notifications
- **Purpose**: Display operation results to user
- **Scope**: Only operation feedback (success/failure)
- **Privacy**: No marketing or ads

### storage
- **Purpose**: Save user configuration locally (copy mode, Cookie name)
- **Scope**: Only stores the extension's own settings; does not read data from other extensions or websites
- **Privacy**: Configuration data never leaves your device

### cookies
- **Purpose**: Read the value of a specific named Cookie from the current page in Cookie mode
- **Scope**: Only triggered when the user actively clicks the icon with Cookie mode configured; reads only the single Cookie specified by the user
- **Privacy**: Does not scan or log other cookies

**All permissions are only used when you actively click the extension icon.** No automatic background data collection.

---

## 5. Security

We take security seriously:

- ✅ **Open source**: All code is publicly available on [GitHub](https://github.com/Zjmainstay/bearer-token-copier)
- ✅ **No remote logging**: No data is sent to servers
- ✅ **No analytics**: No tracking or monitoring
- ✅ **Local only**: All processing happens on your device
- ✅ **Transparent**: You can review the source code yourself

---

## 6. Children's Privacy

This extension is designed for developers and does not knowingly collect information from children under 13.

---

## 7. Changes to This Privacy Policy

We may update this privacy policy from time to time. Any changes will be posted on this page with an updated revision date.

---

## 8. Compliance

This extension complies with:
- Chrome Web Store Developer Program Policies
- Google API Services User Data Policy
- GDPR (General Data Protection Regulation)
- CCPA (California Consumer Privacy Act)

---

## 9. Contact Us

If you have any questions about this Privacy Policy, please contact us:

- **GitHub Issues**: https://github.com/Zjmainstay/bearer-token-copier/issues
- **GitHub Profile**: https://github.com/Zjmainstay

---

## 10. Your Rights

You have the right to:
- Know what data is collected (none in this case)
- Access your data (no personal data is stored)
- Delete your data (local configuration can be cleared at any time by uninstalling the extension)
- Opt-out of data collection (none is collected)

---

**Last Updated**: April 21, 2026

**Version**: 1.0.1

---

## Summary

**In simple terms:**
- ✅ We don't collect your data
- ✅ Everything happens on your device
- ✅ No servers, no tracking, no ads
- ✅ Local configuration stays on your device and is never uploaded
- ✅ Open source and transparent

**Your privacy is fully protected.**
