import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface EmailVerificationEmailProps {
  verificationUrl: string;
  baseUrl: string;
}

export const EmailVerificationEmail = ({ verificationUrl, baseUrl }: EmailVerificationEmailProps) => (
  <Html>
    <Head />
    <Preview>Verify your email address for Full Stack Test App</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={box}>
          <Heading style={h1}>Verify your email address</Heading>
          <Text style={text}>
            Thank you for signing up for Full Stack Test App!
          </Text>
          <Text style={text}>
            Please click the button below to verify your email address and complete your registration.
          </Text>
          <Section style={buttonContainer}>
            <a href={verificationUrl} style={button}>
              Verify Email
            </a>
          </Section>
          <Text style={text}>
            If you didn&apos;t create an account with us, you can safely ignore this email.
          </Text>
          <Text style={text}>
            Best regards,<br />
            The Full Stack Test App Team
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const box = {
  padding: '0 48px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#059669',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

export default EmailVerificationEmail;
