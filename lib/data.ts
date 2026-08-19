export type Status = "pending" | "needs_review" | "approved" | "declined";

export type User = {
  id: string;
  fullName: string;
  firstName: string;
  ghanaCard: string;
  phone: string;
  otp: string;
  location: string;
  source: string;
  historyMonths: number;
  completedCycles: number;
  activeGroups: number;
  averageMonthlyContribution: number;
  onTimeContributionRate: number;
  missedContributions: number;
  lateContributionRate: number;
  scoreComponents: Record<string, number>;
  institutionAccess?: boolean;
};

export type Application = {
  id: string;
  userId: string;
  amount: number;
  repaymentMonths: number;
  purpose: string;
  status: Status;
  consentGranted: boolean;
  signal: string;
  score: number;
  monthly: number;
  supported: number;
  createdAt: string;
  updatedAt: string;
  note?: string;
  decidedBy?: string;
  decidedAt?: string;
};

export const factors = [
  ["contributionConsistency", "Contribution consistency", 25, "Regular contributions make the profile easier to understand."],
  ["paymentTimeliness", "Payment timeliness", 20, "Shows whether scheduled contributions arrive on time."],
  ["savingsStability", "Savings stability", 15, "Looks at whether contribution amounts stay steady."],
  ["susuObligationPerformance", "Susu obligation performance", 15, "Reflects cycle completion and payout reliability."],
  ["groupTenure", "Group tenure", 10, "Longer verified participation improves confidence."],
  ["contributionCapacity", "Contribution capacity", 10, "Compares requested borrowing with demonstrated contribution level."],
  ["behaviouralAnomalies", "Behavioural anomalies", 5, "Higher is better and means fewer concerning patterns."],
] as const;

export const users: User[] = [
  { id: "usr_ama_mensah", fullName: "Ama Serwaa Mensah", firstName: "Ama", ghanaCard: "GHA-000000001-1", phone: "0245550187", otp: "482731", location: "Madina, Accra", source: "Unity Susu Cooperative", historyMonths: 18, completedCycles: 3, activeGroups: 1, averageMonthlyContribution: 750, onTimeContributionRate: 94, missedContributions: 1, lateContributionRate: 6, institutionAccess: true, scoreComponents: { contributionConsistency: 88, paymentTimeliness: 94, savingsStability: 78, susuObligationPerformance: 85, groupTenure: 75, contributionCapacity: 72, behaviouralAnomalies: 95 } },
  { id: "usr_kojo_asare", fullName: "Kojo Kwame Asare", firstName: "Kojo", ghanaCard: "GHA-000000002-2", phone: "0556142738", otp: "619204", location: "Kasoa, Central Region", source: "Nkabom Susu Services", historyMonths: 12, completedCycles: 1, activeGroups: 1, averageMonthlyContribution: 500, onTimeContributionRate: 72, missedContributions: 3, lateContributionRate: 28, institutionAccess: true, scoreComponents: { contributionConsistency: 72, paymentTimeliness: 70, savingsStability: 60, susuObligationPerformance: 65, groupTenure: 50, contributionCapacity: 58, behaviouralAnomalies: 80 } },
  { id: "usr_efua_owusu", fullName: "Efua Akosua Owusu", firstName: "Efua", ghanaCard: "GHA-000000003-3", phone: "0207834516", otp: "357816", location: "Tema Community 25", source: "Progress Susu Network", historyMonths: 5, completedCycles: 0, activeGroups: 1, averageMonthlyContribution: 300, onTimeContributionRate: 54, missedContributions: 4, lateContributionRate: 32, institutionAccess: true, scoreComponents: { contributionConsistency: 48, paymentTimeliness: 52, savingsStability: 40, susuObligationPerformance: 45, groupTenure: 30, contributionCapacity: 42, behaviouralAnomalies: 60 } },
];

export const fmt = (n: number) => `GH₵${Math.round(n).toLocaleString()}`;
export const phone = (v: string) => `${v.slice(0, 3)} ${v.slice(3, 6)} ${v.slice(6)}`;
export const maskPhone = (v: string) => `${v.slice(0, 3)} ••• •${v.slice(-3)}`;
export const maskCard = (v: string) => `GHA-•••••••${v.slice(8, 11)}-${v.slice(-1)}`;
export const clean = (v: string) => v.replace(/\s/g, "").toUpperCase();
export const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
export const initials = (fullName: string) => fullName.split(" ").map((part) => part[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

export const score = (u: User) => Math.round(factors.reduce((sum, [key, , weight]) => sum + u.scoreComponents[key] * (weight / 100), 0));
export const band = (s: number) => s >= 80 ? "Strong" : s >= 65 ? "Good" : s >= 50 ? "Developing" : s >= 35 ? "Limited" : "Very limited";
export const scoreFactor = (s: number) => s >= 80 ? 0.8 : s >= 70 ? 0.7 : s >= 60 ? 0.6 : s >= 50 ? 0.45 : 0.3;
export const estimatedMonthlyCapacity = (u: User) => u.averageMonthlyContribution * scoreFactor(score(u));
export const estimatedSupportedAmount = (u: User, months: number) => estimatedMonthlyCapacity(u) * months;

export function events(u: User) {
  const base = [
    ["CONTRIBUTION_MADE", u.averageMonthlyContribution, "12 Aug 2026", "Paid on time", "UTY-260812-A7K3"],
    ["CONTRIBUTION_MADE", u.averageMonthlyContribution, "12 Jul 2026", "Paid on time", "UTY-260712-P4M8"],
    ["CYCLE_COMPLETED", 0, "30 May 2026", "Verified", "UTY-260530-C8J2"],
    ["PAYOUT_RECEIVED", u.averageMonthlyContribution * 6, "30 May 2026", "Verified payout", "UTY-260530-P6N1"],
    ["CONTRIBUTION_LATE", u.averageMonthlyContribution, "12 Apr 2026", "Paid late", "UTY-260412-L2D7"],
    ["GROUP_JOINED", 0, "19 Feb 2025", "Verified partner data", "UTY-250219-G4K9"],
  ];
  return base.map(([type, amount, date, state, ref]) => ({ type: String(type), amount: Number(amount), date: String(date), state: String(state), ref: String(ref), source: u.source }));
}

export function checkEligibility(u: User, amount: number, months: number) {
  const s = score(u);
  const monthlyCapacity = estimatedMonthlyCapacity(u);
  const supported = estimatedSupportedAmount(u, months);
  const monthly = amount / months;
  const likely = s >= 70 && u.historyMonths >= 6 && amount <= supported && u.missedContributions <= 2;
  const review = !likely && s >= 55 && amount <= supported * 1.3;
  const signal = likely ? "Likely eligible" : review ? "May qualify — lender review recommended" : "Unlikely at this amount";
  const confidence = s >= 80 && u.historyMonths >= 12 ? "High" : u.historyMonths >= 6 ? "Medium" : "Low";
  return {
    s,
    supported,
    monthly,
    signal,
    confidence,
    comfortableLow: supported * 0.5,
    comfortableHigh: supported * 0.8,
    safer: Math.max(500, Math.round((monthlyCapacity * months) / 100) * 100),
  };
}
