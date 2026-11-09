
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { CustomersPage } from '../features/customers/CustomersPage';
import { SuppliersPage } from '../features/suppliers/SuppliersPage';
import { ProductsPage } from '../features/products/ProductsPage';
import { InvoicesPage } from '../features/invoices/InvoicesPage';
import { EmployeesPage } from '../features/employees/EmployeesPage';
import { InventoryPage } from '../features/inventory/InventoryPage';
import { AccountingPage } from '../features/accounting/AccountingPage';
import SalesPage from '../features/sales/SalesPage';

import { accountingApi } from '../api/accounting.api';
import { generateCustomerEmail } from '../services/geminiService';

vi.mock('../hooks/useCustomers', () => ({
  useCustomers: () => ({
    data: [{ id: 1, firstName: 'Asha', lastName: 'Stores', email: 'asha@example.com' }],
    isLoading: false,
  }),
  useCreateCustomer: () => ({ mutate: vi.fn(), isLoading: false }),
  useUpdateCustomer: () => ({ mutate: vi.fn(), isLoading: false }),
  useDeleteCustomer: () => ({ mutate: vi.fn() }),
}));

vi.mock('../hooks/useSuppliers', () => ({
  useSuppliers: () => ({
    data: [{ id: 2, name: 'Test Supplier', email: 'supplier@example.com' }],
    isLoading: false,
  }),
  useCreateSupplier: () => ({ mutate: vi.fn(), isLoading: false }),
  useUpdateSupplier: () => ({ mutate: vi.fn(), isLoading: false }),
  useDeleteSupplier: () => ({ mutate: vi.fn() }),
}));

vi.mock('../hooks/useProducts', () => ({
  useProducts: () => ({
    data: [{ id: 3, name: 'Test Product', sku: 'SKU-3', price: 25, stockQuantity: 8, unit: 'pcs', isActive: true }],
    isLoading: false,
  }),
  useCreateProduct: () => ({ mutate: vi.fn(), isLoading: false }),
  useUpdateProduct: () => ({ mutate: vi.fn(), isLoading: false }),
  useDeleteProduct: () => ({ mutate: vi.fn() }),
}));

vi.mock('../hooks/useInvoices', () => ({
  useInvoices: () => ({
    data: {
      content: [{ id: 4, invoiceNumber: 'INV-004', customerName: 'Asha Stores', invoiceDate: '2026-01-01', status: 'DRAFT', totalAmount: 100 }],
      totalPages: 1,
      totalElements: 1,
    },
    isLoading: false,
  }),
  useCreateInvoice: () => ({ mutate: vi.fn(), isLoading: false }),
  useDeleteInvoice: () => ({ mutate: vi.fn() }),
}));

vi.mock('../hooks/useEmployees', () => ({
  useEmployees: () => ({
    data: [{ id: 5, employeeId: 'EMP-005', firstName: 'Ravi', lastName: 'Kumar', email: 'ravi@example.com', employmentStatus: 'ACTIVE' }],
    isLoading: false,
  }),
  useCreateEmployee: () => ({ mutate: vi.fn(), isLoading: false }),
  useUpdateEmployee: () => ({ mutate: vi.fn(), isLoading: false }),
  useDeleteEmployee: () => ({ mutate: vi.fn() }),
}));

vi.mock('../hooks/useInventory', () => ({
  useInventoryItems: () => ({
    data: {
      content: [{ id: 6, sku: 'INV-SKU-6', quantityOnHand: 20, quantityReserved: 2, quantityAvailable: 18, reorderLevel: 5, reorderQuantity: 10 }],
      totalPages: 1,
      totalElements: 1,
    },
    isLoading: false,
  }),
  useLowStockItems: () => ({ data: [] }),
  useCreateInventoryItem: () => ({ mutate: vi.fn(), isLoading: false }),
  useUpdateInventoryItem: () => ({ mutate: vi.fn(), isLoading: false }),
  useDeleteInventoryItem: () => ({ mutate: vi.fn() }),
  useAdjustStock: () => ({ mutate: vi.fn(), isLoading: false }),
}));

