-- ============================================================
-- ACCE — Performance Indexes for 10k+ concurrent users
-- Run this in Supabase SQL Editor AFTER the base schema.sql
-- ============================================================

-- GIN index for full-text search on registrations
-- Speeds up the admin search across full_name, reg_id, mobile, email
CREATE INDEX IF NOT EXISTS idx_registrations_search
  ON registrations
  USING GIN (
    to_tsvector('simple',
      coalesce(full_name, '') || ' ' ||
      coalesce(reg_id, '') || ' ' ||
      coalesce(mobile, '') || ' ' ||
      coalesce(email, '')
    )
  );

-- Composite index for date-filtered queries + ordering
CREATE INDEX IF NOT EXISTS idx_registrations_created_at_desc
  ON registrations (created_at DESC NULLS LAST);

-- Index for check-in status queries (admin dashboard)
CREATE INDEX IF NOT EXISTS idx_registrations_checked_in
  ON registrations (checked_in)
  WHERE checked_in = true;

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_registrations_category
  ON registrations (category);

-- Composite index for sponsorships search
CREATE INDEX IF NOT EXISTS idx_sponsorships_search
  ON sponsorships
  USING GIN (
    to_tsvector('simple',
      coalesce(company_name, '') || ' ' ||
      coalesce(sponsor_id, '') || ' ' ||
      coalesce(contact_person, '')
    )
  );
