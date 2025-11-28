# Profile Page - Quick Reference Guide

## 🚀 Access the Profile Page

### Method 1: Via Header (Desktop)
1. Click on your name in the top navigation
2. Click "My Profile" from dropdown menu

### Method 2: Via Mobile Menu
1. Click the menu icon (☰)
2. Click "My Profile" button

### Method 3: Direct URL
Navigate to: `http://localhost:3000/profile`

---

## 📋 Features Overview

### Tab 1: Profile Information

#### Personal Information Card
- **Email**: Your email address (cannot be changed)
- **Full Name**: Click "Edit" to update
- **Phone Number**: Click "Edit" to update

**How to Edit:**
1. Click the "Edit" button
2. Modify name and/or phone
3. Click "Save Changes" or "Cancel"

#### Shipping Address Card
- **Street Address**: Your delivery address
- **City**: City name
- **Province**: Province
- **ZIP Code**: Postal code
- **Country**: Default is Philippines

**How to Edit:**
1. Click the "Edit" button
2. Fill in all address fields
3. Click "Save Address" or "Cancel"

### Tab 2: My Orders

View all your orders in a table:
- **Order ID**: Unique identifier (8 characters shown)
- **Date**: When order was placed
- **Items**: Number of items in order
- **Total**: Order total amount
- **Status**: Current order status with color badge
- **Actions**: "View Details" button

**Order Status Colors:**
- 🟡 Pending/Processing = Gray
- 🟢 Confirmed/Shipped/Delivered = Green
- 🔴 Cancelled = Red

**View Order Details:**
1. Click "View Details" button
2. Modal shows:
   - Order info (ID, date, status)
   - Contact information
   - Shipping address
   - Item breakdown with prices
   - Order total
3. Click outside or close button to dismiss

---

## 🔒 Security Note

- You must be logged in to access this page
- If not logged in, you'll be redirected to login page
- You can only view and edit YOUR OWN information

---

## 💡 Tips

1. **Update your address early** - Speeds up checkout process
2. **Keep phone number updated** - Helps with delivery coordination
3. **Check order status regularly** - Track your purchases
4. **Save changes before navigating away** - Unsaved edits will be lost

---

## 🐛 Troubleshooting

**Profile won't load?**
- Make sure you're logged in
- Check your internet connection
- Try refreshing the page

**Can't save changes?**
- Check all required fields are filled
- Make sure you have internet connection
- Look for error toast notifications

**Don't see your orders?**
- Orders only appear after you've placed them
- Click "Start Shopping" to browse products
- Check that you're logged in with correct account

---

## 📱 Mobile Users

The profile page is fully responsive:
- Forms stack vertically for easy editing
- Order table scrolls horizontally
- All features work the same as desktop
- Access via mobile menu (☰ icon)

---

## 🎯 Quick Actions

| Action | Steps |
|--------|-------|
| Update name | Profile tab → Personal Info → Edit → Save |
| Update phone | Profile tab → Personal Info → Edit → Save |
| Add address | Profile tab → Shipping Address → Edit → Save |
| View orders | My Orders tab |
| Order details | My Orders tab → View Details button |

---

## 🔗 Related Pages

- **Home**: Browse products - `/`
- **Cart**: View cart - `/cart`
- **Checkout**: Place order - `/checkout`
- **Login**: Sign in - `/login`

---

## ⚡ Keyboard Shortcuts

- **Tab**: Navigate between fields
- **Enter**: Submit form (when editing)
- **Esc**: Close order details modal

---

## 📞 Need Help?

If you encounter any issues:
1. Check the console for errors (F12)
2. Try logging out and back in
3. Clear browser cache
4. Contact support with your issue details
