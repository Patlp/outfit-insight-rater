import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Img,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface VerificationEmailProps {
  supabase_url: string
  email_action_type: string
  redirect_to: string
  token_hash: string
  token: string
}

export const VerificationEmail = ({
  token,
  supabase_url,
  email_action_type,
  redirect_to,
  token_hash,
}: VerificationEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to RateMyFit! Verify your email to get started.</Preview>
    <Body style={main}>
      <Container style={container}>
        <div style={logoContainer}>
          <Img
            src="https://frfvrgarcwmpviimsenu.supabase.co/storage/v1/object/public/wardrobe-items/ratemyfit-logo.png"
            width="150"
            height="50"
            alt="RateMyFit Logo"
            style={logo}
          />
        </div>
        
        <Heading style={h1}>Welcome to RateMyFit! 👗</Heading>
        
        <Text style={text}>
          Thank you for signing up! We're excited to help you elevate your style with AI-powered fashion feedback.
        </Text>
        
        <Text style={text}>
          Click the button below to verify your email and start getting instant outfit ratings:
        </Text>
        
        <div style={buttonContainer}>
          <Link
            href={`${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`}
            style={button}
          >
            Verify Email & Get Started
          </Link>
        </div>
        
        <Text style={text}>
          Or copy and paste this verification code:
        </Text>
        <code style={code}>{token}</code>
        
        <Text style={smallText}>
          Once verified, you'll be able to:
        </Text>
        <ul style={list}>
          <li style={listItem}>📸 Upload outfit photos for instant AI ratings</li>
          <li style={listItem}>💡 Get personalized style improvement tips</li>
          <li style={listItem}>🎨 Discover your perfect color palette</li>
          <li style={listItem}>✨ Build a wardrobe that truly fits your style</li>
        </ul>
        
        <Text style={footerText}>
          If you didn't create this account, you can safely ignore this email.
        </Text>
        
        <Text style={footer}>
          Happy styling,<br />
          The RateMyFit Team 🌟
        </Text>
      </Container>
    </Body>
  </Html>
)

export default VerificationEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
}

const logoContainer = {
  textAlign: 'center' as const,
  marginBottom: '32px',
}

const logo = {
  margin: '0 auto',
}

const h1 = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '30px 0',
  padding: '0',
  textAlign: 'center' as const,
}

const text = {
  color: '#4a4a4a',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#8B5CF6',
  borderRadius: '8px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 'bold',
  padding: '16px 32px',
  textAlign: 'center' as const,
  textDecoration: 'none',
}

const code = {
  display: 'inline-block',
  padding: '16px 24px',
  width: '100%',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  border: '1px solid #e9ecef',
  color: '#333',
  fontSize: '14px',
  fontFamily: 'monospace',
  textAlign: 'center' as const,
  margin: '16px 0',
}

const smallText = {
  color: '#4a4a4a',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '24px 0 8px 0',
}

const list = {
  margin: '0 0 24px 0',
  padding: '0 0 0 20px',
}

const listItem = {
  color: '#4a4a4a',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '8px 0',
}

const footerText = {
  color: '#8a8a8a',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '32px 0 16px 0',
}

const footer = {
  color: '#4a4a4a',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '24px 0',
  textAlign: 'center' as const,
}