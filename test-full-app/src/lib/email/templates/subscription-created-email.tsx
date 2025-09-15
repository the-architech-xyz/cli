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

interface SubscriptionCreatedEmailProps {
  planName: string;
  baseUrl: string;
}

export const SubscriptionCreatedEmail = ({ planName, baseUrl }: SubscriptionCreatedEmailProps) => (
  <Html>
    <Head />
    <Preview>Subscription activated for Full Stack Test App</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={box}>
          <Heading style={h1}>Subscription Activated</Heading>
          <Text style={text}>
            Congratulations! Your <strong>{planName}</strong> subscription has been activated.
          </Text>
          <Text style={text}>
            You now have access to all the features included in your plan. You can manage your subscription and view your usage in your account dashboard.
          </Text>
          <Section style={buttonContainer}>
            <a href={baseUrl + '/account/subscription'} style={button}>
              Manage Subscription
            </a>
          </Section>
          <Text style={text}>
            If you have any questions about your subscription, please contact our support team.
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

export default SubscriptionCreatedEmail;
