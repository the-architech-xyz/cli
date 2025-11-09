// Invoice Card Component

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  Mail, 
  Calendar,
  User,
  MapPin,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle
} from 'lucide-react';

interface InvoiceCardProps {
  invoice: {
    id: string;
    invoiceNumber: string;
    status: 'paid' | 'pending' | 'overdue' | 'cancelled';
    amount: number;
    currency: string;
    customerName: string;
    customerEmail: string;
    customerAddress?: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    items: Array<{
      id: string;
      name: string;
      description?: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
    subtotal: number;
    tax: number;
    total: number;
    createdAt: string;
    dueDate: string;
    paidAt?: string;
    notes?: string;
  };
  onDownload?: (invoice: any) => void;
  onSendEmail?: (invoice: any) => void;
  onMarkPaid?: (invoice: any) => void;
  className?: string;
}

export const InvoiceCard: React.FC<InvoiceCardProps> = ({
  invoice,
  onDownload,
  onSendEmail,
  onMarkPaid,
  className = '',
}) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { 
        color: 'bg-green-100 text-green-800', 
        icon: CheckCircle,
        label: 'Paid'
      },
      pending: { 
        color: 'bg-yellow-100 text-yellow-800', 
        icon: Clock,
        label: 'Pending'
      },
      overdue: { 
        color: 'bg-red-100 text-red-800', 
        icon: AlertCircle,
        label: 'Overdue'
      },
      cancelled: { 
        color: 'bg-gray-100 text-gray-800', 
        icon: XCircle,
        label: 'Cancelled'
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center space-x-1`}>
        <Icon className="w-3 h-3" />
        <span>{config.label}</span>
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Invoice #{invoice.invoiceNumber}</span>
            </CardTitle>
            <CardDescription>
              Created on {formatDate(invoice.createdAt)}
            </CardDescription>
          </div>
          {getStatusBadge(invoice.status)}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Customer Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Bill To</span>
            </h3>
            <div className="space-y-1">
              <p className="font-medium">{invoice.customerName}</p>
              <p className="text-sm text-gray-600">{invoice.customerEmail}</p>
              {invoice.customerAddress && (
                <div className="text-sm text-gray-600">
                  <p>{invoice.customerAddress.line1}</p>
                  {invoice.customerAddress.line2 && <p>{invoice.customerAddress.line2}</p>}
                  <p>
                    {invoice.customerAddress.city}, {invoice.customerAddress.state} {invoice.customerAddress.postalCode}
                  </p>
                  <p>{invoice.customerAddress.country}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Invoice Details</span>
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Invoice Date:</span>
                <span>{formatDate(invoice.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Due Date:</span>
                <span>{formatDate(invoice.dueDate)}</span>
              </div>
              {invoice.paidAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Paid Date:</span>
                  <span>{formatDate(invoice.paidAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Invoice Items */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Items</h3>
          <div className="space-y-3">
            {invoice.items.map((item) => (
              <div key={item.id} className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  {item.description && (
                    <p className="text-sm text-gray-600">{item.description}</p>
                  )}
                  <p className="text-sm text-gray-600">
                    {item.quantity} × {formatCurrency(item.unitPrice, invoice.currency)}
                  </p>
                </div>
                <p className="font-medium">
                  {formatCurrency(item.total, invoice.currency)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Invoice Totals */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax:</span>
            <span>{formatCurrency(invoice.tax, invoice.currency)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>Total:</span>
            <span>{formatCurrency(invoice.total, invoice.currency)}</span>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
              <p className="text-sm text-gray-600">{invoice.notes}</p>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDownload?.(invoice)}
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSendEmail?.(invoice)}
          >
            <Mail className="w-4 h-4 mr-2" />
            Send Email
          </Button>
          
          {invoice.status === 'pending' && (
            <Button
              size="sm"
              onClick={() => onMarkPaid?.(invoice)}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark as Paid
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};