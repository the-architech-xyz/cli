'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar,
  Filter,
  Download,
  Plus,
  Search,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PaymentAnalytics } from '@/components/payments/PaymentAnalytics';
import { TransactionTable } from '@/components/payments/TransactionTable';
import { PaymentStatus } from '@/components/payments/PaymentStatus';
import { usePaymentsList as usePayments } from '@/lib/payments';
import { useSubscriptionsList as useSubscriptions } from '@/lib/payments';
import { useInvoicesList as useInvoices } from '@/lib/payments';

export default function PaymentsDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30d');
  
  const { data: payments, isLoading: paymentsLoading } = usePayments();
  const { data: subscriptions, isLoading: subscriptionsLoading } = useSubscriptions();
  const { data: invoices, isLoading: invoicesLoading } = useInvoices();

  // Mock data for demonstration
  const stats = {
    totalRevenue: 125430.50,
    monthlyRevenue: 28450.75,
    totalTransactions: 1247,
    activeSubscriptions: 89,
    revenueGrowth: 12.5,
    transactionGrowth: 8.3,
    subscriptionGrowth: 15.2,
    invoiceGrowth: -2.1
  };

  const recentTransactions = [
    {
      id: 'tx_001',
      amount: 299.99,
      currency: 'USD',
      status: 'completed',
      customer: 'John Doe',
      description: 'Premium Plan Subscription',
      date: '2024-01-15T10:30:00Z',
      method: 'card'
    },
    {
      id: 'tx_002',
      amount: 149.99,
      currency: 'USD',
      status: 'pending',
      customer: 'Jane Smith',
      description: 'Pro Plan Subscription',
      date: '2024-01-15T09:15:00Z',
      method: 'bank_transfer'
    },
    {
      id: 'tx_003',
      amount: 99.99,
      currency: 'USD',
      status: 'failed',
      customer: 'Bob Johnson',
      description: 'Basic Plan Subscription',
      date: '2024-01-14T16:45:00Z',
      method: 'card'
    }
  ];

  const recentInvoices = [
    {
      id: 'inv_001',
      amount: 299.99,
      currency: 'USD',
      status: 'paid',
      customer: 'John Doe',
      dueDate: '2024-01-15',
      paidDate: '2024-01-15'
    },
    {
      id: 'inv_002',
      amount: 149.99,
      currency: 'USD',
      status: 'pending',
      customer: 'Jane Smith',
      dueDate: '2024-01-20',
      paidDate: null
    }
  ];

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payments Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your payments, subscriptions, and invoices
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Payment
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial=${ opacity: 0, y: 20 }
          animate=${ opacity: 1, y: 0 }
          transition=${ delay: 0.1 }
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
              <div className="flex items-center text-xs text-blue-200">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                +{stats.revenueGrowth}% from last month
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial=${ opacity: 0, y: 20 }
          animate=${ opacity: 1, y: 0 }
          transition=${ delay: 0.2 }
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.monthlyRevenue.toLocaleString()}</div>
              <div className="flex items-center text-xs text-green-200">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                +{stats.revenueGrowth}% from last month
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial=${ opacity: 0, y: 20 }
          animate=${ opacity: 1, y: 0 }
          transition=${ delay: 0.3 }
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <CreditCard className="h-4 w-4 text-purple-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTransactions.toLocaleString()}</div>
              <div className="flex items-center text-xs text-purple-200">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                +{stats.transactionGrowth}% from last month
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial=${ opacity: 0, y: 20 }
          animate=${ opacity: 1, y: 0 }
          transition=${ delay: 0.4 }
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <Users className="h-4 w-4 text-orange-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
              <div className="flex items-center text-xs text-orange-200">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                +{stats.subscriptionGrowth}% from last month
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Analytics Chart */}
          <motion.div
            initial=${ opacity: 0, y: 20 }
            animate=${ opacity: 1, y: 0 }
            transition=${ delay: 0.5 }
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Payment Analytics</CardTitle>
                <CardDescription>
                  Revenue and transaction trends over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PaymentAnalytics />
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Transactions */}
          <motion.div
            initial=${ opacity: 0, y: 20 }
            animate=${ opacity: 1, y: 0 }
            transition=${ delay: 0.6 }
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>
                      Latest payment activity
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions.map((transaction, index) => (
                    <motion.div
                      key={transaction.id}
                      initial=${ opacity: 0, x: -20 }
                      animate=${ opacity: 1, x: 0 }
                      transition=${ delay: 0.7 + index * 0.1 }
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {transaction.customer}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {transaction.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            ${transaction.amount}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(transaction.date).toLocaleDateString()}
                          </p>
                        </div>
                        <PaymentStatus status={transaction.status} />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <motion.div
            initial=${ opacity: 0, y: 20 }
            animate=${ opacity: 1, y: 0 }
            transition=${ delay: 0.5 }
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Transactions</CardTitle>
                    <CardDescription>
                      Complete transaction history
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <TransactionTable 
                  transactions={recentTransactions}
                  isLoading={paymentsLoading}
                />
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-6">
          <motion.div
            initial=${ opacity: 0, y: 20 }
            animate=${ opacity: 1, y: 0 }
            transition=${ delay: 0.5 }
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Subscriptions</CardTitle>
                    <CardDescription>
                      Manage active subscriptions
                    </CardDescription>
                  </div>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Subscription
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  Subscription management coming soon...
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <motion.div
            initial=${ opacity: 0, y: 20 }
            animate=${ opacity: 1, y: 0 }
            transition=${ delay: 0.5 }
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Invoices</CardTitle>
                    <CardDescription>
                      Manage and track invoices
                    </CardDescription>
                  </div>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Invoice
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentInvoices.map((invoice, index) => (
                    <motion.div
                      key={invoice.id}
                      initial=${ opacity: 0, x: -20 }
                      animate=${ opacity: 1, x: 0 }
                      transition=${ delay: 0.6 + index * 0.1 }
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Invoice #{invoice.id}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {invoice.customer} • Due {new Date(invoice.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            ${invoice.amount}
                          </p>
                          <Badge 
                            variant={invoice.status === 'paid' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {invoice.status}
                          </Badge>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="w-4 h-4 mr-2" />
                              Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
