'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import BadgeScanner from '@/components/BadgeScanner';
import {
  logout,
  getRegistrations,
  getSponsorships,
  updateRegistration,
  deleteRegistration,
  deleteSponsorship,
  checkIn,
  verifyPayment,
  rejectPayment,
  revokePayment,
  toCSV,
  downloadCSV,
  type Registration,
  type Sponsorship,
} from '@/lib/nexus-store';
import { useToast } from '@/lib/toast';

type Tab = 'registrations' | 'sponsorships' | 'checkin';
type RegModalMode = 'view' | 'edit' | null;

export default function AdminDashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [tab, setTab] = useState<Tab>('registrations');

  const [regs, setRegs] = useState<Registration[]>([]);
  const [regSearch, setRegSearch] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [regModal, setRegModal] = useState<{ mode: RegModalMode; record: Registration | null }>({ mode: null, record: null });

  const [sponsors, setSponsors] = useState<Sponsorship[]>([]);
  const [spnSearch, setSpnSearch] = useState('');
  const [spnModal, setSpnModal] = useState<Sponsorship | null>(null);

  const [manualId, setManualId] = useState('');
  const [recentCheckins, setRecentCheckins] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshRegs = useCallback(async () => {
    try {
      const data = await getRegistrations({ search: regSearch, paymentStatus: filterPayment, date: filterDate });
      setRegs(data);
    } catch {
      showToast('Failed to load registrations', 'error');
    }
  }, [regSearch, filterPayment, filterDate, showToast]);

  const refreshSpns = useCallback(async () => {
    try {
      const data = await getSponsorships({ search: spnSearch });
      setSponsors(data);
    } catch {
      showToast('Failed to load sponsorships', 'error');
    }
  }, [spnSearch, showToast]);

  const refreshCheckins = useCallback(async () => {
    try {
      const data = await getRegistrations();
      setRecentCheckins(
        data
          .filter((r) => r.checkedIn)
          .sort((a, b) => new Date(b.checkedInAt!).getTime() - new Date(a.checkedInAt!).getTime())
          .slice(0, 8)
      );
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await Promise.all([refreshRegs(), refreshSpns(), refreshCheckins()]);
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch when search/filter changes (skip initial mount handled above)
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (!initialized) { setInitialized(true); return; }
    refreshRegs();
  }, [refreshRegs, initialized]);

  useEffect(() => {
    if (!initialized) return;
    refreshSpns();
  }, [refreshSpns, initialized]);

  const filteredRegs = useMemo(() => {
    const q = regSearch.trim().toLowerCase();
    return regs
      .filter((r) => {
        if (q) {
          const hay = `${r.fullName} ${r.regId} ${r.mobile} ${r.email}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [regs, regSearch]);

  const filteredSpns = useMemo(() => {
    const q = spnSearch.trim().toLowerCase();
    return sponsors
      .filter((s) => {
        if (q) {
          const hay = `${s.companyName} ${s.sponsorId} ${s.contactPerson}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [sponsors, spnSearch]);

  const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();

  const regStats = useMemo(() => [
    { label: 'Total Registrations', value: regs.length, cls: '' },
    { label: "Today's", value: regs.filter((r) => isToday(r.createdAt)).length, cls: 'accent' },
    { label: 'Payments Verified', value: regs.filter((r) => r.paymentStatus === 'verified').length, cls: 'teal' },
    { label: 'Payments Pending', value: regs.filter((r) => r.paymentStatus === 'pending').length, cls: 'accent' },
    { label: 'Total Sponsors', value: sponsors.length, cls: 'accent' },
  ], [regs, sponsors]);

  const spnStats = useMemo(() => [
    { label: 'Total Sponsorships', value: sponsors.length, cls: '' },
    { label: "Today's", value: sponsors.filter((s) => isToday(s.createdAt)).length, cls: 'accent' },
  ], [sponsors]);

  const handleLogout = async () => {
    try {
      await logout();
      showToast('Logged out.', 'success');
      setTimeout(() => router.push('/admin-login'), 400);
    } catch {
      showToast('Logout failed.', 'error');
    }
  };

  const toggleCheckIn = async (r: Registration) => {
    if (r.checkedIn) {
      showToast(`${r.fullName} is already checked in. Undo is disabled.`, 'error');
      return;
    }
    try {
      await checkIn(r.regId);
      showToast(`${r.fullName} checked in.`, 'success');
      await Promise.all([refreshRegs(), refreshCheckins()]);
    } catch {
      showToast('Check-in failed.', 'error');
    }
  };

  const handleDeleteReg = async (r: Registration) => {
    if (!confirm(`Delete registration ${r.regId}? This cannot be undone.`)) return;
    try {
      await deleteRegistration(r.regId);
      showToast(`${r.regId} deleted.`, 'success');
      await Promise.all([refreshRegs(), refreshCheckins()]);
    } catch {
      showToast('Delete failed.', 'error');
    }
  };

  const handleExportRegs = () => {
    if (!filteredRegs.length) { showToast('Nothing to export.', 'error'); return; }
    const columns = [
      'regId', 'fullName', 'mobile', 'email', 'qualification', 'orgName',
      'courseBranch', 'gradYear', 'city', 'state', 'country',
      'isACCEMember', 'paymentAmount', 'paymentStatus', 'checkedIn', 'createdAt',
    ];
    downloadCSV('acce-registrations.csv', toCSV(filteredRegs as unknown as Record<string, unknown>[], columns));
    showToast('CSV exported.', 'success');
  };

  const handleExportSpns = () => {
    if (!filteredSpns.length) { showToast('Nothing to export.', 'error'); return; }
    const columns = [
      'sponsorId', 'companyName', 'contactPerson', 'phone', 'email',
      'website', 'gst', 'paymentStatus', 'createdAt',
    ];
    downloadCSV('acce-sponsorships.csv', toCSV(filteredSpns as unknown as Record<string, unknown>[], columns));
    showToast('CSV exported.', 'success');
  };

  const handleManualCheckin = async () => {
    const v = manualId.trim();
    if (!v) { showToast('Enter a Registration ID.', 'error'); return; }
    const rec = regs.find((r) => r.regId === v);
    if (!rec) { showToast('Registration not found.', 'error'); return; }
    if (rec.checkedIn) { showToast(`${v} already checked in.`, 'default'); return; }
    try {
      await checkIn(v);
      showToast(`${rec.fullName} checked in.`, 'success');
      setManualId('');
      await Promise.all([refreshRegs(), refreshCheckins()]);
    } catch {
      showToast('Check-in failed.', 'error');
    }
  };

  const [editFields, setEditFields] = useState({ fullName: '', mobile: '', email: '', qualification: '', orgName: '' });

  const openRegModal = (mode: RegModalMode, record: Registration) => {
    setRegModal({ mode, record });
    if (mode === 'edit') {
      setEditFields({
        fullName: record.fullName,
        mobile: record.mobile,
        email: record.email,
        qualification: record.qualification || '',
        orgName: record.orgName || '',
      });
    }
  };

  const closeRegModal = () => setRegModal({ mode: null, record: null });

  const saveEdit = async () => {
    if (!regModal.record) return;
    if (!/^[6-9]\d{9}$/.test(editFields.mobile)) { showToast('Enter a valid 10-digit mobile number.', 'error'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFields.email)) { showToast('Enter a valid email.', 'error'); return; }
    try {
      await updateRegistration(regModal.record.regId, {
        fullName: editFields.fullName.trim(),
        mobile: editFields.mobile.trim(),
        email: editFields.email.trim(),
        qualification: editFields.qualification.trim(),
        orgName: editFields.orgName.trim(),
      });
      showToast(`${regModal.record.regId} updated.`, 'success');
      closeRegModal();
      await refreshRegs();
    } catch {
      showToast('Update failed.', 'error');
    }
  };

  const handleVerifyPayment = async (regId: string) => {
    try {
      await verifyPayment(regId);
      showToast(`${regId} payment verified.`, 'success');
      closeRegModal();
      await refreshRegs();
    } catch {
      showToast('Verification failed.', 'error');
    }
  };

  const handleRejectPayment = async (regId: string) => {
    try {
      await rejectPayment(regId);
      showToast(`${regId} payment rejected.`, 'error');
      closeRegModal();
      await refreshRegs();
    } catch {
      showToast('Rejection failed.', 'error');
    }
  };

  const handleRevokeVerification = async (regId: string) => {
    try {
      await revokePayment(regId);
      showToast(`${regId} payment verification revoked.`, 'default');
      closeRegModal();
      await refreshRegs();
    } catch {
      showToast('Revoke failed.', 'error');
    }
  };

  const handleDeleteFromModal = async (regId: string) => {
    if (!confirm(`Delete registration ${regId}? This cannot be undone.`)) return;
    try {
      await deleteRegistration(regId);
      showToast(`${regId} deleted.`, 'success');
      closeRegModal();
      await Promise.all([refreshRegs(), refreshCheckins()]);
    } catch {
      showToast('Delete failed.', 'error');
    }
  };

  const handleDeleteSpnFromModal = async (sponsorId: string) => {
    if (!confirm(`Delete sponsorship ${sponsorId}? This cannot be undone.`)) return;
    try {
      await deleteSponsorship(sponsorId);
      showToast(`${sponsorId} deleted.`, 'success');
      setSpnModal(null);
      await refreshSpns();
    } catch {
      showToast('Delete failed.', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'var(--font-body)' }}>
        <span style={{ color: '#8A8E96', fontSize: 14 }}>Loading dashboard…</span>
      </div>
    );
  }

  return (
    <>
      <div style={styles.shell} className="admin-shell-grid">
        {/* ── Sidebar ── */}
        <aside style={styles.sidebar} className="admin-sidebar-wrap">
          <div style={styles.sidebarBrand}>
            <span style={styles.brandMark}>
              <Image src="/img/logo.png" alt="ACCE" width={34} height={34} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </span>
            <span>ACCE (India)</span>
          </div>
          <ul style={styles.sidebarNav}>
            {([
              { id: 'registrations' as Tab, label: 'Registrations' },
              { id: 'sponsorships' as Tab, label: 'Sponsorships' },
              { id: 'checkin' as Tab, label: 'Check-In' },
            ]).map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setTab(item.id)}
                  style={{
                    ...styles.sidebarLink,
                    background: tab === item.id ? 'var(--ink-soft)' : 'transparent',
                    color: tab === item.id ? 'var(--paper)' : '#B8CCE4',
                  }}
                >
                  <span style={{ fontSize: 8 }}>●</span> {item.label}
                </button>
              </li>
            ))}
            <li style={{ marginTop: 8 }}>
              <Link href="/" style={{ ...styles.sidebarLink, color: '#B8CCE4' }}>
                <span>←</span> View Site
              </Link>
            </li>
          </ul>
          <button onClick={handleLogout} style={styles.logoutBtn} className="logout-btn">Log Out</button>
        </aside>

        {/* ── Main ── */}
        <main style={styles.main} className="admin-main-wrap">
          <div style={styles.topbar} className="admin-topbar-wrap">
            <h1 style={{ margin: 0, fontSize: 26, fontFamily: 'var(--font-display)' }}>Dashboard</h1>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#5A6270' }}>Signed in as admin</span>
          </div>

          <div style={styles.tabs} className="admin-tabs-wrap">
            {([
              { id: 'registrations' as Tab, label: 'Registrations' },
              { id: 'sponsorships' as Tab, label: 'Sponsorship Management' },
              { id: 'checkin' as Tab, label: 'Check-In Scanner' },
            ]).map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                style={{
                  ...styles.tabBtn,
                  color: tab === item.id ? 'var(--ink)' : '#8A8E96',
                  borderBottomColor: tab === item.id ? 'var(--gold)' : 'transparent',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* ── REGISTRATIONS TAB ── */}
          {tab === 'registrations' && (
            <div>
              <div style={styles.statsRow} className="admin-stats-row">
                {regStats.map((s, i) => (
                  <div key={i} style={styles.statCard} className={`stat-card ${s.cls}`}>
                    <span>{s.label}</span>
                    <strong>{s.value}</strong>
                  </div>
                ))}
              </div>

              <div style={styles.toolbar} className="admin-toolbar-wrap">
                <div style={styles.filters} className="admin-toolbar-filters">
                  <input
                    type="text"
                    placeholder="Search name, ID, phone, email…"
                    value={regSearch}
                    onChange={(e) => setRegSearch(e.target.value)}
                    style={styles.toolbarInput}
                  />
                  <select value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)} style={styles.toolbarSelect}>
                    <option value="">All Payments</option>
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} style={styles.toolbarInput} />
                </div>
                <button className="btn btn-dark" onClick={handleExportRegs} style={{ minHeight: 40 }}>Export CSV</button>
              </div>

              <div style={styles.tableWrap} className="admin-table-wrap">
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {['Photo', 'Reg. ID', 'Name', 'Phone', 'Email', 'ACCE(I)', 'Amount', 'Payment', 'Screenshot', 'Date', 'Check-in', 'Actions'].map((h) => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegs.length === 0 ? (
                      <tr><td colSpan={12} style={{ textAlign: 'center', color: '#8A8E96', padding: 40 }}>No registrations match your search.</td></tr>
                    ) : filteredRegs.map((r) => (
                      <tr key={r.regId} style={styles.tr}>
                        <td style={styles.td}>
                          {r.photo ? <img src={r.photo} alt="" style={styles.tablePhoto} /> : <div style={{ ...styles.tablePhoto, background: '#eee' }} />}
                        </td>
                        <td style={styles.td}>{r.regId}</td>
                        <td style={styles.td}>{r.fullName}</td>
                        <td style={styles.td}>{r.mobile}</td>
                        <td style={styles.td}>{r.email}</td>
                        <td style={styles.td}>{r.isACCEMember ? <span style={{ color: 'var(--teal)', fontWeight: 600 }}>Yes</span> : 'No'}</td>
                        <td style={styles.td}>₹{r.paymentAmount || 0}</td>
                        <td style={styles.td}>
                          <span className={`payment-badge ${r.paymentStatus || 'pending'}`}>
                            {(r.paymentStatus || 'pending').charAt(0).toUpperCase() + (r.paymentStatus || 'pending').slice(1)}
                          </span>
                        </td>
                        <td style={styles.td}>
                          {r.paymentScreenshot
                            ? <img src={r.paymentScreenshot} alt="Screenshot" style={styles.screenshotThumb} onClick={() => openRegModal('view', r)} />
                            : <span style={{ color: '#8A8E96' }}>—</span>
                          }
                        </td>
                        <td style={styles.td}>{new Date(r.createdAt).toLocaleDateString()}</td>
                        <td style={styles.td}>
                          {r.checkedIn
                            ? <span className="checkin-yes">✓ Yes</span>
                            : <span className="checkin-no">—</span>
                          }
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                            <button className="action-btn" onClick={() => openRegModal('view', r)}>View</button>
                            {r.paymentStatus !== 'verified' && (
                              <button className="action-btn" style={{ background: 'var(--gold)', color: '#0A2647', fontWeight: 600 }} onClick={() => handleVerifyPayment(r.regId)}>Verify Payment</button>
                            )}
                            <Link className="action-btn" href={`/id-card?regId=${r.regId}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>Screenshot ID Card</Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── SPONSORSHIPS TAB ── */}
          {tab === 'sponsorships' && (
            <div>
              <div style={styles.statsRow} className="admin-stats-row">
                {spnStats.map((s, i) => (
                  <div key={i} style={styles.statCard} className={`stat-card ${s.cls}`}>
                    <span>{s.label}</span>
                    <strong>{s.value}</strong>
                  </div>
                ))}
              </div>

              <div style={styles.toolbar} className="admin-toolbar-wrap">
                <div style={styles.filters} className="admin-toolbar-filters">
                  <input
                    type="text"
                    placeholder="Search company, sponsor ID, contact…"
                    value={spnSearch}
                    onChange={(e) => setSpnSearch(e.target.value)}
                    style={styles.toolbarInput}
                  />
                </div>
                <button className="btn btn-dark" onClick={handleExportSpns} style={{ minHeight: 40 }}>Export CSV</button>
              </div>

              <div style={styles.tableWrap} className="admin-table-wrap">
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {['Sponsor ID', 'Company', 'Contact', 'Phone', 'Email', 'Payment', 'Actions'].map((h) => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSpns.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', color: '#8A8E96', padding: 40 }}>No sponsorship applications match your search.</td></tr>
                    ) : filteredSpns.map((s) => (
                      <tr key={s.sponsorId} style={styles.tr}>
                        <td style={styles.td}>{s.sponsorId}</td>
                        <td style={styles.td}>{s.companyName}</td>
                        <td style={styles.td}>{s.contactPerson}</td>
                        <td style={styles.td}>{s.phone}</td>
                        <td style={styles.td}>{s.email}</td>
                        <td style={styles.td}>{s.paymentStatus}</td>
                        <td style={styles.td}>
                          <button className="action-btn" onClick={() => setSpnModal(s)}>View</button>
                          <button className="action-btn danger" onClick={() => handleDeleteSpnFromModal(s.sponsorId)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── CHECK-IN TAB ── */}
          {tab === 'checkin' && (
            <div style={styles.checkinGrid} className="admin-checkin-grid">
              <div style={styles.scannerCard}>
                <BadgeScanner onCheckInSuccess={() => { refreshRegs(); refreshCheckins(); }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={styles.manualCard}>
                  <h4 style={{ margin: '0 0 12px', fontSize: 16 }}>Manual Check-In</h4>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input
                      type="text"
                      placeholder="REG-XXXXX"
                      value={manualId}
                      onChange={(e) => setManualId(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleManualCheckin()}
                      style={styles.manualInput}
                    />
                    <button className="btn btn-dark" onClick={handleManualCheckin} style={{ whiteSpace: 'nowrap' }}>Check In</button>
                  </div>
                  <p style={{ color: '#8A8E96', fontSize: 12, margin: '10px 0 0' }}>No camera? Type or paste a Registration ID.</p>
                </div>
                <div style={styles.recentCard}>
                  <h4 style={{ margin: '0 0 12px', fontSize: 16 }}>Recent Check-Ins</h4>
                  {recentCheckins.length === 0 ? (
                    <p style={{ color: '#8A8E96', fontSize: 13 }}>No check-ins yet.</p>
                  ) : recentCheckins.map((r) => (
                    <div key={r.regId} className="recent-item">
                      <div>
                        <div className="name">{r.fullName}</div>
                        <div className="meta">{r.regId}</div>
                      </div>
                      <div className="meta">{r.checkedInAt ? new Date(r.checkedInAt).toLocaleTimeString() : ''}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Registration View Modal ── */}
      {regModal.mode === 'view' && regModal.record && (
        <div style={styles.modalOverlay} className="admin-modal-wrap" onClick={(e) => { if (e.target === e.currentTarget) closeRegModal(); }}>
          <div style={styles.modalBox} className="admin-modal-box">
            <button onClick={closeRegModal} style={styles.modalClose}>×</button>
            {regModal.record.photo && <img src={regModal.record.photo} alt="" style={styles.modalPhoto} />}
            <h3 style={{ fontSize: 20, marginBottom: 14 }}>{regModal.record.fullName}</h3>
            <ModalRow label="Reg. ID" value={regModal.record.regId} />
            <ModalRow label="Check-In" value={regModal.record.checkedIn ? `Checked in${regModal.record.checkedInAt ? ' · ' + new Date(regModal.record.checkedInAt).toLocaleString() : ''}` : 'Not checked in'} />
            <ModalRow label="Mobile" value={regModal.record.mobile} />
            <ModalRow label="Email" value={regModal.record.email} />
            <ModalRow label="Qualification" value={regModal.record.qualification || '—'} />
            <ModalRow label="College / Company" value={regModal.record.orgName || '—'} />
            <ModalRow label="Course / Branch" value={regModal.record.courseBranch || '—'} />
            <ModalRow label="Designation" value={regModal.record.designation || '—'} />
            <ModalRow label="Location" value={`${regModal.record.city}, ${regModal.record.state}, ${regModal.record.country}`} />
            <ModalRow label="ACCE(I) Member" value={regModal.record.isACCEMember ? 'Yes' : 'No'} />
            <ModalRow label="Payment Amount" value={`₹${regModal.record.paymentAmount || 0}`} />
            <ModalRow label="Payment Status" value={
              <span className={`payment-badge ${regModal.record.paymentStatus || 'pending'}`}>
                {(regModal.record.paymentStatus || 'pending').charAt(0).toUpperCase() + (regModal.record.paymentStatus || 'pending').slice(1)}
              </span>
            } />
            {regModal.record.paymentScreenshot && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8A8E96', marginBottom: 8 }}>Payment Screenshot</div>
                <img
                  src={regModal.record.paymentScreenshot}
                  alt="Payment"
                  style={{ width: '100%', maxWidth: 300, borderRadius: 8, border: '1px solid var(--line)', cursor: 'pointer' }}
                  onClick={() => window.open(regModal.record!.paymentScreenshot, '_blank')}
                />
              </div>
            )}
            <div style={styles.modalActions} className="admin-modal-actions">
              {(regModal.record.paymentStatus || 'pending') === 'pending' && (
                <>
                  <button className="btn btn-gold" onClick={() => handleVerifyPayment(regModal.record!.regId)}>Verify Payment</button>
                  <button className="btn" style={{ background: 'var(--brick)', color: '#fff' }} onClick={() => handleRejectPayment(regModal.record!.regId)}>Reject Payment</button>
                </>
              )}
              {(regModal.record.paymentStatus || 'pending') === 'rejected' && (
                <button className="btn btn-gold" onClick={() => handleVerifyPayment(regModal.record!.regId)}>Verify Payment</button>
              )}
              {(regModal.record.paymentStatus || 'pending') === 'verified' && (
                <button className="btn" style={{ background: '#9E9E9E', color: '#fff' }} onClick={() => handleRevokeVerification(regModal.record!.regId)}>Revoke Verification</button>
              )}
              <button className="btn" style={{ background: 'var(--brick)', color: '#fff' }} onClick={() => handleDeleteFromModal(regModal.record!.regId)}>Delete Member</button>
            </div>
            <div style={styles.modalActions} className="admin-modal-actions">
              <button className="btn btn-dark" onClick={closeRegModal}>Close</button>
              <Link className="btn btn-gold" href={`/id-card?regId=${regModal.record.regId}`} style={{ textDecoration: 'none' }}>Download ID Card</Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Registration Edit Modal ── */}
      {regModal.mode === 'edit' && regModal.record && (
        <div style={styles.modalOverlay} className="admin-modal-wrap" onClick={(e) => { if (e.target === e.currentTarget) closeRegModal(); }}>
          <div style={styles.modalBox} className="admin-modal-box">
            <button onClick={closeRegModal} style={styles.modalClose}>×</button>
            <h3 style={{ fontSize: 20, marginBottom: 18 }}>Edit {regModal.record.regId}</h3>
            <div style={styles.field}><label style={styles.label}>Full Name</label><input type="text" value={editFields.fullName} onChange={(e) => setEditFields({ ...editFields, fullName: e.target.value })} style={styles.input} /></div>
            <div style={styles.field}><label style={styles.label}>Mobile</label><input type="text" value={editFields.mobile} maxLength={10} onChange={(e) => setEditFields({ ...editFields, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })} style={styles.input} /></div>
            <div style={styles.field}><label style={styles.label}>Email</label><input type="email" value={editFields.email} onChange={(e) => setEditFields({ ...editFields, email: e.target.value })} style={styles.input} /></div>
            <div style={styles.field}><label style={styles.label}>Qualification</label><input type="text" value={editFields.qualification} onChange={(e) => setEditFields({ ...editFields, qualification: e.target.value })} style={styles.input} /></div>
            <div style={styles.field}><label style={styles.label}>College / Company</label><input type="text" value={editFields.orgName} onChange={(e) => setEditFields({ ...editFields, orgName: e.target.value })} style={styles.input} /></div>
            <div style={styles.modalActions} className="admin-modal-actions">
              <button className="btn btn-dark" onClick={closeRegModal}>Cancel</button>
              <button className="btn btn-gold" onClick={saveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sponsorship View Modal ── */}
      {spnModal && (
        <div style={styles.modalOverlay} className="admin-modal-wrap" onClick={(e) => { if (e.target === e.currentTarget) setSpnModal(null); }}>
          <div style={styles.modalBox} className="admin-modal-box">
            <button onClick={() => setSpnModal(null)} style={styles.modalClose}>×</button>
            {spnModal.logo && <img src={spnModal.logo} alt="" style={{ ...styles.modalPhoto, borderRadius: 8 }} />}
            <h3 style={{ fontSize: 20, marginBottom: 14 }}>{spnModal.companyName}</h3>
            <ModalRow label="Sponsor ID" value={spnModal.sponsorId} />
            <ModalRow label="Contact" value={spnModal.contactPerson} />
            <ModalRow label="Phone" value={spnModal.phone} />
            <ModalRow label="Email" value={spnModal.email} />
            <ModalRow label="Website" value={spnModal.website || '—'} />
            <ModalRow label="Address" value={spnModal.address || '—'} />
            <ModalRow label="GST" value={spnModal.gst || '—'} />
            <ModalRow label="Requirements" value={spnModal.requirements || '—'} />
            <div style={styles.modalActions} className="admin-modal-actions">
              <button className="btn btn-dark" onClick={() => setSpnModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ModalRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="modal-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line)', fontSize: 13.5 }}>
      <span style={{ color: '#8A8E96', fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase' }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    display: 'grid',
    gridTemplateColumns: '240px 1fr',
    minHeight: '100vh',
    background: 'var(--paper)',
    fontFamily: 'var(--font-body)',
  },
  sidebar: {
    background: 'var(--ink)',
    color: 'var(--paper)',
    padding: '26px 20px',
    position: 'sticky',
    top: 0,
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    color: 'var(--paper)',
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: 18,
    marginBottom: 34,
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    border: '1.5px solid var(--gold)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  sidebarNav: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    flex: 1,
  },
  sidebarLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 14px',
    borderRadius: 4,
    fontFamily: 'var(--font-mono)',
    fontSize: 12.5,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: 4,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    width: '100%',
    textDecoration: 'none',
    minHeight: 44,
  },
  logoutBtn: {
    marginTop: 'auto',
    background: 'transparent',
    border: '1px solid var(--line-dark)',
    color: 'var(--paper)',
    padding: 12,
    borderRadius: 4,
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    textTransform: 'uppercase',
    minHeight: 44,
    width: '100%',
    cursor: 'pointer',
  },
  main: {
    padding: '34px 36px 60px',
    overflow: 'auto',
  },
  topbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    flexWrap: 'wrap',
    gap: 14,
  },
  tabs: {
    display: 'flex',
    gap: 8,
    marginBottom: 26,
    borderBottom: '1px solid var(--line)',
    overflowX: 'auto',
  },
  tabBtn: {
    background: 'none',
    border: 'none',
    padding: '12px 4px',
    marginRight: 22,
    fontFamily: 'var(--font-mono)',
    fontSize: 12.5,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '2px solid transparent',
    whiteSpace: 'nowrap',
    minHeight: 44,
    cursor: 'pointer',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    background: '#fff',
    border: '1px solid var(--line)',
    borderRadius: 6,
    padding: 20,
  },
  toolbar: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filters: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
  },
  toolbarInput: {
    padding: '10px 12px',
    border: '1px solid var(--line)',
    borderRadius: 3,
    fontSize: 13,
    background: '#fff',
    fontFamily: 'var(--font-body)',
    minWidth: 220,
  },
  toolbarSelect: {
    padding: '10px 12px',
    border: '1px solid var(--line)',
    borderRadius: 3,
    fontSize: 13,
    background: '#fff',
    fontFamily: 'var(--font-body)',
  },
  tableWrap: {
    background: '#fff',
    border: '1px solid var(--line)',
    borderRadius: 6,
    overflow: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 13,
    minWidth: 1100,
  },
  th: {
    textAlign: 'left',
    padding: '12px 14px',
    background: 'var(--ink)',
    color: 'var(--paper)',
    fontFamily: 'var(--font-mono)',
    fontSize: 10.5,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap',
  },
  tr: {},
  td: {
    padding: '11px 14px',
    borderBottom: '1px solid var(--line)',
    verticalAlign: 'middle',
    whiteSpace: 'nowrap',
  },
  tablePhoto: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    objectFit: 'cover',
    background: '#eee',
  },
  screenshotThumb: {
    width: 40,
    height: 30,
    borderRadius: 4,
    objectFit: 'cover',
    cursor: 'pointer',
    border: '1px solid var(--line)',
  },
  checkinGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 24,
    alignItems: 'start',
  },
  scannerCard: {
    background: '#fff',
    border: '1px solid var(--line)',
    borderRadius: 8,
    padding: 24,
    boxShadow: 'var(--shadow-card)',
  },
  scannerFrame: {
    position: 'relative',
    width: '100%',
    aspectRatio: '1/1',
    maxWidth: 340,
    background: '#000',
    borderRadius: 8,
    overflow: 'hidden',
    margin: '0 auto',
  },
  scannerReticle: {
    position: 'absolute',
    top: '16%',
    left: '16%',
    right: '16%',
    bottom: '16%',
    border: '2px solid var(--gold-bright)',
    borderRadius: 10,
    boxShadow: '0 0 0 100vmax rgba(11,37,69,.42)',
    pointerEvents: 'none',
  },
  scannerOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#C9C6BC',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    textAlign: 'center',
    padding: 20,
  },
  manualCard: {
    background: '#fff',
    border: '1px solid var(--line)',
    borderRadius: 8,
    padding: 24,
    boxShadow: 'var(--shadow-card)',
  },
  manualInput: {
    flex: 1,
    padding: '13px 14px',
    border: '1px solid var(--line)',
    borderRadius: 3,
    fontFamily: 'var(--font-mono)',
    fontSize: 14,
    minWidth: 0,
  },
  recentCard: {
    background: '#fff',
    border: '1px solid var(--line)',
    borderRadius: 8,
    padding: 24,
    boxShadow: 'var(--shadow-card)',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(11,37,69,0.6)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    background: '#fff',
    borderRadius: 8,
    maxWidth: 520,
    width: '100%',
    maxHeight: '86vh',
    overflow: 'auto',
    padding: 32,
    boxShadow: 'var(--shadow-card)',
    position: 'relative',
  },
  modalClose: {
    float: 'right',
    background: 'none',
    border: 'none',
    fontSize: 20,
    color: '#8A8E96',
    minWidth: 44,
    minHeight: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  modalPhoto: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    objectFit: 'cover',
    marginBottom: 14,
  },
  modalActions: {
    display: 'flex',
    gap: 10,
    marginTop: 22,
    flexWrap: 'wrap',
  },
  field: {
    marginBottom: 12,
  },
  label: {
    display: 'block',
    fontFamily: 'var(--font-mono)',
    fontSize: 11.5,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    color: 'var(--teal)',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid var(--line)',
    borderRadius: 10,
    fontSize: 14,
    fontFamily: 'var(--font-body)',
    background: '#fff',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box' as const,
  },
};
