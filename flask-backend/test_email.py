#!/usr/bin/env python3
"""
Quick test script to verify email configuration
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from app import create_app
from email_service import send_password_reset_email

app = create_app()

with app.app_context():
    print("\n" + "=" * 80)
    print("EMAIL CONFIGURATION TEST")
    print("=" * 80 + "\n")
    
    # Print current configuration
    print("Current Email Settings:")
    print(f"  Server: {app.config['MAIL_SERVER']}:{app.config['MAIL_PORT']}")
    print(f"  TLS: {app.config['MAIL_USE_TLS']}")
    print(f"  Username: {app.config['MAIL_USERNAME'] or '(not set)'}")
    print(f"  Default Sender: {app.config['MAIL_DEFAULT_SENDER']}")
    
    print("\n" + "-" * 80)
    
    # Check if using local SMTP
    if app.config['MAIL_SERVER'] == 'localhost' and app.config['MAIL_PORT'] == 1025:
        print("\n⚠️  Using LOCAL SMTP SERVER for testing")
        print("   Start it with: python -m smtpd -n -c DebuggingServer localhost:1025")
        print("   Emails will print to console instead of actually sending\n")
    elif not app.config['MAIL_USERNAME']:
        print("\n⚠️  MAIL_USERNAME not configured")
        print("   Set it in .env for actual email sending\n")
    else:
        print("\n✓ Email configuration looks good!")
        print("  Ready to send emails\n")
    
    # Optionally test sending an email
    test_email = input("Enter email address to send test code (or press Enter to skip): ").strip()
    
    if test_email:
        try:
            print(f"\nSending test email to {test_email}...")
            send_password_reset_email(test_email, "123456", "Test User")
            print("✅ Email sent successfully!")
            print("   Check your inbox (or SMTP server console)")
        except Exception as e:
            print(f"❌ Failed to send email: {e}")
            print("\nTroubleshooting:")
            print("  1. If using Gmail, make sure you created an App Password")
            print("  2. If using local SMTP, make sure server is running")
            print("  3. Check .env file has correct MAIL_* settings")
    
    print("\n" + "=" * 80 + "\n")
