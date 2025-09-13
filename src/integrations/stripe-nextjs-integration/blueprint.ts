import { Blueprint } from '../../types/adapter.js';

export const blueprint: Blueprint = {
  id: 'stripe-nextjs-integration',
  name: 'Stripe Next.js Integration',
  description: 'Complete Next.js integration for Stripe',
  version: '2.0.0',
  actions: [
    // PURE MODIFIER: Enhance the Stripe config with Next.js specific features
    {
      type: 'ENHANCE_FILE',
      path: 'src/lib/payment/stripe.ts',
      modifier: 'ts-module-enhancer',
      params: {
        importsToAdd: [
          { name: 'NextRequest', from: 'next/server', type: 'import' },
          { name: 'NextResponse', from: 'next/server', type: 'import' }
        ],
        statementsToAppend: [
          {
            type: 'raw',
            content: `// Next.js specific Stripe configuration
export const NEXTJS_STRIPE_CONFIG = {
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  webhookEndpoint: '/api/stripe/webhooks',
  successUrl: process.env.APP_URL + '/payment/success',
  cancelUrl: process.env.APP_URL + '/payment/cancel',
  currency: 'usd',
  mode: 'payment' as const,
};

// Next.js webhook handler
export const handleStripeWebhook = async (request: NextRequest) => {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    
    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        console.log('Payment succeeded:', event.data.object);
        break;
      case 'payment_intent.payment_failed':
        console.log('Payment failed:', event.data.object);
        break;
      default:
        console.log(\`Unhandled event type: \${event.type}\`);
    }
    
    return NextResponse.json({ received: true, event: event.type });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 400 });
  }
};`
          }
        ]
      }
    },
    
    // PURE MODIFIER: Enhance the Stripe client with Next.js specific features
    {
      type: 'ENHANCE_FILE',
      path: 'src/lib/payment/client.ts',
      modifier: 'ts-module-enhancer',
      params: {
        importsToAdd: [
          { name: 'NEXTJS_STRIPE_CONFIG', from: './stripe', type: 'import' }
        ],
        statementsToAppend: [
          {
            type: 'raw',
            content: `// Next.js specific Stripe client utilities
export const createNextjsPaymentIntent = async (amount: number, currency = 'usd') => {
  const response = await fetch('/api/stripe/create-payment-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amount * 100, // Convert to cents
      currency,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create payment intent');
  }

  return response.json();
};

export const createNextjsSubscription = async (priceId: string, customerId?: string) => {
  const response = await fetch('/api/stripe/create-subscription', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      priceId,
      customerId,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create subscription');
  }

  return response.json();
};

export const createNextjsCustomerPortalSession = async (customerId: string) => {
  const response = await fetch('/api/stripe/create-portal-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerId,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create portal session');
  }

  return response.json();
};`
          }
        ]
      }
    },
    
    // PURE MODIFIER: Create Next.js API route for webhooks
    {
      type: 'ENHANCE_FILE',
      path: 'src/app/api/stripe/webhooks/route.ts',
      modifier: 'ts-module-enhancer',
      fallback: 'create',
      params: {
        importsToAdd: [
          { name: 'NextRequest', from: 'next/server', type: 'import' },
          { name: 'handleStripeWebhook', from: '@/lib/payment/stripe', type: 'import' }
        ],
        statementsToAppend: [
          {
            type: 'raw',
            content: `export async function POST(request: NextRequest) {
  return handleStripeWebhook(request);
}`
          }
        ]
      }
    },
    
    // PURE MODIFIER: Create Next.js API route for payment intents
    {
      type: 'ENHANCE_FILE',
      path: 'src/app/api/stripe/create-payment-intent/route.ts',
      modifier: 'ts-module-enhancer',
      fallback: 'create',
      params: {
        importsToAdd: [
          { name: 'NextRequest', from: 'next/server', type: 'import' },
          { name: 'NextResponse', from: 'next/server', type: 'import' },
          { name: 'stripe', from: '@/lib/payment/stripe', type: 'import' }
        ],
        statementsToAppend: [
          {
            type: 'raw',
            content: `export async function POST(request: NextRequest) {
  try {
    const { amount, currency = 'usd' } = await request.json();
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
    });
    
    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json({ error: 'Failed to create payment intent' }, { status: 500 });
  }
}`
          }
        ]
      }
    },
    
    // PURE MODIFIER: Create Next.js API route for subscriptions
    {
      type: 'ENHANCE_FILE',
      path: 'src/app/api/stripe/create-subscription/route.ts',
      modifier: 'ts-module-enhancer',
      fallback: 'create',
      params: {
        importsToAdd: [
          { name: 'NextRequest', from: 'next/server', type: 'import' },
          { name: 'NextResponse', from: 'next/server', type: 'import' },
          { name: 'stripe', from: '@/lib/payment/stripe', type: 'import' }
        ],
        statementsToAppend: [
          {
            type: 'raw',
            content: `export async function POST(request: NextRequest) {
  try {
    const { priceId, customerId } = await request.json();
    
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });
    
    return NextResponse.json({ 
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret 
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
  }
}`
          }
        ]
      }
    },
    
    // PURE MODIFIER: Create Next.js API route for customer portal
    {
      type: 'ENHANCE_FILE',
      path: 'src/app/api/stripe/create-portal-session/route.ts',
      modifier: 'ts-module-enhancer',
      fallback: 'create',
      params: {
        importsToAdd: [
          { name: 'NextRequest', from: 'next/server', type: 'import' },
          { name: 'NextResponse', from: 'next/server', type: 'import' },
          { name: 'stripe', from: '@/lib/payment/stripe', type: 'import' }
        ],
        statementsToAppend: [
          {
            type: 'raw',
            content: `export async function POST(request: NextRequest) {
  try {
    const { customerId } = await request.json();
    
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: process.env.APP_URL + '/dashboard',
    });
    
    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 });
  }
}`
          }
        ]
      }
    },
    
    // PURE MODIFIER: Create Next.js API route for payment intents (from stripe-nextjs-api-routes)
    {
      type: 'ENHANCE_FILE',
      path: 'src/app/api/stripe/create-payment-intent/route.ts',
      modifier: 'ts-module-enhancer',
      fallback: 'create',
      params: {
        importsToAdd: [
          { name: 'NextRequest', from: 'next/server', type: 'import' },
          { name: 'NextResponse', from: 'next/server', type: 'import' },
          { name: 'stripe', from: '@/lib/payment/stripe', type: 'import' },
          { name: 'STRIPE_CONFIG', from: '@/lib/payment/stripe', type: 'import' }
        ],
        statementsToAppend: [
          {
            type: 'raw',
            content: `export async function POST(request: NextRequest) {
  try {
    const { amount, currency = 'usd' } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        project: '{{project.name}}',
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}`
          }
        ]
      },
      condition: '{{#if integration.features.apiRoutes}}'
    },
    
    // PURE MODIFIER: Create Next.js API route for subscriptions (from stripe-nextjs-api-routes)
    {
      type: 'ENHANCE_FILE',
      path: 'src/app/api/stripe/create-subscription/route.ts',
      modifier: 'ts-module-enhancer',
      fallback: 'create',
      params: {
        importsToAdd: [
          { name: 'NextRequest', from: 'next/server', type: 'import' },
          { name: 'NextResponse', from: 'next/server', type: 'import' },
          { name: 'stripe', from: '@/lib/payment/stripe', type: 'import' },
          { name: 'STRIPE_CONFIG', from: '@/lib/payment/stripe', type: 'import' }
        ],
        statementsToAppend: [
          {
            type: 'raw',
            content: `export async function POST(request: NextRequest) {
  try {
    const { priceId, customerId, email } = await request.json();

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      );
    }

    let customer;

    if (customerId) {
      customer = await stripe.customers.retrieve(customerId);
    } else if (email) {
      // Create or retrieve customer
      const existingCustomers = await stripe.customers.list({
        email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
      } else {
        customer = await stripe.customers.create({
          email,
          metadata: {
            project: '{{project.name}}',
          },
        });
      }
    } else {
      return NextResponse.json(
        { error: 'Customer ID or email is required' },
        { status: 400 }
      );
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        project: '{{project.name}}',
      },
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: (subscription.latest_invoice as { payment_intent?: { client_secret?: string } })?.payment_intent?.client_secret,
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}`
          }
        ]
      },
      condition: '{{#if integration.features.apiRoutes}}'
    },
    
    // PURE MODIFIER: Create Next.js API route for webhooks (from stripe-nextjs-api-routes)
    {
      type: 'ENHANCE_FILE',
      path: 'src/app/api/stripe/webhook/route.ts',
      modifier: 'ts-module-enhancer',
      fallback: 'create',
      params: {
        importsToAdd: [
          { name: 'NextRequest', from: 'next/server', type: 'import' },
          { name: 'NextResponse', from: 'next/server', type: 'import' },
          { name: 'stripe', from: '@/lib/payment/stripe', type: 'import' },
          { name: 'STRIPE_CONFIG', from: '@/lib/payment/stripe', type: 'import' },
          { name: 'Stripe', from: 'stripe', type: 'import' }
        ],
        statementsToAppend: [
          {
            type: 'raw',
            content: `export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_CONFIG.webhookSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment succeeded:', paymentIntent.id);
        // Handle successful payment
        break;

      case 'customer.subscription.created':
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription created:', subscription.id);
        // Handle new subscription
        break;

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object as Stripe.Subscription;
        console.log('Subscription updated:', updatedSubscription.id);
        // Handle subscription update
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        console.log('Subscription deleted:', deletedSubscription.id);
        // Handle subscription cancellation
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Invoice payment succeeded:', invoice.id);
        // Handle successful invoice payment
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        console.log('Invoice payment failed:', failedInvoice.id);
        // Handle failed invoice payment
        break;

      default:
        console.log(\`Unhandled event type: \${event.type}\`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}`
          }
        ]
      },
      condition: '{{#if integration.features.webhooks}}'
    },
    
    // PURE MODIFIER: Create Shadcn UI components for Stripe (from stripe-shadcn-integration)
    {
      type: 'ENHANCE_FILE',
      path: 'src/components/stripe/payment-form.tsx',
      modifier: 'ts-module-enhancer',
      params: {
        importsToAdd: [
          { name: 'useState', from: 'react', type: 'import' },
          { name: 'Button', from: '@/components/ui/button', type: 'import' },
          { name: 'Input', from: '@/components/ui/input', type: 'import' },
          { name: 'Label', from: '@/components/ui/label', type: 'import' },
          { name: 'Card', from: '@/components/ui/card', type: 'import' },
          { name: 'CardContent', from: '@/components/ui/card', type: 'import' },
          { name: 'CardDescription', from: '@/components/ui/card', type: 'import' },
          { name: 'CardHeader', from: '@/components/ui/card', type: 'import' },
          { name: 'CardTitle', from: '@/components/ui/card', type: 'import' },
          { name: 'useToast', from: '@/hooks/use-toast', type: 'import' }
        ],
        statementsToAppend: [
          {
            type: 'raw',
            content: `'use client';

interface PaymentFormProps {
  amount: number;
  currency?: string;
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
}

export function PaymentForm({ amount, currency = 'usd', onSuccess, onError }: PaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          currency,
          metadata: {
            cardholder_name: cardDetails.name
          }
        })
      });

      const { client_secret, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      // In a real implementation, you would use Stripe Elements here
      // For now, we'll simulate a successful payment
      toast({
        title: 'Payment successful!',
        description: 'Your payment has been processed.',
      });

      onSuccess?.(client_secret);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      toast({
        title: 'Payment failed',
        description: errorMessage,
        variant: 'destructive',
      });
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
        <CardDescription>
          Enter your payment information to complete the purchase of \${amount.toFixed(2)} \${currency.toUpperCase()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Cardholder Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={cardDetails.name}
              onChange={(e) => setCardDetails(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="number">Card Number</Label>
            <Input
              id="number"
              type="text"
              placeholder="1234 5678 9012 3456"
              value={cardDetails.number}
              onChange={(e) => setCardDetails(prev => ({ ...prev, number: e.target.value }))}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">Expiry Date</Label>
              <Input
                id="expiry"
                type="text"
                placeholder="MM/YY"
                value={cardDetails.expiry}
                onChange={(e) => setCardDetails(prev => ({ ...prev, expiry: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cvc">CVC</Label>
              <Input
                id="cvc"
                type="text"
                placeholder="123"
                value={cardDetails.cvc}
                onChange={(e) => setCardDetails(prev => ({ ...prev, cvc: e.target.value }))}
                required
              />
            </div>
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Processing...' : \`Pay \${amount.toFixed(2)} \${currency.toUpperCase()}\`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}`
          }
        ]
      },
      condition: '{{#if integration.features.paymentForms}}'
    }
  ]
};