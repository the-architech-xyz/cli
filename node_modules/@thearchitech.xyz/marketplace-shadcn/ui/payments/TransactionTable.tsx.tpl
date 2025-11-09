// Transaction Table Component

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Download,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface TransactionTableProps {
  transactions: Array<{
    id: string;
    status: 'succeeded' | 'pending' | 'failed' | 'cancelled' | 'requires_action';
    type: 'payment' | 'refund' | 'chargeback' | 'adjustment';
    amount: number;
    currency: string;
    description?: string;
    customerName?: string;
    customerEmail?: string;
    createdAt: string;
    metadata?: Record<string, any>;
  }>;
  onTransactionClick?: (transaction: any) => void;
  onDownload?: (transaction: any) => void;
  getStatusBadge: (status: string) => React.ReactNode;
  getTypeIcon: (type: string) => React.ReactNode;
  className?: string;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onTransactionClick,
  onDownload,
  getStatusBadge,
  getTypeIcon,
  className = '',
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getAmountColor = (type: string, amount: number) => {
    if (type === 'refund' || type === 'chargeback') {
      return 'text-red-600';
    }
    if (amount < 0) {
      return 'text-red-600';
    }
    return 'text-green-600';
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id} className="hover:bg-gray-50">
              <TableCell className="font-mono text-sm">
                {transaction.id.substring(0, 8)}...
              </TableCell>
              
              <TableCell>
                <div className="flex items-center space-x-2">
                  {getTypeIcon(transaction.type)}
                  <span className="capitalize text-sm">
                    {transaction.type.replace('_', ' ')}
                  </span>
                </div>
              </TableCell>
              
              <TableCell>
                {transaction.customerName ? (
                  <div>
                    <p className="font-medium text-sm">{transaction.customerName}</p>
                    {transaction.customerEmail && (
                      <p className="text-xs text-gray-600">{transaction.customerEmail}</p>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">N/A</span>
                )}
              </TableCell>
              
              <TableCell>
                <div className="max-w-xs">
                  <p className="text-sm truncate">
                    {transaction.description || 'No description'}
                  </p>
                </div>
              </TableCell>
              
              <TableCell>
                <span className={`font-medium ${getAmountColor(transaction.type, transaction.amount)}`}>
                  {formatCurrency(transaction.amount, transaction.currency)}
                </span>
              </TableCell>
              
              <TableCell>
                {getStatusBadge(transaction.status)}
              </TableCell>
              
              <TableCell>
                <div className="text-sm">
                  <p>{formatDate(transaction.createdAt)}</p>
                </div>
              </TableCell>
              
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onTransactionClick?.(transaction)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDownload?.(transaction)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {transactions.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <CheckCircle className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
          <p className="text-gray-600">No transactions match your current filters.</p>
        </div>
      )}
    </div>
  );
};