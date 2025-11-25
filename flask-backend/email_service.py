"""
Email Service for sending password reset codes and order confirmations
"""

from flask_mail import Mail, Message
from flask import current_app, render_template_string
import random
import string

mail = Mail()


def generate_reset_code(length=6):
    """Generate a random 6-digit code for password reset"""
    return ''.join(random.choices(string.digits, k=length))


def send_password_reset_email(email, code, user_name=None):
    """Send password reset email with verification code"""
    try:
        subject = "Password Reset Code - HMN Tech Store"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #5B4824; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
                .content {{ background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 5px 5px; }}
                .code-box {{ background-color: #fff; border: 2px solid #5B4824; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px; }}
                .code {{ font-size: 32px; font-weight: bold; color: #5B4824; letter-spacing: 5px; }}
                .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
                .warning {{ background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>HMN Tech Store</h1>
                    <p>Password Reset Request</p>
                </div>
                <div class="content">
                    <p>Hello {user_name or 'there'},</p>
                    
                    <p>We received a request to reset your password. Use the verification code below to reset your password:</p>
                    
                    <div class="code-box">
                        <div class="code">{code}</div>
                    </div>
                    
                    <p>This code will expire in <strong>15 minutes</strong>.</p>
                    
                    <div class="warning">
                        <strong>⚠️ Security Notice:</strong><br>
                        If you didn't request this password reset, please ignore this email and your password will remain unchanged.
                    </div>
                    
                    <p>For security reasons, never share this code with anyone.</p>
                    
                    <p style="margin-top: 30px; color: #374151;">Thank you,<br>
                    <span class="tech-accent">The HMN Tech Store Team</span></p>
                </div>
                <div class="footer">
                    <p>This is an automated message, please do not reply to this email.</p>
                    <p style="color: #9ca3af; margin-top: 8px;">© 2025 HMN Tech Store. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        HMN Tech Store - Password Reset Request
        
        Hello {user_name or 'there'},
        
        We received a request to reset your password. Use the verification code below:
        
        CODE: {code}
        
        This code will expire in 15 minutes.
        
        If you didn't request this password reset, please ignore this email.
        
        Thank you,
        The HMN Tech Store Team
        """
        
        msg = Message(
            subject=subject,
            recipients=[email],
            body=text_body,
            html=html_body,
            sender=current_app.config.get('MAIL_DEFAULT_SENDER', 'noreply@hmntech.com')
        )
        
        mail.send(msg)
        return True
        
    except Exception as e:
        print(f"Error sending password reset email: {e}")
        current_app.logger.error(f"Failed to send password reset email to {email}: {str(e)}")
        return False


def send_order_confirmation_email(email, order_data, user_name=None):
    """Send order confirmation email with order details"""
    try:
        order_id = order_data.get('id', 'N/A')
        items = order_data.get('items', [])
        total = order_data.get('total', 0)
        status = order_data.get('status', 'processing')
        customer_name = order_data.get('customerName', user_name or 'Customer')
        shipping_address = order_data.get('shippingAddress', {})
        
        # Build items HTML
        items_html = ""
        for item in items:
            items_html += f"""
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">{item.get('productName', 'Unknown')}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">{item.get('quantity', 1)}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">₱{item.get('price', '0.00')}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">₱{float(item.get('price', 0)) * int(item.get('quantity', 1)):.2f}</td>
            </tr>
            """
        
        # Build shipping address
        addr_html = ""
        if shipping_address:
            addr_html = f"""
            {shipping_address.get('address', '')}<br>
            {shipping_address.get('city', '')}, {shipping_address.get('state', '')} {shipping_address.get('zipCode', '')}<br>
            {shipping_address.get('country', '')}
            """
        
        subject = f"Order Confirmation #{order_id[:8]} - HMN Tech Store"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; }}
                .container {{ max-width: 700px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.1); }}
                .header h1 {{ margin: 0; font-size: 32px; font-weight: 700; }}
                .content {{ background-color: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }}
                .order-info {{ background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); padding: 25px; margin: 25px 0; border-radius: 10px; border-left: 4px solid #3b82f6; }}
                table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
                th {{ background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 14px; text-align: left; font-weight: 600; }}
                td {{ padding: 12px; border-bottom: 1px solid #e5e7eb; }}
                .total-row {{ background-color: #f3f4f6; font-weight: 600; }}
                .footer {{ text-align: center; margin-top: 30px; padding: 25px; color: #6b7280; font-size: 13px; border-top: 2px solid #e5e7eb; }}
                .status-badge {{ display: inline-block; padding: 6px 16px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border-radius: 20px; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }}
                .tech-accent {{ color: #3b82f6; font-weight: 600; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✓ Order Confirmed!</h1>
                    <p style="margin: 8px 0 0; opacity: 0.95; font-size: 16px;">Thank you for your purchase</p>
                </div>
                <div class="content">
                    <p style="font-size: 16px; color: #374151;">Dear <span class="tech-accent">{customer_name}</span>,</p>
                    
                    <p>Thank you for your order! We're pleased to confirm that we've received your order and it's being processed.</p>
                    
                    <div class="order-info">
                        <h3>Order Details</h3>
                        <p><strong>Order ID:</strong> #{order_id[:8]}</p>
                        <p><strong>Status:</strong> <span class="status-badge">{status.upper()}</span></p>
                        <p><strong>Order Date:</strong> {order_data.get('createdAt', 'N/A')[:10]}</p>
                    </div>
                    
                    <h3>Items Ordered</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th style="text-align: center;">Quantity</th>
                                <th style="text-align: right;">Price</th>
                                <th style="text-align: right;">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items_html}
                            <tr class="total-row">
                                <td colspan="3" style="padding: 15px; text-align: right;">Total:</td>
                                <td style="padding: 15px; text-align: right;">₱{total:.2f}</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <h3>Shipping Address</h3>
                    <div class="order-info">
                        {addr_html or 'No shipping address provided'}
                    </div>
                    
                    <p>We'll send you another email when your order has been shipped. You can track your order status by logging into your account.</p>
                    
                    <p>If you have any questions, please don't hesitate to contact us.</p>
                    
                    <p style="margin-top: 30px; color: #374151;">Thank you for shopping with us!</p>
                    
                    <p style="color: #374151;">Best regards,<br>
                    <span class="tech-accent">The HMN Tech Store Team</span></p>
                </div>
                <div class="footer">
                    <p>This is an automated message, please do not reply to this email.</p>
                    <p style="color: #9ca3af; margin-top: 8px;">© 2025 HMN Tech Store. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        HMN Tech Store - Order Confirmation
        
        Dear {customer_name},
        
        Thank you for your order! We're pleased to confirm that we've received your order.
        
        Order ID: #{order_id[:8]}
        Status: {status.upper()}
        Total: ₱{total:.2f}
        
        Items:
        {chr(10).join([f"- {item.get('productName')} x{item.get('quantity')} - ₱{float(item.get('price', 0)) * int(item.get('quantity', 1)):.2f}" for item in items])}
        
        We'll send you another email when your order has been shipped.
        
        Thank you for shopping with us!
        
        Best regards,
        The HMN Tech Store Team
        """
        
        msg = Message(
            subject=subject,
            recipients=[email],
            body=text_body,
            html=html_body,
            sender=current_app.config.get('MAIL_DEFAULT_SENDER', 'noreply@hmntech.com')
        )
        
        mail.send(msg)
        return True
        
    except Exception as e:
        print(f"Error sending order confirmation email: {e}")
        current_app.logger.error(f"Failed to send order email to {email}: {str(e)}")
        return False
