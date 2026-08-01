import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Banknote,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Lock,
  Inbox,
  Wallet,
  Clock,
  Zap,
  Crown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './PaymentsAdmin.css';

const ADMIN_ROLES = ['super_admin', 'company_admin'];

const STATUS_META = {
  pending: { label: 'Pending', className: 'status--pending' },
  confirmed: { label: 'Confirmed', className: 'status--confirmed' },
  rejected: { label: 'Rejected', className: 'status--rejected' },
};

const PLAN_ICONS = { Pro: Zap, Enterprise: Crown };

const fmtDate = (iso) => {
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

const PaymentsAdmin = () => {
  const { user, authFetch } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const isAdmin = user && ADMIN_ROLES.includes(user.role);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch('/payments');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Could not load payments.');
      }
      const data = await res.json();
      setPayments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  const updateStatus = async (payment, status) => {
    setBusyId(payment._id);
    setError('');
    try {
      const res = await authFetch(`/payments/${payment._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Update failed.');
      }
      const updated = await res.json();
      setPayments((list) => list.map((p) => (p._id === updated._id ? updated : p)));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId('');
    }
  };

  const stats = useMemo(() => {
    const confirmed = payments.filter((p) => p.status === 'confirmed');
    const total = confirmed.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    return {
      total,
      confirmed: confirmed.length,
      pending: payments.filter((p) => p.status === 'pending').length,
      rejected: payments.filter((p) => p.status === 'rejected').length,
    };
  }, [payments]);

  if (!isAdmin) {
    return (
      <div className="container admin-page">
        <div className="admin-denied">
          <Lock size={30} />
          <h2>Access denied</h2>
          <p>Only super admin / company admin accounts can view payments.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container admin-page">
      <div className="admin-head">
        <div>
          <p className="admin-eyebrow">Admin</p>
          <h1 className="admin-title">Payments</h1>
          <p className="admin-subtitle">
            UPI payments land here as <b>pending</b>. Match each UTR against your bank / UPI app
            history, then confirm or reject.
          </p>
        </div>
        <button className="admin-refresh" onClick={load} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="admin-stats">
        <div className="stat-card">
          <Banknote size={18} />
          <div>
            <span className="stat-label">Collected (confirmed)</span>
            <span className="stat-value">₹{stats.total}</span>
          </div>
        </div>
        <div className="stat-card">
          <Wallet size={18} />
          <div>
            <span className="stat-label">Confirmed</span>
            <span className="stat-value">{stats.confirmed}</span>
          </div>
        </div>
        <div className="stat-card">
          <Clock size={18} />
          <div>
            <span className="stat-label">Pending</span>
            <span className="stat-value">{stats.pending}</span>
          </div>
        </div>
        <div className="stat-card">
          <XCircle size={18} />
          <div>
            <span className="stat-label">Rejected</span>
            <span className="stat-value">{stats.rejected}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="admin-error" role="alert">
          {error}
        </div>
      )}

      <div className="admin-table-wrap">
        {loading ? (
          <p className="admin-empty">Loading payments…</p>
        ) : payments.length === 0 ? (
          <div className="admin-empty">
            <Inbox size={28} />
            <p>No payments yet. When a buyer pays and submits their UTR, it shows up here.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Plan</th>
                <th>Amount</th>
                <th>Email</th>
                <th>UTR</th>
                <th>Status</th>
                <th className="admin-actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const Icon = PLAN_ICONS[p.plan] || Zap;
                const meta = STATUS_META[p.status] || STATUS_META.pending;
                const busy = busyId === p._id;
                return (
                  <tr key={p._id}>
                    <td className="admin-cell-date">{fmtDate(p.createdAt)}</td>
                    <td>
                      <span className="admin-plan">
                        <Icon size={14} /> {p.plan}
                      </span>
                    </td>
                    <td className="admin-cell-amount">₹{p.amount}</td>
                    <td>{p.email || '—'}</td>
                    <td className="admin-cell-utr">{p.utr}</td>
                    <td>
                      <span className={`admin-status ${meta.className}`}>{meta.label}</span>
                    </td>
                    <td className="admin-actions-col">
                      {p.status === 'pending' ? (
                        <div className="admin-actions">
                          <button
                            className="admin-btn confirm"
                            disabled={busy}
                            onClick={() => updateStatus(p, 'confirmed')}
                          >
                            <CheckCircle2 size={14} /> {busy ? '…' : 'Confirm'}
                          </button>
                          <button
                            className="admin-btn reject"
                            disabled={busy}
                            onClick={() => updateStatus(p, 'rejected')}
                          >
                            <XCircle size={14} /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="admin-cell-fixed">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PaymentsAdmin;
