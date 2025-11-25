"""
Email utilities for sending payment instructions and notifications
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime


def send_payment_email(order):
    """
    Send payment instructions email for online payment orders
    Email will be sent from ryannoche116@gmail.com
    """
    sender_email = "ryannoche116@gmail.com"
    receiver_email = order.customer_email
    
    # Format order items
    items_html = ""
    for item in order.items:
        product_name = item.get('productName', item.get('name', 'Product'))
        quantity = item.get('quantity', 1)
        price = float(item.get('price', 0))
        subtotal = price * quantity
        items_html += f"""
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">{product_name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">{quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">₱{price:,.2f}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">₱{subtotal:,.2f}</td>
        </tr>
        """
    
    # Format shipping address
    shipping_address = order.shipping_address
    if isinstance(shipping_address, dict):
        address_html = f"""
        {shipping_address.get('address', '')}<br>
        {shipping_address.get('city', '')}, {shipping_address.get('state', '')} {shipping_address.get('zipCode', '')}<br>
        {shipping_address.get('country', '')}
        """
    else:
        address_html = str(shipping_address)
    
    # Create email content
    subject = f"Payment Instructions - Order #{order.id[:8]}"
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #654321; color: white; padding: 20px; text-align: center; }}
            .content {{ padding: 20px; background-color: #f9f9f9; }}
            .order-details {{ background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }}
            .table {{ width: 100%; border-collapse: collapse; margin: 15px 0; }}
            .total {{ font-size: 18px; font-weight: bold; text-align: right; margin-top: 15px; }}
            .payment-info {{ background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }}
            .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>HMN Tech Store</h1>
                <p>Payment Instructions</p>
            </div>
            
            <div class="content">
                <p>Dear {order.customer_name},</p>
                
                <p>Thank you for your order! Your order has been received and is awaiting payment.</p>
                
                <div class="order-details">
                    <h3>Order Information</h3>
                    <p><strong>Order ID:</strong> #{order.id}</p>
                    <p><strong>Order Date:</strong> {datetime.utcnow().strftime('%B %d, %Y')}</p>
                    <p><strong>Payment Method:</strong> Online Payment</p>
                </div>
                
                <div class="order-details">
                    <h3>Order Items</h3>
                    <table class="table">
                        <thead>
                            <tr style="background-color: #f5f5f5;">
                                <th style="padding: 10px; text-align: left;">Product</th>
                                <th style="padding: 10px; text-align: center;">Qty</th>
                                <th style="padding: 10px; text-align: right;">Price</th>
                                <th style="padding: 10px; text-align: right;">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items_html}
                        </tbody>
                    </table>
                    <div class="total">
                        Total Amount: ₱{order.total:,.2f}
                    </div>
                </div>
                
                <div class="order-details">
                    <h3>Shipping Address</h3>
                    <p>{address_html}</p>
                </div>
                
                <div class="payment-info">
                    <h3>Payment Instructions</h3>
                    <p><strong>Please complete your payment to proceed with your order.</strong></p>
                    
                    <p><strong>Payment Options:</strong></p>
                    <ul>
                        <li><strong>GCash:</strong> 09XX XXX XXXX - Ryan Noche</li>
                        <li><strong>PayMaya:</strong> 09XX XXX XXXX - Ryan Noche</li>
                        <li><strong>Bank Transfer:</strong>
                            <ul>
                                <li>Bank Name: [Your Bank]</li>
                                <li>Account Name: Ryan Noche</li>
                                <li>Account Number: XXXX-XXXX-XXXX</li>
                            </ul>
                        </li>
                    </ul>
                    
                    <p><strong>After Payment:</strong></p>
                    <ol>
                        <li>Take a screenshot or photo of your payment confirmation</li>
                        <li>Send the proof of payment to: <strong>ryannoche116@gmail.com</strong></li>
                        <li>Include your Order ID (#{order.id[:8]}) in the email subject</li>
                    </ol>
                    
                    <p>Once we verify your payment, we will immediately process and ship your order.</p>
                </div>
                
                <p>If you have any questions or concerns, please don't hesitate to contact us at <a href="mailto:ryannoche116@gmail.com">ryannoche116@gmail.com</a></p>
                
                <p>Thank you for shopping with HMN Tech Store!</p>
            </div>
            
            <div class="footer">
                <p>This is an automated email from HMN Tech Store</p>
                <p>ryannoche116@gmail.com</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Create plain text version
    text_body = f"""
HMN Tech Store - Payment Instructions

Dear {order.customer_name},

Thank you for your order! Your order has been received and is awaiting payment.

Order ID: #{order.id}
Order Date: {datetime.utcnow().strftime('%B %d, %Y')}
Payment Method: Online Payment
Total Amount: ₱{order.total:,.2f}

PAYMENT INSTRUCTIONS:
Please complete your payment to proceed with your order.

Payment Options:
- GCash: 09XX XXX XXXX - Ryan Noche
- PayMaya: 09XX XXX XXXX - Ryan Noche
- Bank Transfer: [Your Bank] - XXXX-XXXX-XXXX - Ryan Noche

After Payment:
1. Take a screenshot or photo of your payment confirmation
2. Send the proof of payment to: ryannoche116@gmail.com
3. Include your Order ID (#{order.id[:8]}) in the email subject

Once we verify your payment, we will immediately process and ship your order.

For any questions, contact us at ryannoche116@gmail.com

Thank you for shopping with HMN Tech Store!
    """
    
    # Create message
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = sender_email
    msg['To'] = receiver_email
    
    # Attach both plain text and HTML versions
    part1 = MIMEText(text_body, 'plain')
    part2 = MIMEText(html_body, 'html')
    msg.attach(part1)
    msg.attach(part2)
    
    try:
        # Note: This is a simple SMTP implementation
        # In production, you should use environment variables for credentials
        # and configure proper SMTP settings (Gmail requires App Password)
        
        # For now, we'll just log the email (in production, configure SMTP properly)
        print(f"[EMAIL] Would send payment email to {receiver_email}")
        print(f"[EMAIL] Order ID: {order.id}")
        print(f"[EMAIL] Subject: {subject}")
        print("[EMAIL] Email content prepared successfully")
        
        # To actually send via Gmail, you would need:
        # 1. Enable 2-factor authentication on the Gmail account
        # 2. Generate an App Password
        # 3. Use the code below:
        
        # server = smtplib.SMTP('smtp.gmail.com', 587)
        # server.starttls()
        # server.login(sender_email, 'your-app-password-here')
        # server.sendmail(sender_email, receiver_email, msg.as_string())
        # server.quit()
        
        return True
    except Exception as e:
        print(f"[EMAIL] Error: {e}")
        raise
