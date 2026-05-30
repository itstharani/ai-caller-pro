export const statsData = [
  { label: 'Total Calls', value: '1,284', delta: '+12%', color: 'var(--accent)' },
  { label: 'Connected',   value: '947',   delta: '+8%',  color: 'var(--blue)' },
  { label: 'Booked',      value: '312',   delta: '+23%', color: 'var(--purple)' },
  { label: 'Failed',      value: '25',    delta: '-5%',  color: 'var(--red)' },
]

export const weeklyData = [
  { day: 'Mon', calls: 82,  booked: 24 },
  { day: 'Tue', calls: 119, booked: 38 },
  { day: 'Wed', calls: 94,  booked: 31 },
  { day: 'Thu', calls: 145, booked: 52 },
  { day: 'Fri', calls: 163, booked: 61 },
  { day: 'Sat', calls: 47,  booked: 18 },
  { day: 'Sun', calls: 38,  booked: 11 },
]

export const campaigns = [
  {
    id: 'C001', name: 'Dental Appointment — June Batch',
    status: 'active', progress: 68, total: 50, called: 34,
    booked: 18, script: 'Hi, this is an automated reminder from City Dental...',
    created: '2025-06-01', voice: 'Nova',
  },
  {
    id: 'C002', name: 'Insurance Renewal Follow-up',
    status: 'paused', progress: 42, total: 80, called: 34,
    booked: 9, script: 'Hello, your car insurance is due for renewal...',
    created: '2025-05-28', voice: 'Alloy',
  },
  {
    id: 'C003', name: 'Clinic Health Checkup Drive',
    status: 'completed', progress: 100, total: 60, called: 60,
    booked: 41, script: 'Good day! We are calling from Apollo Clinics...',
    created: '2025-05-20', voice: 'Shimmer',
  },
  {
    id: 'C004', name: 'Bank KYC Update Reminder',
    status: 'draft', progress: 0, total: 120, called: 0,
    booked: 0, script: 'Dear customer, your KYC documents need updating...',
    created: '2025-06-03', voice: 'Echo',
  },
]

export const calls = [
  { id: 'CL001', contact: 'Priya Sharma',    phone: '+91 98765 43210', campaign: 'Dental Appointment', status: 'booked',    duration: '2:34', time: '10:14 AM', transcript: true },
  { id: 'CL002', contact: 'Arjun Mehta',     phone: '+91 87654 32109', campaign: 'Dental Appointment', status: 'no-answer', duration: '0:08', time: '10:18 AM', transcript: false },
  { id: 'CL003', contact: 'Divya Nair',      phone: '+91 76543 21098', campaign: 'Dental Appointment', status: 'booked',    duration: '3:12', time: '10:22 AM', transcript: true },
  { id: 'CL004', contact: 'Ravi Kumar',      phone: '+91 65432 10987', campaign: 'Dental Appointment', status: 'declined',  duration: '1:05', time: '10:27 AM', transcript: true },
  { id: 'CL005', contact: 'Sneha Iyer',      phone: '+91 54321 09876', campaign: 'Dental Appointment', status: 'calling',   duration: '1:48', time: '10:31 AM', transcript: false },
  { id: 'CL006', contact: 'Karthik Reddy',   phone: '+91 43210 98765', campaign: 'Insurance Renewal',  status: 'booked',    duration: '4:21', time: '09:05 AM', transcript: true },
  { id: 'CL007', contact: 'Meera Pillai',    phone: '+91 32109 87654', campaign: 'Insurance Renewal',  status: 'failed',    duration: '0:00', time: '09:09 AM', transcript: false },
  { id: 'CL008', contact: 'Suresh Babu',     phone: '+91 21098 76543', campaign: 'Health Checkup',     status: 'booked',    duration: '2:55', time: '08:30 AM', transcript: true },
]

export const contacts = [
  { id: 'U001', name: 'Priya Sharma',  phone: '+91 98765 43210', email: 'priya@email.com',  tag: 'VIP',      calls: 4, booked: 3, lastCall: '10:14 AM' },
  { id: 'U002', name: 'Arjun Mehta',  phone: '+91 87654 32109', email: 'arjun@email.com',  tag: 'New',      calls: 1, booked: 0, lastCall: '10:18 AM' },
  { id: 'U003', name: 'Divya Nair',   phone: '+91 76543 21098', email: 'divya@email.com',  tag: null,       calls: 2, booked: 2, lastCall: '10:22 AM' },
  { id: 'U004', name: 'Ravi Kumar',   phone: '+91 65432 10987', email: 'ravi@email.com',   tag: 'DND',      calls: 3, booked: 0, lastCall: '10:27 AM' },
  { id: 'U005', name: 'Sneha Iyer',   phone: '+91 54321 09876', email: 'sneha@email.com',  tag: 'Active',   calls: 5, booked: 3, lastCall: '10:31 AM' },
  { id: 'U006', name: 'Karthik Reddy',phone: '+91 43210 98765', email: 'karthik@email.com',tag: 'VIP',      calls: 6, booked: 5, lastCall: '09:05 AM' },
  { id: 'U007', name: 'Meera Pillai', phone: '+91 32109 87654', email: 'meera@email.com',  tag: null,       calls: 2, booked: 1, lastCall: '09:09 AM' },
  { id: 'U008', name: 'Suresh Babu',  phone: '+91 21098 76543', email: 'suresh@email.com', tag: 'Active',   calls: 3, booked: 2, lastCall: '08:30 AM' },
]

export const transcript = [
  { role: 'ai',   text: 'Hello Priya! This is Maya calling from City Dental. How are you today?', ts: '0:02' },
  { role: 'user', text: 'Hi, Im doing good. Who is this again?', ts: '0:06' },
  { role: 'ai',   text: 'Im an AI assistant calling on behalf of City Dental Clinic. We have some appointment slots open for you this week. Would you like to book a checkup?', ts: '0:10' },
  { role: 'user', text: 'Oh yes actually I was meaning to call. What slots are available?', ts: '0:18' },
  { role: 'ai',   text: 'We have Thursday June 6th at 11am, or Saturday June 8th at 10am. Which works better for you?', ts: '0:24' },
  { role: 'user', text: 'Saturday 10am sounds good.', ts: '0:31' },
  { role: 'ai',   text: 'Perfect! Ive booked you in for Saturday June 8th at 10:00 AM. Youll receive a confirmation SMS shortly. Is there anything else I can help with?', ts: '0:36' },
  { role: 'user', text: 'No thats all, thanks!', ts: '0:48' },
  { role: 'ai',   text: 'Thank you Priya! Have a wonderful day. Goodbye!', ts: '0:52' },
]