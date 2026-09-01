'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
  debounce,
  getGalleryImages,
  uploadGalleryImage,
  deleteGalleryImage,
  type Registration,
  type Sponsorship,
  type GalleryImage,
} from '@/lib/nexus-store';
import { useToast } from '@/lib/toast';

type Tab = 'registrations' | 'sponsorships' | 'checkin' | 'gallery';
type RegModalMode = 'view' | 'edit' | null;

const PAGE_SIZE = 50;

export default function AdminDashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [tab, setTab] = useState<Tab>('registrations');

  const [regs, setRegs] = useState<Registration[]>([]);
  const [regTotal, setRegTotal] = useState(0);
  const [regPage, setRegPage] = useState(1);
  const [regSearch, setRegSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [regModal, setRegModal] = useState<{ mode: RegModalMode; record: Registration | null }>({ mode: null, record: null });

  const [sponsors, setSponsors] = useState<Sponsorship[]>([]);
  const [spnTotal, setSpnTotal] = useState(0);
  const [spnPage, setSpnPage] = useState(1);
  const [spnSearch, setSpnSearch] = useState('');
  const [spnModal, setSpnModal] = useState<Sponsorship | null>(null);

  const [manualId, setManualId] = useState('');
  const [recentCheckins, setRecentCheckins] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [galleryFile, setGalleryFile] = useState<File | null>(null);
  const [galleryTitle, setGalleryTitle] = useState('');
  const [galleryUploading, setGalleryUploading] = useState(false);

  const regsRef = useRef<Registration[]>([]);

  const refreshRegs = useCallback(async (page?: number, search?: string, date?: string) => {
    try {
      const result = await getRegistrations({
        page: page || regPage,
        limit: PAGE_SIZE,
        search: search !== undefined ? search : regSearch,
        date: date !== undefined ? date : filterDate,
      });
      setRegs(result.items);
      regsRef.current = result.items;
      setRegTotal(result.total);
      setRegPage(result.page);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      showToast('Failed to load registrations', 'error');
    }
  }, [regPage, regSearch, filterDate, showToast]);

  const refreshSpns = useCallback(async (page?: number, search?: string) => {
    try {
      const result = await getSponsorships({
        page: page || spnPage,
        limit: PAGE_SIZE,
        search: search !== undefined ? search : spnSearch,
      });
      setSponsors(result.items);
      setSpnTotal(result.total);
      setSpnPage(result.page);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      showToast('Failed to load sponsorships', 'error');
    }
  }, [spnPage, spnSearch, showToast]);

  const refreshCheckins = useCallback(async () => {
    try {
      const sp = new URLSearchParams();
      sp.set('limit', '20');
      sp.set('checkedIn', 'true');
      const res = await fetch(`/api/registrations?${sp}`, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      const items = (data.registrations || []).map((r: Record<string, unknown>) => ({
        regId: r.reg_id,
        fullName: r.full_name,
        photo: r.photo_url || '',
        mobile: r.mobile,
        email: r.email,
        category: r.category || '',
        city: r.city || '',
        state: r.state || '',
        country: r.country || 'India',
        pin: r.pin || '',
        isACCEMember: r.is_acce_member,
        checkedIn: r.checked_in,
        checkedInAt: r.checked_in_at || null,
        createdAt: r.created_at,
      }));
      setRecentCheckins(items);
    } catch { /* ignore */ }
  }, []);

  const loadGallery = useCallback(async () => {
    try {
      const images = await getGalleryImages();
      setGalleryImages(images);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await Promise.allSettled([refreshRegs(), refreshSpns(), refreshCheckins(), loadGallery()]);
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshRegs, refreshSpns, refreshCheckins, loadGallery]); // eslint-disable-line react-hooks/exhaustive-deps

  const debouncedRegSearchRef = useRef<((val: string) => void) & { cancel: () => void } | null>(null);
  const debouncedSpnSearchRef = useRef<((val: string) => void) & { cancel: () => void } | null>(null);

  // Initialize debounced functions once
  useEffect(() => {
    debouncedRegSearchRef.current = debounce((val: string) => {
      setRegPage(1);
      getRegistrations({ page: 1, limit: PAGE_SIZE, search: val, date: filterDate }).then((result) => {
        setRegs(result.items);
        regsRef.current = result.items;
        setRegTotal(result.total);
      }).catch(() => {});
    }, 400);

    debouncedSpnSearchRef.current = debounce((val: string) => {
      setSpnPage(1);
      getSponsorships({ page: 1, limit: PAGE_SIZE, search: val }).then((result) => {
        setSponsors(result.items);
        setSpnTotal(result.total);
      }).catch(() => {});
    }, 400);

    return () => {
      debouncedRegSearchRef.current?.cancel();
      debouncedSpnSearchRef.current?.cancel();
    };
  }, [filterDate]);

  const handleRegSearchChange = useCallback((val: string) => {
    setRegSearch(val);
    debouncedRegSearchRef.current?.(val);
  }, []);

  const handleSpnSearchChange = useCallback((val: string) => {
    setSpnSearch(val);
    debouncedSpnSearchRef.current?.(val);
  }, []);

  const handleDateChange = useCallback((val: string) => {
    setFilterDate(val);
    setRegPage(1);
    refreshRegs(1, regSearch, val);
  }, [refreshRegs, regSearch]);

  const regStats = useMemo(() => [
    { label: 'Total Registrations', value: regTotal, cls: '' },
    { label: 'Loaded', value: regs.length, cls: 'accent' },
    { label: 'Total Sponsors', value: spnTotal, cls: 'accent' },
  ], [regTotal, regs.length, spnTotal]);

  const spnStats = useMemo(() => [
    { label: 'Total Sponsorships', value: spnTotal, cls: '' },
  ], [spnTotal]);

  const handleLogout = async () => {
    try {
      await logout();
      showToast('Logged out.', 'success');
      setTimeout(() => router.push('/admin-login'), 400);
    } catch {
      showToast('Logout failed.', 'error');
    }
  };

  const handleExportRegs = async () => {
    try {
      const result = await getRegistrations({ limit: 2000, search: regSearch, date: filterDate });
      if (!result.items.length) { showToast('Nothing to export.', 'error'); return; }
      const columns = [
        'regId', 'fullName', 'mobile', 'email', 'city', 'state', 'country',
        'isACCEMember', 'checkedIn', 'createdAt',
      ];
      downloadCSV('acce-registrations.csv', toCSV(result.items as unknown as Record<string, unknown>[], columns));
      showToast('CSV exported.', 'success');
    } catch {
      showToast('Export failed.', 'error');
    }
  };

  const handleExportSpns = async () => {
    try {
      const result = await getSponsorships({ limit: 2000, search: spnSearch });
      if (!result.items.length) { showToast('Nothing to export.', 'error'); return; }
      const columns = [
        'sponsorId', 'companyName', 'contactPerson', 'phone', 'email',
        'website', 'gst', 'createdAt',
      ];
      downloadCSV('acce-sponsorships.csv', toCSV(result.items as unknown as Record<string, unknown>[], columns));
      showToast('CSV exported.', 'success');
    } catch {
      showToast('Export failed.', 'error');
    }
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
      await Promise.allSettled([refreshRegs(), refreshCheckins()]);
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
      await Promise.allSettled([refreshRegs(), refreshCheckins()]);
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

  const handleGalleryUpload = async () => {
    if (!galleryFile) { showToast('Select an image to upload.', 'error'); return; }
    if (galleryFile.size > 5 * 1024 * 1024) { showToast('Image must be under 5MB.', 'error'); return; }
    setGalleryUploading(true);
    try {
      await uploadGalleryImage(galleryFile, galleryTitle);
      showToast('Image uploaded.', 'success');
      setGalleryFile(null);
      setGalleryTitle('');
      const fileInput = document.getElementById('gallery-file-input') as HTMLInputElement | null;
      if (fileInput) fileInput.value = '';
      await loadGallery();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Upload failed.', 'error');
    } finally {
      setGalleryUploading(false);
    }
  };

  const handleGalleryDelete = async (id: string) => {
    if (!confirm('Delete this gallery image? This cannot be undone.')) return;
    try {
      await deleteGalleryImage(id);
      showToast('Image deleted.', 'success');
      await loadGallery();
    } catch {
      showToast('Delete failed.', 'error');
    }
  };

  const regTotalPages = Math.ceil(regTotal / PAGE_SIZE);
  const spnTotalPages = Math.ceil(spnTotal / PAGE_SIZE);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'var(--font-body)' }}>
        <span style={{ color: '#8A8E96', fontSize: 14 }}>Loading dashboard...</span>
      </div>
    );
  }

  return (
    <>
      {/* -- Top Bar -- */}
      <div style={styles.topBar} className="admin-topbar-wrap gpu-layer">
        <div style={styles.topBarLeft}>
          <span style={styles.brandMark}>
            <Image src="/img/logo.png" alt="ACCE" width={34} height={34} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </span>
          <span style={styles.topBarBrand}>ACCE (India)</span>
          <Link href="/" style={styles.viewSiteLink}>&larr; View Site</Link>
        </div>
        <div style={styles.topBarRight}>
          <div style={styles.topBarNav} className="admin-topbar-nav">
            {([
              { id: 'registrations' as Tab, label: 'Registrations' },
              { id: 'sponsorships' as Tab, label: 'Sponsorships' },
              { id: 'checkin' as Tab, label: 'Check-In' },
              { id: 'gallery' as Tab, label: 'Gallery' },
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

          {/* -- REGISTRATIONS TAB -- */}
          {tab === 'registrations' && (
            <div>
              <div style={styles.statsRow} className="admin-stats-row">
                {regStats.map((s, i) => (
                  <div key={i} style={styles.statCard} className={`stat-card ${s.cls}`}>
                    <span>{s.label}</span>
                    <strong>{s.value.toLocaleString()}</strong>
                  </div>
                ))}
              </div>

              <div style={styles.toolbar} className="admin-toolbar-wrap">
                <div style={styles.filters} className="admin-toolbar-filters">
                  <input
                    type="text"
                    placeholder="Search name, ID, phone, email..."
                    value={regSearch}
                    onChange={(e) => handleRegSearchChange(e.target.value)}
                    style={styles.toolbarInput}
                  />
                  <input type="date" value={filterDate} onChange={(e) => handleDateChange(e.target.value)} style={styles.toolbarInput} />
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
                    {regs.length === 0 ? (
                      <tr><td colSpan={9} style={{ textAlign: 'center', color: '#8A8E96', padding: 40 }}>No registrations match your search.</td></tr>
                    ) : regs.map((r) => (
                      <tr key={r.regId} style={styles.tr} className="virtual-row">
                        <td style={styles.td}>{r.regId}</td>
                        <td style={styles.td}>{r.fullName}</td>
                        <td style={styles.td}>{r.mobile}</td>
                        <td style={styles.td}>{r.email}</td>
                        <td style={styles.td}>{r.category || '---'}</td>
                        <td style={styles.td}>{r.isACCEMember ? <span style={{ color: 'var(--teal)', fontWeight: 600 }}>Yes</span> : 'No'}</td>
                        <td style={styles.td}>{new Date(r.createdAt).toLocaleDateString()}</td>
                        <td style={styles.td}>
                          {r.checkedIn
                            ? <span className="checkin-yes">YES</span>
                            : <span className="checkin-no">---</span>
                          }
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                            <button className="action-btn" onClick={() => openRegModal('view', r)}>View</button>
                            <Link className="action-btn" href={`/id-card?regId=${r.regId}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>ID Card</Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {regTotalPages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    disabled={regPage <= 1}
                    onClick={() => { setRegPage(1); refreshRegs(1); }}
                  >
                    &laquo;
                  </button>
                  <button
                    className="pagination-btn"
                    disabled={regPage <= 1}
                    onClick={() => { setRegPage(regPage - 1); refreshRegs(regPage - 1); }}
                  >
                    &lsaquo;
                  </button>
                  <span className="pagination-info">
                    Page {regPage} of {regTotalPages} ({regTotal.toLocaleString()} total)
                  </span>
                  <button
                    className="pagination-btn"
                    disabled={regPage >= regTotalPages}
                    onClick={() => { setRegPage(regPage + 1); refreshRegs(regPage + 1); }}
                  >
                    &rsaquo;
                  </button>
                  <button
                    className="pagination-btn"
                    disabled={regPage >= regTotalPages}
                    onClick={() => { setRegPage(regTotalPages); refreshRegs(regTotalPages); }}
                  >
                    &raquo;
                  </button>
                </div>
              )}
            </div>
          )}

          {/* -- SPONSORSHIPS TAB -- */}
          {tab === 'sponsorships' && (
            <div>
              <div style={styles.statsRow} className="admin-stats-row">
                {spnStats.map((s, i) => (
                  <div key={i} style={styles.statCard} className={`stat-card ${s.cls}`}>
                    <span>{s.label}</span>
                    <strong>{s.value.toLocaleString()}</strong>
                  </div>
                ))}
              </div>

              <div style={styles.toolbar} className="admin-toolbar-wrap">
                <div style={styles.filters} className="admin-toolbar-filters">
                  <input
                    type="text"
                    placeholder="Search company, sponsor ID, contact..."
                    value={spnSearch}
                    onChange={(e) => handleSpnSearchChange(e.target.value)}
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
                    {sponsors.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', color: '#8A8E96', padding: 40 }}>No sponsorship applications match your search.</td></tr>
                    ) : sponsors.map((s) => (
                      <tr key={s.sponsorId} style={styles.tr} className="virtual-row">
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

              {spnTotalPages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    disabled={spnPage <= 1}
                    onClick={() => { setSpnPage(1); refreshSpns(1); }}
                  >
                    &laquo;
                  </button>
                  <button
                    className="pagination-btn"
                    disabled={spnPage <= 1}
                    onClick={() => { setSpnPage(spnPage - 1); refreshSpns(spnPage - 1); }}
                  >
                    &lsaquo;
                  </button>
                  <span className="pagination-info">
                    Page {spnPage} of {spnTotalPages} ({spnTotal.toLocaleString()} total)
                  </span>
                  <button
                    className="pagination-btn"
                    disabled={spnPage >= spnTotalPages}
                    onClick={() => { setSpnPage(spnPage + 1); refreshSpns(spnPage + 1); }}
                  >
                    &rsaquo;
                  </button>
                  <button
                    className="pagination-btn"
                    disabled={spnPage >= spnTotalPages}
                    onClick={() => { setSpnPage(spnTotalPages); refreshSpns(spnTotalPages); }}
                  >
                    &raquo;
                  </button>
                </div>
              )}
            </div>
          )}

          {/* -- CHECK-IN TAB -- */}
          {tab === 'checkin' && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <BadgeScanner onCheckInSuccess={() => {
                  Promise.allSettled([refreshRegs(), refreshCheckins()]);
                }} />
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

          {/* -- GALLERY TAB -- */}
          {tab === 'gallery' && (
            <div>
              <div style={styles.manualCard}>
                <h4 style={{ margin: '0 0 12px', fontSize: 16 }}>Upload Gallery Image</h4>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10, maxWidth: 500 }}>
                  <input
                    id="gallery-file-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setGalleryFile(e.target.files?.[0] || null)}
                    style={{ fontSize: 13 }}
                  />
                  <input
                    type="text"
                    placeholder="Title (optional)"
                    value={galleryTitle}
                    onChange={(e) => setGalleryTitle(e.target.value)}
                    style={styles.manualInput}
                  />
                  <button
                    className="btn btn-gold"
                    onClick={handleGalleryUpload}
                    disabled={galleryUploading || !galleryFile}
                    style={{ minWidth: 140, minHeight: 40 }}
                  >
                    {galleryUploading ? 'Uploading…' : 'Upload Image'}
                  </button>
                </div>
                <p style={{ color: '#8A8E96', fontSize: 12, margin: '10px 0 0' }}>Max 5MB. Images appear on the public homepage gallery section.</p>
              </div>

              <div style={{ ...styles.recentCard, marginTop: 24 }}>
                <h4 style={{ margin: '0 0 16px', fontSize: 16 }}>Gallery Images ({galleryImages.length})</h4>
                {galleryImages.length === 0 ? (
                  <p style={{ color: '#8A8E96', fontSize: 13 }}>No gallery images yet. Upload one above.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
                    {galleryImages.map((img) => (
                      <div key={img.id} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', background: '#f0f0f0', border: '1px solid var(--line)' }}>
                        <img
                          src={img.image_url}
                          alt={img.title || 'Gallery image'}
                          style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }}
                        />
                        <div style={{ padding: '8px 10px' }}>
                          {img.title && <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{img.title}</div>}
                          {img.caption && <div style={{ fontSize: 11, color: '#8A8E96' }}>{img.caption}</div>}
                          <div style={{ fontSize: 10, color: '#B8CCE4', marginTop: 4 }}>{new Date(img.created_at).toLocaleDateString()}</div>
                        </div>
                        <button
                          onClick={() => handleGalleryDelete(img.id)}
                          style={{
                            position: 'absolute', top: 6, right: 6,
                            width: 28, height: 28, borderRadius: '50%',
                            background: 'rgba(10,38,71,0.85)', color: '#fff',
                            border: 'none', cursor: 'pointer', fontSize: 16,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                          title="Delete"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
      </div>

      {/* -- Registration View Modal -- */}
      {regModal.mode === 'view' && regModal.record && (
        <div style={styles.modalOverlay} className="admin-modal-wrap gpu-fade" onClick={(e) => { if (e.target === e.currentTarget) closeRegModal(); }}>
          <div style={styles.modalBox} className="admin-modal-box gpu-layer">
            <button onClick={closeRegModal} style={styles.modalClose}>&times;</button>
            {regModal.record.photo && <img src={regModal.record.photo} alt="" style={styles.modalPhoto} />}
            <h3 style={{ fontSize: 20, marginBottom: 14 }}>{regModal.record.fullName}</h3>
            <ModalRow label="Reg. ID" value={regModal.record.regId} />
            <ModalRow label="Category" value={regModal.record.category || '---'} />
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

      {/* -- Registration Edit Modal -- */}
      {regModal.mode === 'edit' && regModal.record && (
        <div style={styles.modalOverlay} className="admin-modal-wrap gpu-fade" onClick={(e) => { if (e.target === e.currentTarget) closeRegModal(); }}>
          <div style={styles.modalBox} className="admin-modal-box gpu-layer">
            <button onClick={closeRegModal} style={styles.modalClose}>&times;</button>
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

      {/* -- Sponsorship View Modal -- */}
      {spnModal && (
        <div style={styles.modalOverlay} className="admin-modal-wrap gpu-fade" onClick={(e) => { if (e.target === e.currentTarget) setSpnModal(null); }}>
          <div style={styles.modalBox} className="admin-modal-box gpu-layer">
            <button onClick={() => setSpnModal(null)} style={styles.modalClose}>&times;</button>
            {spnModal.logo && <img src={spnModal.logo} alt="" style={{ ...styles.modalPhoto, borderRadius: 8 }} />}
            <h3 style={{ fontSize: 20, marginBottom: 14 }}>{spnModal.companyName}</h3>
            <ModalRow label="Sponsor ID" value={spnModal.sponsorId} />
            <ModalRow label="Contact" value={spnModal.contactPerson} />
            <ModalRow label="Phone" value={spnModal.phone} />
            <ModalRow label="Email" value={spnModal.email} />
            <ModalRow label="Website" value={spnModal.website || '---'} />
            <ModalRow label="Address" value={spnModal.address || '---'} />
            <ModalRow label="GST" value={spnModal.gst || '---'} />
            <ModalRow label="Requirements" value={spnModal.requirements || '---'} />
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
    willChange: 'transform',
    transform: 'translateZ(0)',
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
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },
  tr: {},
  td: {
    padding: '11px 14px',
    borderBottom: '1px solid var(--line)',
    verticalAlign: 'middle',
    whiteSpace: 'nowrap',
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
