import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import apiClient from './client';
import { authApi } from './auth.api';
import { customersApi } from './customers.api';
import { suppliersApi } from './suppliers.api';
import { productsApi } from './products.api';
import { employeesApi } from './employees.api';
import { invoicesApi } from './invoices.api';
import { inventoryApi } from './inventory.api';
import { accountingApi } from './accounting.api';

describe('ERP API service layer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requests the customer collection and returns response data', async () => {
    const customers = [{ id: 1, firstName: 'Asha', lastName: 'Stores' }];
    vi.mocked(apiClient.get).mockResolvedValue({ data: customers } as never);
    await expect(customersApi.getAll()).resolves.toEqual(customers);
    expect(apiClient.get).toHaveBeenCalledWith('/customers');
  });

  it('sends a create-customer request to the customer endpoint', async () => {
    const request = { firstName: 'Asha', lastName: 'Stores' };
    const response = { id: 1, ...request };
    vi.mocked(apiClient.post).mockResolvedValue({ data: response } as never);
    await expect(customersApi.create(request)).resolves.toEqual(response);
    expect(apiClient.post).toHaveBeenCalledWith('/customers', request);
  });

  it('requests the supplier collection', async () => {
    const suppliers = [{ id: 2, name: 'Test Supplier' }];
    vi.mocked(apiClient.get).mockResolvedValue({ data: suppliers } as never);
    await expect(suppliersApi.getAll()).resolves.toEqual(suppliers);
    expect(apiClient.get).toHaveBeenCalledWith('/suppliers');
  });

  it('deletes a supplier by ID', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ data: null } as never);
    await suppliersApi.delete(2);
    expect(apiClient.delete).toHaveBeenCalledWith('/suppliers/2');
  });

  it('requests a product by ID', async () => {
    const product = { id: 3, name: 'Test Product', price: 25, stock: 5 };
    vi.mocked(apiClient.get).mockResolvedValue({ data: product } as never);
    await expect(productsApi.getById(3)).resolves.toEqual(product);
    expect(apiClient.get).toHaveBeenCalledWith('/products/3');
  });

  it('sends product updates using PUT', async () => {
    const update = { price: 30 };
    vi.mocked(apiClient.put).mockResolvedValue({ data: { id: 3, ...update } } as never);
    await productsApi.update(3, update);
    expect(apiClient.put).toHaveBeenCalledWith('/products/3', update);
  });

  it('unwraps the employee page content from the paginated response', async () => {
    const employees = [{ id: 5, firstName: 'Ravi', lastName: 'Kumar', email: 'ravi@example.com' }];
    vi.mocked(apiClient.get).mockResolvedValue({ data: { content: employees } } as never);
    await expect(employeesApi.getAll()).resolves.toEqual(employees);
    expect(apiClient.get).toHaveBeenCalledWith('/employees', { params: { size: 200 } });
  });

  it('requests invoices with the configured default pagination', async () => {
    const page = { content: [], totalElements: 0, totalPages: 0, size: 10, number: 0, first: true, last: true };
    vi.mocked(apiClient.get).mockResolvedValue({ data: page } as never);
    await expect(invoicesApi.getAll()).resolves.toEqual(page);
    expect(apiClient.get).toHaveBeenCalledWith('/invoices', { params: { page: 0, size: 10, sortBy: 'id' } });
  });

  it('requests invoices by status', async () => {
    const invoices = [{ id: 9, invoiceDate: '2026-01-01', status: 'PAID' }];
    vi.mocked(apiClient.get).mockResolvedValue({ data: invoices } as never);
    await expect(invoicesApi.getByStatus('PAID')).resolves.toEqual(invoices);
    expect(apiClient.get).toHaveBeenCalledWith('/invoices/status/PAID');
  });

  it('requests inventory items with default pagination', async () => {
    const page = { content: [], totalElements: 0, totalPages: 0, size: 20, number: 0, first: true, last: true };
    vi.mocked(apiClient.get).mockResolvedValue({ data: page } as never);
    await expect(inventoryApi.getItems()).resolves.toEqual(page);
    expect(apiClient.get).toHaveBeenCalledWith('/inventory/items', { params: { page: 0, size: 20 } });
  });

  it('sends stock adjustments with quantity and reason parameters', async () => {
    const movement = { id: 10, inventoryItemId: 6, quantityMoved: -2, status: 'POSTED' };
    vi.mocked(apiClient.post).mockResolvedValue({ data: movement } as never);
    await expect(inventoryApi.adjustStock(6, -2, 'Stock count correction')).resolves.toEqual(movement);
    expect(apiClient.post).toHaveBeenCalledWith('/inventory/items/6/adjust', null, {
      params: { quantityChange: -2, reason: 'Stock count correction' },
    });
  });

  it('unwraps chart-of-account content from the accounting API response', async () => {
    const accounts = [{ id: 1, accountCode: '1000', accountName: 'Cash', accountType: 'ASSET' }];
    vi.mocked(apiClient.get).mockResolvedValue({ data: { content: accounts } } as never);
    await expect(accountingApi.getChartOfAccounts()).resolves.toEqual(accounts);
    expect(apiClient.get).toHaveBeenCalledWith('/accounting/chart-of-accounts', { params: { size: 200 } });
  });

  it('sends login credentials to the authentication endpoint', async () => {
    const credentials = { email: 'admin@example.com', password: 'test-password' };
    const response = { token: 'test-jwt' };
    vi.mocked(apiClient.post).mockResolvedValue({ data: response } as never);
    await expect(authApi.login(credentials)).resolves.toEqual(response);
    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', credentials);
  });
});
