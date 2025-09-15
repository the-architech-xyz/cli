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

interface PasswordResetEmailProps {
  resetUrl: string;
  baseUrl: string;
}

export const PasswordResetEmail = ({ resetUrl, baseUrl }: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Reset your password for Full Stack Test App</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={box}>
          <Heading style={h1}>Reset your password</Heading>
          <Text style={text}>
            We received a request to reset your password for your Full Stack Test App account.
          </Text>
          <Text style={text}>
            Click the button below to reset your password. This link will expire in 1 hour.
          </Text>
          <Section style={buttonContainer}>
            <a href={resetUrl} style={button}>
              Reset Password
            </a>
          </Section>
          <Text style={text}>
            If you didn&apos;t request this password reset, you can safely ignore this email.
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
  backgroundColor: '#dc2626',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

export default PasswordResetEmail;
