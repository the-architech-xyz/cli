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

interface WelcomeEmailProps {
  name: string;
  baseUrl: string;
}

export const WelcomeEmail = ({ name, baseUrl }: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to Full Stack Test App!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={box}>
          <Heading style={h1}>Welcome to Full Stack Test App!</Heading>
          <Text style={text}>
            Hi {name},
          </Text>
          <Text style={text}>
            Welcome to Full Stack Test App! We&apos;re excited to have you on board.
          </Text>
          <Text style={text}>
            You can now start using all the features of our platform. If you have any questions, feel free to reach out to our support team.
          </Text>
          <Section style={buttonContainer}>
            <a href={baseUrl} style={button}>
              Get Started
            </a>
          </Section>
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
  backgroundColor: '#007ee6',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

export default WelcomeEmail;
