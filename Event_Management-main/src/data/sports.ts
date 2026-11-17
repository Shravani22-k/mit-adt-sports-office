export type Dept = 'COMP' | 'IT' | 'ENTC' | 'MECH' | 'CIVIL';

export type EventStatus = 'Open' | 'Closed' | 'Draft' | 'Needs approval';
export type MatchState = 'Upcoming' | 'Live' | 'Innings break' | 'Rain delay' | 'Walkover' | 'Final';

export type SportsEvent = {
  id: string;
  title: string;
  format: string;
  sport: string;
  venue: string;
  date: string;
  slot: string;
  fee: number;
  feeUnit: 'player' | 'team' | 'pair';
  teamSize: number;
  capacity: number;
  registered: number;
  status: EventStatus;
  headId: string | null;
  headName: string | null;
  approvals: 'Approved' | 'Pending' | 'Rejected';
  note?: string;
};

export type Participant = {
  id: string;
  name: string;
  campusId?: string;
  dept: Dept;
  year: string;
  eventId: string;
  team: string;
  idStatus: 'Pending' | 'Verified' | 'Rejected';
  payment: 'Paid' | 'Not required' | 'Pending';
  partner?: string;
  role?: 'campus' | 'walk-in';
  enrolledAt?: string;
};

export type Fixture = {
  id: string;
  eventId: string;
  round: string;
  teamA: Dept;
  teamB: Dept;
  venue: string;
  time: string;
  state: MatchState;
  scoreA: string;
  scoreB: string;
};

export type Head = {
  id: string;
  name: string;
  dept: Dept;
  phone: string;
  email: string;
  sports: string[];
  status: 'Active' | 'Invited';
};

export type Payment = {
  id: string;
  eventId: string;
  amount: number;
  dept: Dept;
  team: string;
  method: string;
  ref: string;
  received: string;
  participantId?: string;
};

export type Student = {
  name: string;
  campusId: string;
  dept: Dept;
  year: string;
};

export type FeedItem = { id: string; text: string; time: string };

export const DEPARTMENTS: { code: Dept; name: string; points: number; gold: number; silver: number; bronze: number }[] = [
  { code: 'COMP', name: 'Computer Engineering', points: 68, gold: 4, silver: 2, bronze: 3 },
  { code: 'ENTC', name: 'Electronics & Telecommunication', points: 61, gold: 3, silver: 4, bronze: 1 },
  { code: 'IT', name: 'Information Technology', points: 56, gold: 3, silver: 1, bronze: 4 },
  { code: 'MECH', name: 'Mechanical Engineering', points: 49, gold: 2, silver: 3, bronze: 2 },
  { code: 'CIVIL', name: 'Civil Engineering', points: 38, gold: 1, silver: 3, bronze: 2 },
];

export const HEADS: Head[] = [
  { id: 'H-01', name: 'Arjun Deshmukh', dept: 'COMP', phone: '+91 98220 44118', email: 'arjun.d@mitwpu.edu.in', sports: ['Box Cricket'], status: 'Active' },
  { id: 'H-02', name: 'Neha Patil', dept: 'IT', phone: '+91 98601 22904', email: 'neha.p@mitwpu.edu.in', sports: ['Badminton', 'Table Tennis'], status: 'Active' },
  { id: 'H-03', name: 'Sana Qureshi', dept: 'ENTC', phone: '+91 93255 78012', email: 'sana.q@mitwpu.edu.in', sports: ['Futsal', 'Kabaddi'], status: 'Active' },
  { id: 'H-04', name: 'Rohit Sable', dept: 'MECH', phone: '+91 99755 61870', email: 'rohit.s@mitwpu.edu.in', sports: ['Athletics', 'Shot Put'], status: 'Active' },
  { id: 'H-05', name: 'Priya Nair', dept: 'CIVIL', phone: '+91 88888 30221', email: 'priya.n@mitwpu.edu.in', sports: ['Chess'], status: 'Invited' },
];

export const SI_WORKSPACE = 'sports-office-v1';

export const seedEvents = (): SportsEvent[] => [
  { id: 'EV-01', title: 'Box Cricket', format: '6 v 6, department teams', sport: 'Cricket', venue: 'Main Turf', date: '2025-02-19', slot: '10:30 AM', fee: 0, feeUnit: 'team', teamSize: 6, capacity: 24, registered: 22, status: 'Open', headId: 'H-01', headName: 'Arjun Deshmukh', approvals: 'Approved' },
  { id: 'EV-02', title: 'Tug of War', format: 'Mixed, 8 members per team', sport: 'Tug of War', venue: 'Outdoor Arena', date: '2025-02-22', slot: '9:00 AM', fee: 200, feeUnit: 'team', teamSize: 8, capacity: 16, registered: 9, status: 'Open', headId: null, headName: null, approvals: 'Approved' },
  { id: 'EV-03', title: 'Badminton Mixed Doubles', format: 'Mixed doubles, knockout', sport: 'Badminton', venue: 'Indoor Gymkhana', date: '2025-02-24', slot: '11:00 AM', fee: 0, feeUnit: 'pair', teamSize: 2, capacity: 16, registered: 12, status: 'Open', headId: 'H-02', headName: 'Neha Patil', approvals: 'Approved' },
  { id: 'EV-04', title: 'Futsal (Women)', format: '5 v 5, department teams', sport: 'Futsal', venue: 'Basketball Court 1', date: '2025-02-26', slot: '5:00 PM', fee: 100, feeUnit: 'player', teamSize: 5, capacity: 30, registered: 18, status: 'Open', headId: 'H-03', headName: 'Sana Qureshi', approvals: 'Approved' },
  { id: 'EV-05', title: 'Kabaddi', format: '7 v 7, knockout', sport: 'Kabaddi', venue: 'Indoor Gymkhana', date: '2025-03-01', slot: '8:30 AM', fee: 150, feeUnit: 'team', teamSize: 7, capacity: 14, registered: 7, status: 'Needs approval', headId: 'H-03', headName: 'Sana Qureshi', approvals: 'Pending', note: 'Addition of Kabaddi to the GC programme. Fee set at ₹150 per team.' },
  { id: 'EV-06', title: '60m Sprint', format: 'Individual, heats then final', sport: 'Athletics', venue: 'Main Turf', date: '2025-03-04', slot: '7:30 AM', fee: 50, feeUnit: 'player', teamSize: 1, capacity: 40, registered: 0, status: 'Draft', headId: 'H-04', headName: 'Rohit Sable', approvals: 'Pending', note: 'Needs sports office sign-off on timing equipment.' },
];

