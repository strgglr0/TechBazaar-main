# Email & Password Reset Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd flask-backend
pip install -r requirements.txt
```

### 2. Configure Email Settings

#### Option A: Gmail (Recommended for Production)
1. Go to https://myaccount.google.com/apppasswords
2. Create an app password for "Mail"
3. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
4. Edit `.env` and add:
   ```env
   MAIL_USERNAME=your-gmail@gmail.com
   MAIL_PASSWORD=your-16-digit-app-password
   ```

#### Option B: Mailtrap (Recommended for Testing)
1. Sign up at https://mailtrap.io
2. Get your SMTP credentials from inbox settings
3. Edit `.env`:
   ```env
   MAIL_SERVER=smtp.mailtrap.io
   MAIL_PORT=2525
   MAIL_USERNAME=your-mailtrap-username
   MAIL_PASSWORD=your-mailtrap-password
   ```

#### Option C: Local Testing (Quick & Dirty)
```bash
# Terminal 1: Start fake SMTP server
python -m smtpd -n -c DebuggingServer localhost:1025

# Terminal 2: Set in .env
MAIL_SERVER=localhost
MAIL_PORT=1025
# (emails will print in Terminal 1)
```

### 3. Fix Database Schema

#### Option 1: Run Migrations (Preserves Data)
```bash
cd flask-backend
flask db migrate -m "Add password reset and order fields to User"
flask db upgrade
```

#### Option 2: Reset Database (Fresh Start)
```bash
# Backup first if needed
rm flask-backend/instance/data.db
# Restart Flask - will recreate with new schema
```

### 4. Fix Existing User Passwords
```bash
cd flask-backend
python fix_passwords.py
```

This will reset all user passwords to: **TechBazaar2025!**

The script will display all credentials like:
```
=== Admin Accounts ===
Email: admin@example.com | Password: TechBazaar2025! | Name: Admin User

=== User Accounts ===
Email: user@example.com | Password: TechBazaar2025! | Name: John Doe
```

---

## ✅ Testing the Features

### Test 1: Password Reset Flow

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Navigate to login page**: http://localhost:5000/login

3. **Click "Forgot password?"**

4. **Enter your email** (e.g., `user@example.com`)

5. **Check your email**:
   - Gmail: Check inbox
   - Mailtrap: Check web interface
   - Local SMTP: Check terminal output

6. **Enter the 6-digit code** from email

7. **Set new password** and confirm

8. **Login with new password**

### Test 2: Order Confirmation Email

1. **Login to your account**

2. **Add products to cart**

3. **Proceed to checkout**

4. **Complete the order**

5. **Check your email** for order confirmation with:
   - Order number
   - Items ordered (with quantities and prices)
   - Total amount
   - Shipping address

---

## 🔧 Troubleshooting

### Email Not Sending

**Check 1: Verify .env configuration**
```bash
cat flask-backend/.env | grep MAIL
```

**Check 2: Test email connection**
```python
# In flask-backend directory
python
>>> from flask import Flask
>>> from email_service import mail
>>> app = Flask(__name__)
>>> app.config.from_prefixed_env()
>>> mail.init_app(app)
>>> with app.app_context():
...     print("Email configured:", mail.state)
```

**Check 3: View Flask logs**
```bash
tail -f flask-backend/flask.log
```

### Password Reset Code Not Working

**Issue**: "Invalid or expired code"
- Codes expire after 15 minutes
- Check that database migration ran (User table has `reset_token` column)
- Verify code entry (6 digits, no spaces)

**Issue**: "Email not found"
- Run `fix_passwords.py` to ensure users exist
- Check database: `sqlite3 flask-backend/instance/data.db "SELECT email FROM user;"`

### Database Schema Issues

**Error**: "no such column: user.reset_token"

**Solution**: Run migrations or reset database (see Step 3 above)

**Check current schema**:
```bash
sqlite3 flask-backend/instance/data.db ".schema user"
```

Should include:
- `reset_token VARCHAR(10)`
- `reset_token_expires DATETIME`
- `phone VARCHAR(15)`
- `shipping_address TEXT`

---

## 📋 Features Implemented

### ✅ Password Reset System
- 6-digit email verification codes
- 15-minute expiration for security
- Three-step flow: Request → Verify → Reset
- Professional HTML email templates
- Non-revealing responses (security best practice)

### ✅ Order Confirmation Emails
- Sent automatically after checkout
- Full order details with items table
- Order number and timestamp
- Shipping address
- Total amount breakdown
- Professional HTML formatting

### ✅ Frontend Pages
- `/forgot-password` - Multi-step password reset interface
- Integrated with login page
- Real-time code validation
- Password strength requirements
- User-friendly error messages

---

## 🔐 Default Credentials

After running `fix_passwords.py`, all users have:

**Password**: `TechBazaar2025!`

Users should:
1. Login with this password
2. Change it immediately, OR
3. Use the forgot password flow to set a new one

---

## 📁 Files Modified/Created

**Backend**:
- `flask-backend/email_service.py` - Email sending logic
- `flask-backend/routes/auth.py` - Password reset endpoints
- `flask-backend/routes/orders.py` - Order email integration
- `flask-backend/models.py` - User model updates
- `flask-backend/app.py` - Email configuration
- `flask-backend/requirements.txt` - Flask-Mail dependency
- `flask-backend/fix_passwords.py` - Password reset utility
- `flask-backend/.env.example` - Configuration template

**Frontend**:
- `client/src/pages/forgot-password.tsx` - Password reset UI
- `client/src/pages/login.tsx` - Added forgot password link
- `client/src/App.tsx` - Added /forgot-password route

---

## 🎯 Next Steps

1. **Configure email** (Step 2 above)
2. **Update database schema** (Step 3 above)
3. **Reset passwords** (Step 4 above)
4. **Test password reset flow**
5. **Test order confirmation emails**
6. **Share new default password with users**
7. **Monitor email delivery** in production

---

## 💡 Production Tips

1. **Use Gmail with App Password** (most reliable)
2. **Set up DMARC/SPF** to avoid spam folder
3. **Monitor email sending** with logging
4. **Set rate limits** on /forgot-password endpoint
5. **Add CAPTCHA** to prevent abuse
6. **Consider email service** (SendGrid, AWS SES) for scaling

---

Need help? Check the error logs or review the implementation files!
