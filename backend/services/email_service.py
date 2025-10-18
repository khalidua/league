import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
import secrets
import string
from backend.config import settings

class EmailService:
    def __init__(self):
        self.smtp_server = "smtp.gmail.com"
        self.smtp_port = 587
        self.sender_email = settings.gmail_user
        self.sender_password = settings.gmail_app_password
    
    def generate_verification_token(self, length: int = 32) -> str:
        """Generate a secure random token for email verification"""
        alphabet = string.ascii_letters + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(length))
    
    def create_verification_email(self, recipient_email: str, verification_token: str, firstname: str = None) -> MIMEMultipart:
        """Create a verification email with a verification link"""
        message = MIMEMultipart("alternative")
        message["Subject"] = "Verify Your Email - ZC League"
        message["From"] = self.sender_email
        message["To"] = recipient_email
        
        # Create verification link (you'll need to update this with your frontend URL)
        verification_link = f"http://localhost:5173/verify-email?token={verification_token}"
        
        # Create HTML email content
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Email Verification - ZC League</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background-color: #2c3e50;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 8px 8px 0 0;
                }}
                .content {{
                    background-color: #f8f9fa;
                    padding: 30px;
                    border-radius: 0 0 8px 8px;
                }}
                .button {{
                    display: inline-block;
                    background-color: #3498db;
                    color: white;
                    padding: 12px 30px;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 20px 0;
                    font-weight: bold;
                }}
                .button:hover {{
                    background-color: #2980b9;
                }}
                .footer {{
                    text-align: center;
                    margin-top: 30px;
                    color: #666;
                    font-size: 12px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>ZC League</h1>
            </div>
            <div class="content">
                <h2>Welcome to ZC League!</h2>
                <p>Hello {firstname or 'there'},</p>
                <p>Thank you for registering with ZC League. To complete your registration and start playing, please verify your email address by clicking the button below:</p>
                
                <div style="text-align: center;">
                    <a href="{verification_link}" class="button">Verify Email Address</a>
                </div>
                
                <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background-color: #e9ecef; padding: 10px; border-radius: 4px;">
                    {verification_link}
                </p>
                
                <p><strong>Important:</strong> This verification link will expire in 24 hours for security reasons.</p>
                
                <p>If you didn't create an account with ZC League, please ignore this email.</p>
                
                <p>Best regards,<br>The ZC League Team</p>
            </div>
            <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
            </div>
        </body>
        </html>
        """
        
        # Create plain text version
        text_content = f"""
        Welcome to ZC League!
        
        Hello {firstname or 'there'},
        
        Thank you for registering with ZC League. To complete your registration and start playing, please verify your email address by visiting the following link:
        
        {verification_link}
        
        Important: This verification link will expire in 24 hours for security reasons.
        
        If you didn't create an account with ZC League, please ignore this email.
        
        Best regards,
        The ZC League Team
        
        ---
        This is an automated message. Please do not reply to this email.
        """
        
        # Attach both versions
        text_part = MIMEText(text_content, "plain")
        html_part = MIMEText(html_content, "html")
        
        message.attach(text_part)
        message.attach(html_part)
        
        return message
    
    def send_verification_email(self, recipient_email: str, verification_token: str, firstname: str = None) -> bool:
        """Send verification email to user"""
        try:
            # Create email message
            message = self.create_verification_email(recipient_email, verification_token, firstname)
            
            # Create secure connection and send email
            context = ssl.create_default_context()
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls(context=context)
                server.login(self.sender_email, self.sender_password)
                server.sendmail(self.sender_email, recipient_email, message.as_string())
            
            return True
        except Exception as e:
            print(f"Failed to send verification email: {e}")
            return False
    
    def send_welcome_email(self, recipient_email: str, firstname: str = None) -> bool:
        """Send welcome email after successful verification"""
        try:
            message = MIMEMultipart("alternative")
            message["Subject"] = "Welcome to ZC League - Email Verified!"
            message["From"] = self.sender_email
            message["To"] = recipient_email
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Welcome to ZC League</title>
                <style>
                    body {{
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }}
                    .header {{
                        background-color: #27ae60;
                        color: white;
                        padding: 20px;
                        text-align: center;
                        border-radius: 8px 8px 0 0;
                    }}
                    .content {{
                        background-color: #f8f9fa;
                        padding: 30px;
                        border-radius: 0 0 8px 8px;
                    }}
                    .button {{
                        display: inline-block;
                        background-color: #3498db;
                        color: white;
                        padding: 12px 30px;
                        text-decoration: none;
                        border-radius: 5px;
                        margin: 20px 0;
                        font-weight: bold;
                    }}
                    .footer {{
                        text-align: center;
                        margin-top: 30px;
                        color: #666;
                        font-size: 12px;
                    }}
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🎉 Welcome to ZC League!</h1>
                </div>
                <div class="content">
                    <h2>Your email has been verified!</h2>
                    <p>Hello {firstname or 'there'},</p>
                    <p>Congratulations! Your email address has been successfully verified. You can now access all features of ZC League.</p>
                    
                    <div style="text-align: center;">
                        <a href="http://localhost:5173/login" class="button">Login to ZC League</a>
                    </div>
                    
                    <p>What's next?</p>
                    <ul>
                        <li>Complete your player profile</li>
                        <li>Join or create a team</li>
                        <li>Participate in tournaments</li>
                        <li>Track your statistics</li>
                    </ul>
                    
                    <p>If you have any questions, feel free to contact our support team.</p>
                    
                    <p>Best regards,<br>The ZC League Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated message. Please do not reply to this email.</p>
                </div>
            </body>
            </html>
            """
            
            text_content = f"""
            Welcome to ZC League!
            
            Hello {firstname or 'there'},
            
            Congratulations! Your email address has been successfully verified. You can now access all features of ZC League.
            
            Login to your account: http://localhost:5173/login
            
            What's next?
            - Complete your player profile
            - Join or create a team
            - Participate in tournaments
            - Track your statistics
            
            If you have any questions, feel free to contact our support team.
            
            Best regards,
            The ZC League Team
            """
            
            text_part = MIMEText(text_content, "plain")
            html_part = MIMEText(html_content, "html")
            
            message.attach(text_part)
            message.attach(html_part)
            
            # Send email
            context = ssl.create_default_context()
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls(context=context)
                server.login(self.sender_email, self.sender_password)
                server.sendmail(self.sender_email, recipient_email, message.as_string())
            
            return True
        except Exception as e:
            print(f"Failed to send welcome email: {e}")
            return False

# Create a global instance
email_service = EmailService()
