import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Badge } from './Badge';
import { ConfirmDialog } from './ConfirmDialog';
import { Input } from './Input';
import { Modal } from './Modal';
import { ProtectedRoute } from './ProtectedRoute';
import { Select } from './Select';
import { StatCard } from './StatCard';
import { Table } from './Table';
import { useAuthStore } from '../../store/auth.store';

describe('Reusable ERP UI components', () => {
  it('renders a badge label', () => {
    render(<Badge label="PAID" variant="success" />);
    expect(screen.getByText('PAID')).toBeInTheDocument();
  });

  it('renders an input label, required marker and validation error', () => {
    render(<Input label="Email" required error="Email is required" />);
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  it('shows helper text only when there is no validation error', () => {
    render(<Input label="Name" helperText="Enter full name" />);
    expect(screen.getByText('Enter full name')).toBeInTheDocument();
  });

  it('renders select placeholder and options', () => {
    render(
      <Select
        label="Status"
        placeholder="Choose status"
        options={[{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }]}
      />,
    );
    expect(screen.getByRole('option', { name: 'Choose status' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Active' })).toBeInTheDocument();
  });

  it('renders table headers and row values', () => {
    render(
      <Table
        columns={[{ key: 'name', header: 'Customer' }, { key: 'city', header: 'City' }]}
        data={[{ id: 1, name: 'Asha Stores', city: 'Chennai' }]}
        keyExtractor={(row) => row.id}
      />,
    );
    expect(screen.getByRole('columnheader', { name: 'Customer' })).toBeInTheDocument();
    expect(screen.getByText('Asha Stores')).toBeInTheDocument();
    expect(screen.getByText('Chennai')).toBeInTheDocument();
  });

  it('shows the configured empty-table message', () => {
    render(
      <Table<{ id: number }> columns={[{ key: 'name', header: 'Name' }]} data={[]} keyExtractor={(row) => row.id} emptyMessage="No customers yet" />,
    );
    expect(screen.getByText('No customers yet')).toBeInTheDocument();
  });

  it('shows a loading indicator instead of table rows', () => {
    const { container } = render(
      <Table<{ id: number }> columns={[{ key: 'name', header: 'Name' }]} data={[]} isLoading keyExtractor={(row) => row.id} />,
    );
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('does not render a closed modal', () => {
    render(<Modal isOpen={false} onClose={vi.fn()} title="Create customer">Form</Modal>);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders an open modal and closes it through its close control', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Modal isOpen onClose={onClose} title="Create customer">Customer form</Modal>);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Customer form')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close modal' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls the confirm callback in a confirmation dialog', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        isOpen
        title="Delete customer"
        message="Are you sure?"
        confirmLabel="Delete"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls the cancel callback in a confirmation dialog', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog isOpen title="Delete customer" message="Are you sure?" onConfirm={vi.fn()} onCancel={onCancel} />,
    );
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('renders a KPI title, value and trend', () => {
    render(<StatCard title="Total Revenue" value="$12,500" icon="💰" trend={{ value: 5, label: 'this month' }} />);
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('$12,500')).toBeInTheDocument();
    expect(screen.getByText(/5% this month/)).toBeInTheDocument();
  });
});

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users to the login route', () => {
    useAuthStore.setState({ token: null, user: null, isAuthenticated: false });
    render(
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/private" element={<p>Private ERP page</p>} />
          </Route>
          <Route path="/login" element={<p>Login page</p>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Private ERP page')).not.toBeInTheDocument();
  });

  it('allows authenticated users to access a protected route', () => {
    useAuthStore.setState({ token: 'test-token', user: null, isAuthenticated: true });
    render(
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/private" element={<p>Private ERP page</p>} />
          </Route>
          <Route path="/login" element={<p>Login page</p>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('Private ERP page')).toBeInTheDocument();
  });
});
