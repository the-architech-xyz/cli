import { Blueprint } from '../../types/adapter.js';

const stripeShadcnIntegrationBlueprint: Blueprint = {
  id: 'stripe-shadcn-integration',
  name: 'Stripe Shadcn Integration',
  description: 'Integrates Stripe with Shadcn UI components for payment forms and UI',
  version: '1.0.0',
  actions: [
    // PURE MODIFIER: Create Stripe payment form component
    {
      type: 'ENHANCE_FILE',
      path: 'src/components/payment/stripe-payment-form.tsx',
      condition: '{{#if integration.features.paymentForms}}',
      modifier: 'ts-module-enhancer',
      params: {
        importsToAdd: [
          { name: 'useState', from: 'react', type: 'import' },
          { name: 'useStripe', from: '@stripe/stripe-js', type: 'import' },
          { name: 'useElements', from: '@stripe/stripe-js', type: 'import' },
          { name: 'CardElement', from: '@stripe/react-stripe-js', type: 'import' },
          { name: 'Button', from: '@/components/ui/button', type: 'import' },
          { name: 'Card', from: '@/components/ui/card', type: 'import' },
          { name: 'CardContent', from: '@/components/ui/card', type: 'import' },
          { name: 'CardHeader', from: '@/components/ui/card', type: 'import' },
          { name: 'CardTitle', from: '@/components/ui/card', type: 'import' },
          { name: 'Input', from: '@/components/ui/input', type: 'import' },
          { name: 'Label', from: '@/components/ui/label', type: 'import' },
          { name: 'Alert', from: '@/components/ui/alert', type: 'import' },
          { name: 'AlertDescription', from: '@/components/ui/alert', type: 'import' },
          { name: 'Loader2', from: 'lucide-react', type: 'import' }
        ],
        statementsToAppend: [
          {
            type: 'raw',
            content: `interface StripePaymentFormProps {
  amount: number;
  currency?: string;
  onSuccess?: (paymentIntent: any) => void;
  onError?: (error: any) => void;
  className?: string;
}

export function StripePaymentForm({ 
  amount, 
  currency = 'usd', 
  onSuccess, 
  onError,
  className 
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        await createPaymentIntent(amount, currency, email),
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
            billing_details: {
              email,
            },
          },
        }
      );

      if (error) {
        setError(error.message || 'An error occurred');
        onError?.(error);
      } else if (paymentIntent.status === 'succeeded') {
        onSuccess?.(paymentIntent);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      onError?.(err);
    } finally {
      setIsLoading(false);
    }
  };

  const createPaymentIntent = async (amount: number, currency: string, email: string) => {
    const response = await fetch('/api/stripe/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, currency, email }),
    });

    if (!response.ok) {
      throw new Error('Failed to create payment intent');
    }

    const { clientSecret } = await response.json();
    return clientSecret;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Payment Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label>Card Details</Label>
            <div className="p-3 border rounded-md">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={!stripe || isLoading} className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Pay \${(amount / 100).toFixed(2)} {currency.toUpperCase()}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}`
          }
        ]
      }
    },

    // PURE MODIFIER: Create subscription card component
    {
      type: 'ENHANCE_FILE',
      path: 'src/components/payment/subscription-card.tsx',
      condition: '{{#if integration.features.subscriptionCards}}',
      modifier: 'ts-module-enhancer',
      params: {
        importsToAdd: [
          { name: 'useState', from: 'react', type: 'import' },
          { name: 'Card', from: '@/components/ui/card', type: 'import' },
          { name: 'CardContent', from: '@/components/ui/card', type: 'import' },
          { name: 'CardHeader', from: '@/components/ui/card', type: 'import' },
          { name: 'CardTitle', from: '@/components/ui/card', type: 'import' },
          { name: 'Button', from: '@/components/ui/button', type: 'import' },
          { name: 'Badge', from: '@/components/ui/badge', type: 'import' },
          { name: 'Check', from: 'lucide-react', type: 'import' },
          { name: 'X', from: 'lucide-react', type: 'import' }
        ],
        statementsToAppend: [
          {
            type: 'raw',
            content: `interface SubscriptionCardProps {
  subscription: {
  id: string;
    name: string;
    price: number;
        currency: string;
    interval: 'month' | 'year';
    features: string[];
    isPopular?: boolean;
    isCurrent?: boolean;
  };
  onSubscribe?: (subscriptionId: string) => void;
  onCancel?: (subscriptionId: string) => void;
  className?: string;
}

export function SubscriptionCard({ 
  subscription, 
  onSubscribe, 
  onCancel,
  className 
}: SubscriptionCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      await onSubscribe?.(subscription.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      await onCancel?.(subscription.id);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={\`relative \${subscription.isPopular ? 'border-primary shadow-lg' : ''} \${className}\`}>
      {subscription.isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
        </div>
      )}
      
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{subscription.name}</CardTitle>
        <div className="text-3xl font-bold">
          \${(subscription.price / 100).toFixed(2)}
          <span className="text-sm font-normal text-muted-foreground">
            /{subscription.interval}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {subscription.features.map((feature, index) => (
            <li key={index} className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
        
        <div className="pt-4">
          {subscription.isCurrent ? (
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={isLoading}
              className="w-full"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel Subscription
            </Button>
          ) : (
            <Button 
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Processing...' : 'Subscribe'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}`
          }
        ]
      }
    },

    // PURE MODIFIER: Create invoice table component
    {
      type: 'ENHANCE_FILE',
      path: 'src/components/payment/invoice-table.tsx',
      condition: '{{#if integration.features.invoiceTables}}',
      modifier: 'ts-module-enhancer',
      params: {
        importsToAdd: [
          { name: 'Table', from: '@/components/ui/table', type: 'import' },
          { name: 'TableBody', from: '@/components/ui/table', type: 'import' },
          { name: 'TableCell', from: '@/components/ui/table', type: 'import' },
          { name: 'TableHead', from: '@/components/ui/table', type: 'import' },
          { name: 'TableHeader', from: '@/components/ui/table', type: 'import' },
          { name: 'TableRow', from: '@/components/ui/table', type: 'import' },
          { name: 'Badge', from: '@/components/ui/badge', type: 'import' },
          { name: 'Button', from: '@/components/ui/button', type: 'import' },
          { name: 'Download', from: 'lucide-react', type: 'import' }
        ],
        statementsToAppend: [
          {
            type: 'raw',
            content: `interface Invoice {
  id: string;
  number: string;
  date: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  description?: string;
  invoiceUrl?: string;
}

interface InvoiceTableProps {
  invoices: Invoice[];
  onDownload?: (invoiceId: string) => void;
  className?: string;
}

export function InvoiceTable({ invoices, onDownload, className }: InvoiceTableProps) {
  const getStatusBadge = (status: Invoice['status']) => {
    const variants = {
      paid: 'default',
      pending: 'secondary',
      failed: 'destructive',
      refunded: 'outline',
    } as const;

    return (
      <Badge variant={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className={className}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.number}</TableCell>
              <TableCell>{formatDate(invoice.date)}</TableCell>
              <TableCell>{invoice.description || '—'}</TableCell>
              <TableCell>{formatAmount(invoice.amount, invoice.currency)}</TableCell>
              <TableCell>{getStatusBadge(invoice.status)}</TableCell>
              <TableCell className="text-right">
                {invoice.invoiceUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDownload?.(invoice.id)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                      </Button>
                    )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
    </div>
  );
}`
          }
        ]
      }
    },

    // PURE MODIFIER: Create pricing card component
    {
      type: 'ENHANCE_FILE',
      path: 'src/components/payment/pricing-card.tsx',
      condition: '{{#if integration.features.pricingCards}}',
      modifier: 'ts-module-enhancer',
      params: {
        importsToAdd: [
          { name: 'Card', from: '@/components/ui/card', type: 'import' },
          { name: 'CardContent', from: '@/components/ui/card', type: 'import' },
          { name: 'CardHeader', from: '@/components/ui/card', type: 'import' },
          { name: 'CardTitle', from: '@/components/ui/card', type: 'import' },
          { name: 'Button', from: '@/components/ui/button', type: 'import' },
          { name: 'Badge', from: '@/components/ui/badge', type: 'import' },
          { name: 'Check', from: 'lucide-react', type: 'import' }
        ],
        statementsToAppend: [
          {
            type: 'raw',
            content: `interface PricingCardProps {
  plan: {
    id: string;
  name: string;
  description: string;
  price: number;
    currency: string;
    interval: 'month' | 'year';
    features: string[];
    isPopular?: boolean;
    isCurrent?: boolean;
    stripePriceId?: string;
  };
  onSelect?: (planId: string) => void;
  className?: string;
}

export function PricingCard({ plan, onSelect, className }: PricingCardProps) {
  const handleSelect = () => {
    onSelect?.(plan.id);
  };

  return (
    <Card className={\`relative \${plan.isPopular ? 'border-primary shadow-lg scale-105' : ''} \${className}\`}>
      {plan.isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
        </div>
      )}
      
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{plan.name}</CardTitle>
        <p className="text-muted-foreground">{plan.description}</p>
        <div className="text-4xl font-bold">
          \${(plan.price / 100).toFixed(2)}
          <span className="text-lg font-normal text-muted-foreground">
            /{plan.interval}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start space-x-3">
              <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
        
          <div className="pt-4">
              <Button 
            onClick={handleSelect}
            className={\`w-full \${plan.isPopular ? 'bg-primary hover:bg-primary/90' : ''}\`}
            variant={plan.isPopular ? 'default' : 'outline'}
          >
            {plan.isCurrent ? 'Current Plan' : 'Select Plan'}
              </Button>
          </div>
      </CardContent>
    </Card>
  );
}`
          }
        ]
}
    }
  ]
};

export const blueprint = stripeShadcnIntegrationBlueprint;