export const seedParticipants = (): Participant[] => [
  { id: 'P-01', name: 'Shravani kharade', dept: 'COMP', year: 'SE', eventId: 'EV-01', team: 'COMP A', idStatus: 'Verified', payment: 'Not required' },
  { id: 'P-02', name: 'Shravani Kharade', dept: 'ENTC', year: 'TE', eventId: 'EV-01', team: 'ENTC', idStatus: 'Verified', payment: 'Not required' },
  { id: 'P-03', name: 'Shreya Vardhe', dept: 'COMP', year: 'SE', eventId: 'EV-01', team: 'COMP A', idStatus: 'Pending', payment: 'Not required' },
  { id: 'P-04', name: 'Ishaan Pawar', dept: 'MECH', year: 'BE', eventId: 'EV-02', team: 'MECH', idStatus: 'Verified', payment: 'Paid' },
  { id: 'P-05', name: 'Snehmoy Chatterjee', dept: 'IT', year: 'TE', eventId: 'EV-03', team: 'IT', idStatus: 'Verified', payment: 'Not required', partner: 'Riya Joshi' },
  { id: 'P-06', name: 'Kavya Nair', dept: 'CIVIL', year: 'SE', eventId: 'EV-02', team: 'CIVIL', idStatus: 'Pending', payment: 'Pending' },
];

export const seedFixtures = (): Fixture[] => [
  { id: 'FX-01', eventId: 'EV-01', round: 'Pool A · Match 08', teamA: 'COMP', teamB: 'ENTC', venue: 'Main Turf', time: 'Feb 19 · 10:30 AM', state: 'Upcoming', scoreA: '—', scoreB: '—' },
  { id: 'FX-02', eventId: 'EV-01', round: 'Pool A · Match 07', teamA: 'MECH', teamB: 'CIVIL', venue: 'Main Turf', time: 'Feb 17 · 10:15 AM', state: 'Final', scoreA: '42/3', scoreB: '38/5' },
  { id: 'FX-03', eventId: 'EV-04', round: 'Semi-final 1', teamA: 'IT', teamB: 'MECH', venue: 'Basketball Court 1', time: 'Feb 17 · 10:30 AM', state: 'Live', scoreA: '2', scoreB: '1' },
  { id: 'FX-04', eventId: 'EV-03', round: 'Quarter-final 2', teamA: 'CIVIL', teamB: 'IT', venue: 'Indoor Gymkhana', time: 'Feb 17 · 11:30 AM', state: 'Upcoming', scoreA: '—', scoreB: '—' },
  { id: 'FX-05', eventId: 'EV-02', round: 'Opening round', teamA: 'MECH', teamB: 'CIVIL', venue: 'Outdoor Arena', time: 'Feb 22 · 9:00 AM', state: 'Upcoming', scoreA: '—', scoreB: '—' },
];

export const seedPayments = (): Payment[] => [
  { id: 'PAY-1043', eventId: 'EV-02', amount: 200, dept: 'MECH', team: 'MECH', method: 'UPI · GPay', ref: 'GPAY-829104', received: '16 Feb 2025' },
  { id: 'PAY-1044', eventId: 'EV-04', amount: 500, dept: 'IT', team: 'IT Women', method: 'UPI · PhonePe', ref: 'PPE-441870', received: '16 Feb 2025' },
  { id: 'PAY-1045', eventId: 'EV-04', amount: 500, dept: 'ENTC', team: 'ENTC Women', method: 'Card', ref: 'HDFC-772013', received: '15 Feb 2025' },
  { id: 'PAY-1046', eventId: 'EV-02', amount: 200, dept: 'CIVIL', team: 'CIVIL', method: 'UPI · GPay', ref: 'GPAY-118355', received: '15 Feb 2025' },
];

export const feed = (): FeedItem[] => [
  { id: 'N-1', text: 'Kabaddi submitted by Sana Qureshi for approval.', time: '10:12' },
  { id: 'N-2', text: 'Payment ₹200 recorded for MECH · Tug of War.', time: '09:48' },
  { id: 'N-3', text: 'Aarav Desai added to Box Cricket · COMP A.', time: '09:21' },
];

export const departmentName = (code: Dept) => DEPARTMENTS.find((d) => d.code === code)?.name ?? code;
export const feeFor = (event: SportsEvent, people: number) => (event.feeUnit === 'player' ? event.fee * people : event.fee);
export const eventName = (events: SportsEvent[], id: string) => events.find((e) => e.id === id)?.title ?? 'Unknown event';