"""
Verify that order status configuration is correct
"""
import os
import sys

def check_files():
    """Check all files for correct order status configuration"""
    issues = []
    
    print("="*60)
    print("VERIFYING ORDER STATUS CONFIGURATION")
    print("="*60)
    
    # Check 1: models.py should NOT have default='processing'
    print("\n1. Checking flask-backend/models.py...")
    with open('flask-backend/models.py', 'r') as f:
        content = f.read()
        if "default='processing'" in content or 'default="processing"' in content:
            issues.append("❌ models.py still has default='processing'")
        else:
            print("   ✓ No default status in models.py")
    
    # Check 2: orders.py should set status to pending_payment
    print("\n2. Checking flask-backend/routes/orders.py...")
    with open('flask-backend/routes/orders.py', 'r') as f:
        content = f.read()
        if "initial_status = 'pending_payment'" in content:
            print("   ✓ Checkout sets status to 'pending_payment'")
        else:
            issues.append("❌ orders.py doesn't set initial_status to 'pending_payment'")
    
    # Check 3: Database file
    print("\n3. Checking database...")
    if os.path.exists('flask-backend/instance/data.db'):
        print("   ⚠ Database exists (may have old schema)")
        print("   → Run: bash scripts/fix-order-status.sh")
    else:
        print("   ✓ No database file (will be created fresh)")
    
    # Check 4: Frontend checkout page
    print("\n4. Checking client/src/pages/checkout.tsx...")
    with open('client/src/pages/checkout.tsx', 'r') as f:
        content = f.read()
        if "pending_payment" in content:
            print("   ✓ Checkout page handles 'pending_payment' status")
        else:
            issues.append("❌ checkout.tsx missing 'pending_payment' handling")
    
    print("\n" + "="*60)
    if issues:
        print("ISSUES FOUND:")
        for issue in issues:
            print(f"  {issue}")
        print("="*60)
        return False
    else:
        print("✓ ALL CHECKS PASSED!")
        print("="*60)
        print("\nConfiguration is correct. If orders still show 'processing',")
        print("you need to reset the database:")
        print("  bash scripts/fix-order-status.sh")
        print("="*60)
        return True

if __name__ == '__main__':
    os.chdir('/workspaces/TechBazaar-main')
    success = check_files()
    sys.exit(0 if success else 1)
