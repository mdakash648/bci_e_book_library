# OTP System for Firebase Free Plan

## Overview
This OTP (One-Time Password) system is designed to work with Firebase's free plan, providing phone number verification without requiring the Blaze plan for Firebase Phone Auth.

## How It Works

### 1. OTP Generation
- **Location**: `src/services/firebaseService.js` - `generateOTP()` method
- **Process**: 
  - Generates a 6-digit random OTP
  - Stores it in Firestore collection `otp_codes`
  - Sets 10-minute expiry time
  - Returns OTP for testing (in production, send via SMS)

### 2. OTP Verification
- **Location**: `src/services/firebaseService.js` - `verifyOTP()` method
- **Process**:
  - Checks if OTP exists in Firestore
  - Validates expiry time
  - Ensures OTP hasn't been used
  - Marks OTP as used after verification

### 3. Phone Registration/Login
- **Registration**: `createUserWithPhoneNumber()` requires OTP verification
- **Login**: `signInWithPhoneNumber()` requires OTP verification
- **Fallback**: Uses email/password auth with generated email from phone number

## Database Structure

### OTP Collection (`otp_codes`)
```javascript
{
  phoneNumber: "string",      // Phone number as document ID
  otp: "string",             // 6-digit OTP code
  createdAt: "timestamp",    // When OTP was created
  expiresAt: "timestamp",    // When OTP expires (10 minutes)
  used: "boolean",           // Whether OTP has been used
  verifiedAt: "timestamp"    // When OTP was verified (optional)
}
```

## Usage Flow

### Registration with Phone
1. User enters phone number
2. App detects phone input type
3. User clicks "Send OTP"
4. OTP is generated and stored in Firestore
5. User enters OTP code
6. OTP is verified before account creation
7. Account created with email fallback

### Login with Phone
1. User enters phone number
2. App detects phone input type
3. User clicks "Send OTP"
4. OTP is generated and stored in Firestore
5. User enters OTP and password
6. OTP is verified before login
7. Login proceeds with email fallback

## UI Components

### Register Screen
- **Phone Detection**: Automatically detects phone vs email input
- **OTP Input**: Shows when phone number is detected
- **Send OTP Button**: Generates and displays OTP
- **Validation**: Requires OTP for phone registration

### Login Screen
- **Phone Detection**: Automatically detects phone vs email input
- **OTP Input**: Shows when phone number is detected
- **Send OTP Button**: Generates and displays OTP
- **Validation**: Requires OTP for phone login

## Development Tools

### OTPManager Component
- **Location**: `src/components/OTPManager.jsx`
- **Purpose**: Development tool for managing OTP codes
- **Features**:
  - View all active OTPs
  - Clear expired OTPs
  - Clear all OTPs
  - Monitor OTP status

## Production Considerations

### SMS Integration
For production, replace the OTP display with actual SMS sending:

```javascript
// In generateOTP method, replace the return with:
// Send OTP via SMS service (Twilio, AWS SNS, etc.)
await sendSMS(phoneNumber, `Your OTP is: ${otp}`);
return { success: true, message: 'OTP sent via SMS' };
```

### Security Enhancements
- Rate limiting for OTP generation
- IP-based restrictions
- Phone number validation
- OTP complexity requirements

### Cleanup Jobs
- Set up scheduled cleanup of expired OTPs
- Monitor OTP usage patterns
- Implement OTP reuse prevention

## Firebase Free Plan Compatibility

### What Works
- ✅ Firestore storage for OTP codes
- ✅ Email/password authentication
- ✅ Real-time database operations
- ✅ Cloud Functions (if needed)

### What Doesn't Work
- ❌ Firebase Phone Auth (requires Blaze plan)
- ❌ SMS sending via Firebase (requires Blaze plan)

### Alternative SMS Services
- **Twilio**: Popular SMS service
- **AWS SNS**: Amazon's SMS service
- **SendGrid**: Email-based OTP
- **Local SMS Gateways**: Country-specific services

## Testing

### Test Phone Numbers
- Use any valid phone number format
- OTP will be displayed in alert for testing
- No actual SMS will be sent

### OTP Manager
- Access OTPManager component for development
- View all generated OTPs
- Clear expired or all OTPs
- Monitor OTP status and expiry

## Error Handling

### Common Errors
- **OTP Expired**: Clean up and regenerate
- **Invalid OTP**: Show error message
- **Already Used**: Prevent reuse
- **Network Issues**: Retry mechanism

### User Experience
- Clear error messages
- Automatic cleanup of expired OTPs
- Retry options for failed operations
- Loading states for all operations

## Configuration

### OTP Settings
```javascript
// In firebaseService.js
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const OTP_COLLECTION = 'otp_codes';
```

### Customization
- Change OTP length
- Adjust expiry time
- Modify OTP format
- Add additional validation

This OTP system provides a complete phone verification solution that works with Firebase's free plan while maintaining security and user experience standards.
