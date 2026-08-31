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
      const data = await getRegistrations({ search: regSearch, date: filterDate });
      setRegs(data);
    } catch {
      showToast('Failed to load registrations', 'error');
    }
  }, [regSearch, filterDate, showToast]);

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
      'regId', 'fullName', 'mobile', 'email', 'city', 'state', 'country',
      'isACCEMember', 'checkedIn', 'createdAt',
    ];
    downloadCSV('acce-registrations.csv', toCSV(filteredRegs as unknown as Record<string, unknown>[], columns));
    showToast('CSV exported.', 'success');
  };

  const handleExportSpns = () => {
    if (!filteredSpns.length) { showToast('Nothing to export.', 'error'); return; }
    const columns = [
      'sponsorId', 'companyName', 'contactPerson', 'phone', 'email',
      'website', 'gst', 'createdAt',
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

  const [editFields, setEditFields] = useState({ fullName: '', mobile: '', email: '' });

  const openRegModal = (mode: RegModalMode, record: Registration) => {
    setRegModal({ mode, record });
    if (mode === 'edit') {
      setEditFields({
        fullName: record.fullName,
        mobile: record.mobile,
        email: record.email,
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
      });
      showToast(`${regModal.record.regId} updated.`, 'success');
      closeRegModal();
      await refreshRegs();
    } catch {
      showToast('Update failed.', 'error');
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
      {/* ── Top Bar ── */}
      <div style={styles.topBar} className="admin-topbar-wrap">
        <div style={styles.topBarLeft}>
          <span style={styles.brandMark}>
            <Image src="/img/logo.png" alt="ACCE" width={34} height={34} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </span>
          <span style={styles.topBarBrand}>ACCE (India)</span>
          <Link href="/" style={styles.viewSiteLink}>← View Site</Link>
        </div>
        <div style={styles.topBarRight}>
          <div style={styles.topBarNav} className="admin-topbar-nav">
            {([
              { id: 'registrations' as Tab, label: 'Registrations' },
              { id: 'sponsorships' as Tab, label: 'Sponsorships' },
              { id: 'checkin' as Tab, label: 'Check-In' },
            ]).map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                style={{
                  ...styles.topNavLink,
                  background: tab === item.id ? 'var(--paper)' : 'transparent',
                  color: tab === item.id ? 'var(--ink)' : '#B8CCE4',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn} className="logout-btn">Log Out</button>
        </div>
      </div>

      <div style={styles.main} className="admin-main-wrap">
          <div style={styles.topbar} className="admin-topbar-wrap">
            <h1 style={{ margin: 0, fontSize: 26, fontFamily: 'var(--font-display)' }}>Dashboard</h1>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#5A6270' }}>Signed in as admin</span>
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
                  <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} style={styles.toolbarInput} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-dark" onClick={handleExportRegs} style={{ minHeight: 40 }}>Export CSV</button>
                  <button className="btn" onClick={handleLogout} style={{ minHeight: 40, background: 'transparent', color: 'var(--ink)', border: '1px solid var(--line)' }}>Log Out</button>
                </div>
              </div>

              <div style={styles.tableWrap} className="admin-table-wrap">
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {['Reg. ID', 'Name', 'Phone', 'Email', 'Category', 'ACCE(I)', 'Date', 'Check-in', 'Actions'].map((h) => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegs.length === 0 ? (
                      <tr><td colSpan={9} style={{ textAlign: 'center', color: '#8A8E96', padding: 40 }}>No registrations match your search.</td></tr>
                    ) : filteredRegs.map((r) => (
                      <tr key={r.regId} style={styles.tr}>
                        <td style={styles.td}>{r.regId}</td>
                        <td style={styles.td}>{r.fullName}</td>
                        <td style={styles.td}>{r.mobile}</td>
                        <td style={styles.td}>{r.email}</td>
                        <td style={styles.td}>{r.category || '—'}</td>
                        <td style={styles.td}>{r.isACCEMember ? <span style={{ color: 'var(--teal)', fontWeight: 600 }}>Yes</span> : 'No'}</td>
                        <td style={styles.td}>{new Date(r.createdAt).toLocaleDateString()}</td>
                        <td style={styles.td}>
                          {r.checkedIn
                            ? <span className="checkin-yes">YES</span>
                            : <span className="checkin-no">—</span>
                          }
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                            <button className="action-btn" onClick={() => openRegModal('view', r)}>View</button>
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
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-dark" onClick={handleExportSpns} style={{ minHeight: 40 }}>Export CSV</button>
                  <button className="btn" onClick={handleLogout} style={{ minHeight: 40, background: 'transparent', color: 'var(--ink)', border: '1px solid var(--line)' }}>Log Out</button>
                </div>
              </div>

              <div style={styles.tableWrap} className="admin-table-wrap">
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {['Sponsor ID', 'Company', 'Contact', 'Phone', 'Email', 'Actions'].map((h) => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSpns.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', color: '#8A8E96', padding: 40 }}>No sponsorship applications match your search.</td></tr>
                    ) : filteredSpns.map((s) => (
                      <tr key={s.sponsorId} style={styles.tr}>
                        <td style={styles.td}>{s.sponsorId}</td>
                        <td style={styles.td}>{s.companyName}</td>
                        <td style={styles.td}>{s.contactPerson}</td>
                        <td style={styles.td}>{s.phone}</td>
                        <td style={styles.td}>{s.email}</td>
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
            <div>
              <div style={{ marginBottom: 24 }}>
                <BadgeScanner onCheckInSuccess={() => { refreshRegs(); refreshCheckins(); }} />
              </div>

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

              <div style={{ ...styles.recentCard, marginTop: 24 }}>
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
          )}
      </div>

      {/* ── Registration View Modal ── */}
      {regModal.mode === 'view' && regModal.record && (
        <div style={styles.modalOverlay} className="admin-modal-wrap" onClick={(e) => { if (e.target === e.currentTarget) closeRegModal(); }}>
          <div style={styles.modalBox} className="admin-modal-box">
            <button onClick={closeRegModal} style={styles.modalClose}>×</button>
            {regModal.record.photo && <img src={regModal.record.photo} alt="" style={styles.modalPhoto} />}
            <h3 style={{ fontSize: 20, marginBottom: 14 }}>{regModal.record.fullName}</h3>
            <ModalRow label="Reg. ID" value={regModal.record.regId} />
            <ModalRow label="Category" value={regModal.record.category || '—'} />
            <ModalRow label="Check-In" value={regModal.record.checkedIn ? `Checked in${regModal.record.checkedInAt ? ' · ' + new Date(regModal.record.checkedInAt).toLocaleString() : ''}` : 'Not checked in'} />
            <ModalRow label="Mobile" value={regModal.record.mobile} />
            <ModalRow label="Email" value={regModal.record.email} />
            <ModalRow label="Location" value={`${regModal.record.city}, ${regModal.record.state}, ${regModal.record.country}`} />
            <ModalRow label="ACCE(I) Member" value={regModal.record.isACCEMember ? 'Yes' : 'No'} />
            <div style={styles.modalActions} className="admin-modal-actions">
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
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'var(--ink)',
    padding: '0 24px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    minHeight: 60,
    gap: 16,
    flexWrap: 'wrap',
  },
  topBarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  topBarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  topBarBrand: {
    color: 'var(--paper)',
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: 18,
  },
  viewSiteLink: {
    color: '#B8CCE4',
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    textDecoration: 'none',
    marginLeft: 8,
  },
  topBarNav: {
    display: 'flex',
    gap: 4,
  },
  topNavLink: {
    padding: '10px 18px',
    borderRadius: 6,
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    border: 'none',
    cursor: 'pointer',
    minHeight: 40,
    transition: 'background 0.2s, color 0.2s',
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
  logoutBtn: {
    background: 'transparent',
    border: '1px solid var(--line-dark)',
    color: 'var(--paper)',
    padding: '8px 16px',
    borderRadius: 4,
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    textTransform: 'uppercase',
    minHeight: 38,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  main: {
    padding: '30px 36px 60px',
    minHeight: 'calc(100vh - 60px)',
    background: 'var(--paper)',
    fontFamily: 'var(--font-body)',
  },
  topbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    flexWrap: 'wrap',
    gap: 14,
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
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
  recentCard: {
    background: '#fff',
    border: '1px solid var(--line)',
    borderRadius: 8,
    padding: 24,
    boxShadow: 'var(--shadow-card)',
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
