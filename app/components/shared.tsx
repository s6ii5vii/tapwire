"use client";

import type { User } from "@/lib/data";
import { band, fmt, initials, maskCard, maskPhone, score } from "@/lib/data";

export function Panel({ children, narrow = false, className = "" }: { children: React.ReactNode; narrow?: boolean; className?: string }) {
  return <section className={`${narrow ? "panel narrow" : "panel"} ${className}`.trim()}>{children}</section>;
}

export function Metric({ title, value }: { title: string; value: string | number }) {
  const metricClass = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return <article className={`metric metric-${metricClass}`}><span>{title}</span><b>{value}</b></article>;
}

export function StatusText({ signal }: { signal: string }) {
  const good = signal.startsWith("Likely");
  const mid = signal.startsWith("May");
  const above = signal.startsWith("Above");
  return <div className={good ? "signal good" : mid ? "signal mid" : "signal low"}><h2>{good ? "Your profile looks strong for this request" : mid ? "This request may qualify after lender review" : above ? "Above estimated capacity" : "This amount may be difficult to support"}</h2><b>{signal}</b></div>;
}

export function ConsumerProfileHero({ u }: { u: User }) {
  const s = score(u);
  return <Panel className="profile-hero"><div className="profile-hero-top"><div className="identity-head"><span className="avatar">{initials(u.fullName)}</span><div><p className="eyebrow">CredLink financial identity</p><h2>{u.fullName}</h2><p className="check">✓ CredLink verified</p><p className="muted">A verified view of your financial behaviour.</p></div></div><section className="score-band small"><span>CredLink Score</span><strong>{s}</strong><b>{band(s)}</b></section></div></Panel>;
}

export function VerifiedIdentityCard({ u }: { u: User }) {
  return <Panel><h2>Verified identity</h2><div className="grid two"><Metric title="Ghana Card" value={maskCard(u.ghanaCard)} /><Metric title="Mobile" value={maskPhone(u.phone)} /><Metric title="Location" value={u.location} /><Metric title="Verification" value="Identity + phone verified" /></div></Panel>;
}

export function ConnectedSourceCard({ u }: { u: User }) {
  return <Panel><h2>Connected financial sources</h2><div className="source-card"><div><h3>{u.source}</h3><p className="check">✓ Verified source</p></div><b>Connected</b><small>{u.historyMonths} months of financial activity</small></div><p className="hint">CredLink uses permitted activity from this source to build your financial profile.</p></Panel>;
}

export function PermissionsCard({ activeInstitutions }: { activeInstitutions: string[] }) {
  return <Panel><h2>Data permissions</h2><p className="muted">You control when a participating lender can access your CredLink financial information.</p>{activeInstitutions.length ? activeInstitutions.map((name) => <div className="permission-row" key={name}><div><b>{name}</b><small>Loan assessment</small></div><span className="status approved">Access active</span></div>) : <p className="muted">No active lender access.</p>}</Panel>;
}

export function ProfileQuickActions({ go }: { go: (path: string) => void }) {
  return <Panel><h2>What would you like to do?</h2><div className="chips"><button onClick={() => go("/score")}>View my score</button><button onClick={() => go("/eligibility")}>Explore loan options</button><button onClick={() => go("/applications")}>View applications</button></div></Panel>;
}

export function TermCapacityCard({ months, estimate, copy }: { months: number; estimate: number; copy: string }) {
  return <article className="advice"><b>{months} months</b><span>Up to {fmt(estimate)}</span><small>{copy}</small></article>;
}

export function BorrowingCapacity({ terms }: { terms: Array<{ months: number; estimate: number; copy: string }> }) {
  return <Panel><h2>Estimated borrowing capacity</h2><div className="grid four">{terms.map((term) => <TermCapacityCard key={term.months} months={term.months} estimate={term.estimate} copy={term.copy} />)}</div></Panel>;
}

export function InstitutionLoanAssessment(props: {
  amount: number;
  setAmount: (n: number) => void;
  months: number;
  setMonths: (n: number) => void;
  assessed: boolean;
  onAssess: () => void;
  signal: string;
  monthly: number;
  supported: number;
  scoreValue: number;
  confidence: string;
  strengths: string[];
  concerns: string[];
  saferAmount: number;
  onUseSafer: () => void;
  onUseLonger: () => void;
}) {
  return <Panel><h2>Assess a loan</h2><div className="assess-form"><label className="field"><span>Loan amount (GH₵)</span><input inputMode="numeric" value={props.amount} onChange={(e) => props.setAmount(Number(e.target.value.replace(/\D/g, "")) || 0)} /></label><div><span className="field-label">Repayment period</span><div className="chips">{[3, 6, 9, 12].map((n) => <button className={props.months === n ? "active" : ""} key={n} onClick={() => props.setMonths(n)}>{n} months</button>)}</div></div></div><div className="chips">{[1000, 2500, 5000, 7500, 10000].map((n) => <button key={n} onClick={() => props.setAmount(n)}>{fmt(n)}</button>)}</div><button className="primary" onClick={props.onAssess}>Assess this loan</button>{props.assessed && <><StatusText signal={props.amount > props.supported ? "Above estimated capacity" : props.signal} /><div className="grid three"><Metric title="Requested" value={fmt(props.amount)} /><Metric title="Illustrative repayment" value={`${fmt(props.monthly)}/month`} /><Metric title="Estimated supported" value={fmt(props.supported)} /><Metric title="CredLink Score" value={props.scoreValue} /><Metric title="Confidence" value={props.confidence} /><Metric title="Period" value={`${props.months} months`} /></div><div className="grid two"><div className="assess-reasons"><h3>Strengths</h3>{props.strengths.filter(Boolean).map((x) => <p className="check" key={x}>✓ {x}</p>)}</div><div className="assess-reasons"><h3>Concerns</h3>{props.concerns.map((x) => <p key={x}>{x}</p>)}</div></div>{props.amount > props.supported && <div className="warning"><h3>Suggested alternatives</h3><p>Try {fmt(props.saferAmount)} for this term or choose a longer term.</p><button onClick={props.onUseSafer}>Use smaller amount</button><button onClick={props.onUseLonger}>Try 12 months</button></div>}</>}</Panel>;
}
