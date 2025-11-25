# Payment Options Feature

## Overview
Added payment method selection to the checkout process with two options:
1. **Cash on Delivery (COD)** - Pay when you receive your order
2. **Online Payment** - GCash, PayMaya, or Bank Transfer

## Features

### For Customers:
- Choose payment method during checkout
- **Cash on Delivery**: Simple pay-on-delivery option
- **Online Payment**: Receive detailed payment instructions via email from ryannoche116@gmail.com

### Email Notifications:
When customers select "Online Payment", they automatically receive an email containing:
- Order details and summary
- Payment methods available (GCash, PayMaya, Bank Transfer)
- Step-by-step payment instructions
- Proof of payment submission instructions
- Contact information for support

### Admin Features:
- View payment method for each order
- Payment method displayed in order details (both admin panel and user profile)

## Database Changes

A new `payment_method` column has been added to the `orders` table:
- Type: VARCHAR(32)
- Values: 'cod' (Cash on Delivery) or 'online' (Online Payment)
- Default: 'cod'

### Running the Migration:
```bash
cd flask-backend
python add_payment_method.py
```

## Email Configuration

The email system is configured to send from `ryannoche116@gmail.com`. 

**Current Status**: Email logging only (production setup required)

### To Enable Actual Email Sending:
1. Enable 2-factor authentication on the Gmail account (ryannoche116@gmail.com)
2. Generate an App Password in Gmail settings
3. Update `flask-backend/email_utils.py`:
   - Uncomment the SMTP code at the bottom of the `send_payment_email` function
   - Add the App Password to the `server.login()` call
   - Or better: Store credentials in environment variables

Example:
```python
# In email_utils.py
import os
server = smtplib.SMTP('smtp.gmail.com', 587)
server.starttls()
server.login(sender_email, os.getenv('GMAIL_APP_PASSWORD'))
server.sendmail(sender_email, receiver_email, msg.as_string())
server.quit()
```

## Files Modified

### Backend:
- `flask-backend/models.py` - Added payment_method field to Order model
- `flask-backend/routes/orders.py` - Handle payment_method in checkout, trigger email
- `flask-backend/email_utils.py` - NEW: Email sending utility with payment instructions
- `flask-backend/requirements.txt` - Added Flask-Mail==0.9.1
- `flask-backend/add_payment_method.py` - NEW: Database migration script

### Frontend:
- `client/src/pages/checkout.tsx` - Added payment method selection UI with radio buttons
- `client/src/components/admin/order-management.tsx` - Display payment method in order details
- `client/src/pages/profile.tsx` - Display payment method in user's order details

## Payment Instructions Template

The email sent to customers includes:
- **GCash**: 09XX XXX XXXX - Ryan Noche
- **PayMaya**: 09XX XXX XXXX - Ryan Noche  
- **Bank Transfer**: [Bank Name] - Account details

**Note**: Update the actual payment details in `flask-backend/email_utils.py` with real account numbers before going live.

## Testing

1. Go to checkout page
2. Select "Online Payment" method
3. Complete the order
4. Check console/logs for email notification (actual email requires SMTP setup)
5. Verify payment method shows in admin panel and user profile

## Security Notes

- Never commit Gmail App Passwords to git
- Use environment variables for sensitive credentials
- Consider using a dedicated email service (SendGrid, AWS SES) for production
- The current implementation logs emails instead of sending them for safety

## Next Steps

1. Set up proper email credentials
2. Update payment account details in email template
3. Test actual email sending
4. Consider adding email notifications for other order events (shipped, delivered, etc.)
