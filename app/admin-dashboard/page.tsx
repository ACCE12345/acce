'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import BadgeScanner from '@/components/BadgeScanner';
import {
  logout,
  getRegistrations,
  findRegistration,
  updateRegistration,
  deleteRegistration,
  checkIn,
  toCSV,
  downloadCSV,
  debounce,
  getGalleryImages,
  uploadGalleryImage,
  deleteGalleryImage,
  type Registration,
  type GalleryImage,
} from '@/lib/nexus-store';
import { useToast } from '@/lib/toast';

type Tab = 'registrations' | 'checkin' | 'gallery';
type RegModalMode = 'view' | 'edit' | null;

const PAGE_SIZE = 50;

export default function AdminDashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [tab, setTab] = useState<Tab>('registrations');

  const [regs, setRegs] = useState<Registration[]>([]);
  const [regTotal, setRegTotal] = useState(0);
  const [totalPeople, setTotalPeople] = useState(0);
  const [totalAccompanying, setTotalAccompanying] = useState(0);
  const [regPage, setRegPage] = useState(1);

  const [regSearch, setRegSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [regModal, setRegModal] = useState<{ mode: RegModalMode; record: Registration | null }>({ mode: null, record: null });

  const [manualId, setManualId] = useState('');
  const [recentCheckins, setRecentCheckins] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [galleryFile, setGalleryFile] = useState<File | null>(null);
  const [galleryTitle, setGalleryTitle] = useState('');
  const [galleryCategory, setGalleryCategory] = useState('events');
  const [galleryUploading, setGalleryUploading] = useState(false);

  const regsRef = useRef<Registration[]>([]);
  const regPageRef = useRef(1);
  const regSearchRef = useRef('');
  const filterDateRef = useRef('');

  const refreshRegs = useCallback(async (page?: number, search?: string, date?: string) => {
    const p = page ?? regPageRef.current;
    const s = search !== undefined ? search : regSearchRef.current;
    const d = date !== undefined ? date : filterDateRef.current;
    try {
      const result = await getRegistrations({ page: p, limit: PAGE_SIZE, search: s, date: d });
      setRegs(result.items);
      regsRef.current = result.items;
      setRegTotal(result.total);
      setTotalPeople(result.totalPeople || 0);
      setTotalAccompanying(result.totalAccompanying || 0);
      setRegPage(result.page);
      regPageRef.current = result.page;
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      showToast('Failed to load registrations', 'error');
    }
  }, [showToast]);

  const refreshCheckins = useCallback(async () => {
    try {
      const result = await getRegistrations({ limit: 20, search: '', date: '' });
      const checkedInItems = result.items.filter((r) => r.checkedIn);
      setRecentCheckins(checkedInItems);
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
        await Promise.allSettled([refreshRegs(), refreshCheckins(), loadGallery()]);
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshRegs, refreshCheckins, loadGallery]);

  const debouncedRegSearchRef = useRef<((val: string) => void) & { cancel: () => void } | null>(null);

  // Initialize debounced functions once
  useEffect(() => {
    debouncedRegSearchRef.current = debounce((val: string) => {
      regPageRef.current = 1;
      setRegPage(1);
      getRegistrations({ page: 1, limit: PAGE_SIZE, search: val, date: filterDateRef.current }).then((result) => {
        setRegs(result.items);
        regsRef.current = result.items;
        setRegTotal(result.total);
        setTotalPeople(result.totalPeople || 0);
        setTotalAccompanying(result.totalAccompanying || 0);
      }).catch(() => {});
    }, 400);

    return () => {
      debouncedRegSearchRef.current?.cancel();
    };
  }, []);

  const handleRegSearchChange = useCallback((val: string) => {
    setRegSearch(val);
    regSearchRef.current = val;
    debouncedRegSearchRef.current?.(val);
  }, []);

  const handleDateChange = useCallback((val: string) => {
    setFilterDate(val);
    filterDateRef.current = val;
    regPageRef.current = 1;
    setRegPage(1);
    refreshRegs(1, regSearchRef.current, val);
  }, [refreshRegs]);

  const regStats = useMemo(() => {
    return [
      { label: 'Total People', value: totalPeople, cls: 'accent' },
      { label: 'Total Accompanying', value: totalAccompanying, cls: '' },
    ];
  }, [totalPeople, totalAccompanying]);

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

      const rows: Record<string, unknown>[] = [];
      for (const r of result.items) {
        const full = await findRegistration(r.regId);
        const members = full?.members || [];
        if (members.length === 0) {
          rows.push({
            regId: r.regId,
            memberName: r.primaryName,
            memberMobile: r.primaryMobile,
            memberType: 'Primary',
            category: r.category,
            city: r.city,
            state: r.state,
            isACCEMember: r.isACCEMember,
            checkedIn: r.checkedIn,
            createdAt: r.createdAt,
          });
        } else {
          for (const m of members) {
            rows.push({
              regId: r.regId,
              memberName: m.memberName,
              memberMobile: m.memberMobile || '',
              memberType: m.memberType,
              category: r.category,
              city: r.city,
              state: r.state,
              isACCEMember: r.isACCEMember,
              checkedIn: r.checkedIn,
              createdAt: r.createdAt,
            });
          }
        }
      }

      const columns = [
        'regId', 'memberName', 'memberMobile', 'memberType', 'category',
        'city', 'state', 'isACCEMember', 'checkedIn', 'createdAt',
      ];
      downloadCSV('acce-registrations.csv', toCSV(rows, columns));
      showToast(`CSV exported (${rows.length} members).`, 'success');
    } catch {
      showToast('Export failed.', 'error');
    }
  };

  const handleManualCheckin = async () => {
    const v = manualId.trim();
    if (!v) { showToast('Enter a Registration ID.', 'error'); return; }
    try {
      const rec = await findRegistration(v);
      if (!rec) { showToast('Registration not found.', 'error'); return; }
      if (rec.checkedIn) { showToast(`${v} already checked in.`, 'default'); return; }
      await checkIn(v);
      showToast(`${rec.primaryName} checked in.`, 'success');
      setManualId('');
      await Promise.allSettled([refreshRegs(), refreshCheckins()]);
    } catch {
      showToast('Check-in failed.', 'error');
    }
  };

  const [editFields, setEditFields] = useState({ fullName: '', mobile: '', email: '' });

  const openRegModal = async (mode: RegModalMode, record: Registration) => {
    if (mode === 'view') {
      try {
        const full = await findRegistration(record.regId);
        if (full) { setRegModal({ mode, record: full }); return; }
      } catch { /* fall through */ }
    }
    setRegModal({ mode, record });
    if (mode === 'edit') {
      setEditFields({
        fullName: record.primaryName,
        mobile: record.primaryMobile,
        email: record.primaryEmail,
      });
    }
  };

  const closeRegModal = () => setRegModal({ mode: null, record: null });

  const saveEdit = async () => {
    if (!regModal.record) return;
    if (!/^[6-9]\d{9}$/.test(editFields.mobile)) { showToast('Enter a valid 10-digit mobile number.', 'error'); return; }
    if (editFields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFields.email)) { showToast('Enter a valid email.', 'error'); return; }
    try {
      await updateRegistration(regModal.record.regId, {
        primaryName: editFields.fullName.trim(),
        primaryMobile: editFields.mobile.trim(),
        primaryEmail: editFields.email.trim(),
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

  const handleGalleryUpload = async () => {
    if (!galleryFile) { showToast('Select an image to upload.', 'error'); return; }
    if (galleryFile.size > 5 * 1024 * 1024) { showToast('Image must be under 5MB.', 'error'); return; }
    setGalleryUploading(true);
    try {
      await uploadGalleryImage(galleryFile, galleryTitle, undefined, galleryCategory);
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
            <h1 style={{ margin: 0, fontSize: 30, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--ink)' }}>Dashboard</h1>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#5A6270' }}>Signed in as admin</span>
          </div>

          {/* -- REGISTRATIONS TAB -- */}
          {tab === 'registrations' && (
            <div>
              <div style={styles.statsRow} className="admin-stats-row">
                {regStats.map((s, i) => (
                   <div key={i} style={styles.statCard} className={s.cls ? `stat-card ${s.cls}` : 'stat-card'}>
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
                </div>
              </div>

              <div style={styles.tableWrap} className="admin-table-wrap">
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {['Reg. ID', 'Primary Name', 'Members', 'Phone', 'Email', 'Category', 'ACCE(I)', 'Date', 'Check-in', 'Actions'].map((h) => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {regs.length === 0 ? (
                      <tr><td colSpan={10} style={{ textAlign: 'center', color: '#8A8E96', padding: 40 }}>No registrations match your search.</td></tr>
                    ) : regs.map((r) => (
                      <tr key={r.regId} style={styles.tr} className="virtual-row">
                        <td style={styles.td}>{r.regId}</td>
                        <td style={styles.td}>{r.primaryName}</td>
                        <td style={styles.td}>{r.totalMembers || 1}</td>
                        <td style={styles.td}>{r.primaryMobile}</td>
                        <td style={styles.td}>{r.primaryEmail}</td>
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
                            <button className="action-btn danger" onClick={() => handleDeleteFromModal(r.regId)}>Delete</button>
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

          {/* -- CHECK-IN TAB -- */}
          {tab === 'checkin' && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <BadgeScanner onCheckInSuccess={async () => {
                  await Promise.allSettled([refreshRegs(), refreshCheckins()]);
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
                      <div className="name">{r.primaryName}</div>
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
                  <select
                    value={galleryCategory}
                    onChange={(e) => setGalleryCategory(e.target.value)}
                    style={styles.manualInput}
                  >
                    <option value="events">Event Moments</option>
                    <option value="upcoming">Upcoming Events</option>
                  </select>
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
            <div style={{ marginBottom: 16, padding: "12px 16px", background: "#EFF6FF", borderRadius: 8, border: "1px solid #BFDBFE" }}>
    <div style={{ fontSize: 12, color: "#1E40AF", fontFamily: "var(--font-mono)" }}>
      <strong>Reg ID:</strong> {regModal.record.regId} | <strong>Total Members:</strong> {regModal.record.totalMembers || 1}
    </div>
  </div>
  <h3 style={{ fontSize: 20, marginBottom: 14 }}>{regModal.record.primaryName}</h3>
            <ModalRow label="Reg ID" value={regModal.record.regId} />
            <ModalRow label="Primary Mobile" value={regModal.record.primaryMobile} />
            <ModalRow label="Category" value={regModal.record.category || '---'} />
            <ModalRow label="Check-In" value={regModal.record.checkedIn ? `Checked in${regModal.record.checkedInAt ? ' · ' + new Date(regModal.record.checkedInAt).toLocaleString() : ''}` : 'Not checked in'} />
            
            <ModalRow label="Email" value={regModal.record.primaryEmail} />
            <ModalRow label="Location" value={`${regModal.record.city}, ${regModal.record.state}, ${regModal.record.country}`} />
            <ModalRow label="ACCE(I) Member" value={regModal.record.isACCEMember ? "Yes" : "No"} />
            <div style={{ marginTop: 16 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--teal)", marginBottom: 8 }}>
                Members List ({regModal.record.members?.length || regModal.record.totalMembers || 1})
              </div>
              {regModal.record.members && regModal.record.members.length > 0 ? (
                <div style={{ background: "#F9FAFB", borderRadius: 8, padding: 12, maxHeight: 220, overflow: "auto" }}>
                  {regModal.record.members.map((m, i, arr) => (
                    <div key={m.id || i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < arr.length - 1 ? "1px solid #E5E7EB" : "none" }}>
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 500 }}>{m.memberName}</span>
                        <span style={{ marginLeft: 8, fontSize: 10, padding: "2px 6px", borderRadius: 4, background: m.memberType === "Primary" ? "#DCFCE7" : "#F3F4F6", color: m.memberType === "Primary" ? "#16a34a" : "#6B7280" }}>
                          {m.memberType}
                        </span>
                      </div>
                      {m.memberMobile && <span style={{ fontSize: 12, color: "#6B7280", fontFamily: "var(--font-mono)" }}>{m.memberMobile}</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: "#F9FAFB", borderRadius: 8, padding: 16, textAlign: "center", color: "#6B7280", fontSize: 13 }}>
                  No members found.
                </div>
              )}
            </div>


            <div style={styles.modalActions} className="admin-modal-actions">
              <button className="btn" style={{ background: 'var(--brick)', color: '#fff' }} onClick={() => handleDeleteFromModal(regModal.record!.regId)}>Delete Registration</button>
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

    </>
  );
}

function ModalRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="modal-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--line)', fontSize: 14 }}>
      <span style={{ color: '#5C7086', fontFamily: 'var(--font-mono)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
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
    gridTemplateColumns: 'repeat(2, 1fr)',
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
    padding: '12px 14px',
    border: '1px solid var(--line)',
    borderRadius: 6,
    fontSize: 14,
    background: '#fff',
    fontFamily: 'var(--font-body)',
    minWidth: 240,
    minHeight: 44,
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
    padding: '14px 16px',
    background: 'var(--ink)',
    color: 'var(--paper)',
    fontFamily: 'var(--font-mono)',
    fontSize: 11.5,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap',
    position: 'sticky',
    top: 0,
    zIndex: 1,
    fontWeight: 600,
  },
  tr: {},
  td: {
    padding: '13px 16px',
    borderBottom: '1px solid var(--line)',
    verticalAlign: 'middle',
    whiteSpace: 'nowrap',
    fontSize: 14,
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