vi.mock('../services/geminiService', () => ({
  generateCustomerEmail: vi.fn().mockResolvedValue('Generated follow-up email'),
  analyzeFinancialHealth: vi.fn().mockResolvedValue('Financial health summary'),
}));

const renderWithQueryClient = (ui: ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('ERP feature page smoke tests', () => {
  it('renders customer records from the customer data hook', () => {
    render(<CustomersPage />);
    expect(screen.getByRole('heading', { name: 'Customers' })).toBeInTheDocument();
    expect(screen.getByText('Asha Stores')).toBeInTheDocument();
  });

  it('opens the customer creation form', async () => {
    const user = userEvent.setup();
    render(<CustomersPage />);

    await user.click(screen.getByRole('button', { name: 'Add Customer' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/First Name/)).toBeInTheDocument();
  });

  it('renders supplier records', () => {
    render(<SuppliersPage />);
    expect(screen.getByRole('heading', { name: 'Suppliers' })).toBeInTheDocument();
    expect(screen.getByText('Test Supplier')).toBeInTheDocument();
  });

  it('renders product records', () => {
    render(<ProductsPage />);
    expect(screen.getByRole('heading', { name: 'Products' })).toBeInTheDocument();
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('renders invoice records', () => {
    render(<InvoicesPage />);
    expect(screen.getByRole('heading', { name: 'Invoices' })).toBeInTheDocument();
    expect(screen.getByText('INV-004')).toBeInTheDocument();
  });

  it('renders employee records', () => {
    render(<EmployeesPage />);
    expect(screen.getByRole('heading', { name: 'Employees' })).toBeInTheDocument();
    expect(screen.getByText('Ravi Kumar')).toBeInTheDocument();
  });

  it('renders inventory records', () => {
    render(<InventoryPage />);
    expect(screen.getByRole('heading', { name: 'Inventory Management' })).toBeInTheDocument();
    expect(screen.getByText('INV-SKU-6')).toBeInTheDocument();
  });

  it('loads accounting accounts and displays their balances', async () => {
    vi.spyOn(accountingApi, 'getChartOfAccounts').mockResolvedValue([
      {
        id: 1,
        accountCode: '1000',
        accountName: 'Cash',
        accountType: 'ASSET',
        currentBalance: 1500,
        isActive: true,
      },
    ]);

    renderWithQueryClient(<AccountingPage />);

    expect(await screen.findByText('Cash')).toBeInTheDocument();
    expect(screen.getAllByText('$1,500')).toHaveLength(2);
  });

  it('renders the CRM view and allows switching to list mode', async () => {
    const user = userEvent.setup();

    render(<SalesPage subModule="CRM" />);

    expect(screen.getByRole('heading', { name: 'Customer Pipeline' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /List/ }));

    expect(screen.getByRole('columnheader', { name: 'Contact' })).toBeInTheDocument();
  });

it('generates a customer email draft from the CRM action', async () => {
  const user = userEvent.setup();

  vi.mocked(generateCustomerEmail).mockReset();
  vi.mocked(generateCustomerEmail).mockResolvedValue(
    'Generated follow-up email'
  );

  render(<SalesPage subModule="CRM" />);

  await user.click(screen.getByRole('button', { name: /List/ }));

  await user.click(
    screen.getAllByRole('button', { name: 'Draft' })[0]
  );

  expect(screen.getByText(/Drafting for:/)).toBeInTheDocument();

  await user.click(
    screen.getByRole('button', { name: /Generate Draft/ })
  );

  expect(generateCustomerEmail).toHaveBeenCalledTimes(1);

  expect(
    await screen.findByText('Generated Content')
  ).toBeInTheDocument();

  expect(
    screen.getByText('Generated follow-up email')
  ).toBeInTheDocument();
});
});
