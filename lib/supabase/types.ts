export type PaymentStatus = 'pending' | 'verified' | 'rejected';

export interface Registration {
  id: string;
  reg_id: string;
  full_name: string;
  photo_url: string | null;
  mobile: string;
  email: string;
  qualification: string | null;
  org_name: string | null;
  course_branch: string | null;
  grad_year: string | null;
  designation: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pin: string | null;
  address: string | null;
  is_acce_member: boolean;
  payment_amount: number;
  payment_screenshot_url: string | null;
  payment_status: PaymentStatus;
  checked_in: boolean;
  checked_in_at: string | null;
  created_at: string;
}

export interface Sponsorship {
  id: string;
  sponsor_id: string;
  company_name: string;
  contact_person: string;
  phone: string;
  email: string;
  website: string | null;
  address: string | null;
  logo_url: string | null;
  gst: string | null;
  requirements: string | null;
  payment_status: PaymentStatus;
  created_at: string;
}

// Frontend-friendly types (snake_case → camelCase)
export interface RegUI {
  regId: string;
  fullName: string;
  photo: string;
  mobile: string;
  email: string;
  qualification: string;
  orgName: string;
  courseBranch: string;
  gradYear: string;
  designation: string;
  city: string;
  state: string;
  country: string;
  pin: string;
  address: string;
  isACCEMember: boolean;
  paymentAmount: number;
  paymentScreenshot: string;
  paymentStatus: PaymentStatus;
  checkedIn: boolean;
  checkedInAt: string | null;
  createdAt: string;
}

export interface SpnUI {
  sponsorId: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  logo: string;
  gst: string;
  requirements: string;
  paymentStatus: PaymentStatus;
  createdAt: string;
}

export function regToUI(r: Registration): RegUI {
  return {
    regId: r.reg_id,
    fullName: r.full_name,
    photo: r.photo_url || '',
    mobile: r.mobile,
    email: r.email,
    qualification: r.qualification || '',
    orgName: r.org_name || '',
    courseBranch: r.course_branch || '',
    gradYear: r.grad_year || '',
    designation: r.designation || '',
    city: r.city || '',
    state: r.state || '',
    country: r.country || 'India',
    pin: r.pin || '',
    address: r.address || '',
    isACCEMember: r.is_acce_member,
    paymentAmount: r.payment_amount,
    paymentScreenshot: r.payment_screenshot_url || '',
    paymentStatus: r.payment_status,
    checkedIn: r.checked_in,
    checkedInAt: r.checked_in_at,
    createdAt: r.created_at,
  };
}

export function spnToUI(s: Sponsorship): SpnUI {
  return {
    sponsorId: s.sponsor_id,
    companyName: s.company_name,
    contactPerson: s.contact_person,
    phone: s.phone,
    email: s.email,
    website: s.website || '',
    address: s.address || '',
    logo: s.logo_url || '',
    gst: s.gst || '',
    requirements: s.requirements || '',
    paymentStatus: s.payment_status,
    createdAt: s.created_at,
  };
}
