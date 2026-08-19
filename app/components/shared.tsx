"use client";

import type { User } from "@/lib/data";
import { band, fmt, initials, maskCard, maskPhone, score } from "@/lib/data";

export function Panel({ children, narrow = false }: { children: React.ReactNode; narrow?: boolean }) {
  return <section className={narrow ? "panel narrow" : "panel"}>{children}</section>;
}

export function Metric({ title, value }: { title: string; value: string | number }) {
  return <article className="metric"><span>{title}</span><b>{value}</b></article>;
}

export function StatusText({ signal }: { signal: string }) {
  const good = signal.startsWith("Likely");
  const mid = signal.startsWith("May");
  return <div className={good ? "signal good" : mid ? "signal mid" : "signal low"}><h2>{good ? "Your profile looks strong for this request" : mid ? "This request may qualify after lender review" : "This amount may be difficult to support"}</h2><b>{signal}</b></div>;
}

export function ConsumerProfileHero({ u }: { u: User }) {
  const s = score(u);
  return <Panel><div className="identity-head"><span className="avatar">{initials(u.fullName)}</span><div><h2>{u.fullName}</h2><p className="check">✓ CredLink verified</p></div></div><section className="score-band small"><strong>{s}</strong><span>{band(s)}</span></section></Panel>;
}

export function VerifiedIdentityCard({ u }: { u: User }) {
  return <Panel><h2>Verified identity</h2><div className="grid two"><Metric title="Ghana Card" value={maskCard(u.ghanaCard)} /><Metric title="Phone" value={maskPhone(u.phone)} /><Metric title="Location" value={u.location} /><Metric title="Identity and phone" value="Verified" /></div></Panel>;
}

export function ConnectedSourceCard({ u }: { u: User }) {
  return <Panel><h2>Connected financial sources</h2><div className="grid three"><Metric title="Source" value={u.source} /><Metric title="Connection" value="Connected + verified" /><Metric title="History" value={`${u.historyMonths} months`} /></div></Panel>;
}

export function PermissionsCard({ activeInstitutions }: { activeInstitutions: string[] }) {
  return <Panel><h2>Data permissions</h2>{activeInstitutions.length ? activeInstitutions.map((name) => <p className="check" key={name}>✓ {name}</p>) : <p className="muted">No active institution access permissions right now.</p>}</Panel>;
}

export function ProfileQuickActions({ go }: { go: (path: string) => void }) {
  return <Panel><h2>Quick actions</h2><div className="chips"><button onClick={() => go("/score")}>View my score</button><button onClick={() => go("/eligibility")}>Explore loan options</button><button onClick={() => go("/applications")}>View applications</button></div></Panel>;
}

export function TermCapacityCard({ months, estimate, copy }: { months: number; estimate: number; copy: string }) {
  return <article className="advice"><b>{months} months</b><span>Up to {fmt(estimate)}</span><small>{copy}</small></article>;
}

export function BorrowingCapacity({ terms }: { terms: Array<{ months: number; estimate: number; copy: string }> }) {
  return <Panel><h2>Estimated borrowing capacity</h2><div className="grid two">{terms.map((term) => <TermCapacityCard key={term.months} months={term.months} estimate={term.estimate} copy={term.copy} />)}</div></Panel>;
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
  return <Panel><h2>Assess a loan</h2><label className="field"><span>Amount (GH₵)</span><input inputMode="numeric" value={props.amount} onChange={(e) => props.setAmount(Number(e.target.value.replace(/\D/g, "")) || 0)} /></label><div className="chips">{[1000, 2500, 5000, 7500, 10000].map((n) => <button key={n} onClick={() => props.setAmount(n)}>{fmt(n)}</button>)}</div><div className="chips">{[3, 6, 9, 12].map((n) => <button className={props.months === n ? "active" : ""} key={n} onClick={() => props.setMonths(n)}>{n} months</button>)}</div><button className="primary" onClick={props.onAssess}>Assess this loan</button>{props.assessed && <><StatusText signal={props.amount > props.supported ? "Above estimated capacity" : props.signal} /><div className="grid three"><Metric title="Requested amount" value={fmt(props.amount)} /><Metric title="Illustrative monthly repayment" value={`${fmt(props.monthly)}/month`} /><Metric title="Estimated supported amount" value={fmt(props.supported)} /><Metric title="CredLink Score" value={props.scoreValue} /><Metric title="Confidence" value={props.confidence} /><Metric title="Repayment period" value={`${props.months} months`} /></div><div className="grid two"><Panel><h3>Why this result? Strengths</h3>{props.strengths.map((x) => <p className="check" key={x}>✓ {x}</p>)}</Panel><Panel><h3>Concerns</h3>{props.concerns.map((x) => <p key={x}>{x}</p>)}</Panel></div>{props.amount > props.supported && <div className="warning"><h3>Suggested alternatives</h3><p>Try {fmt(props.saferAmount)} for this term or choose a longer term.</p><button onClick={props.onUseSafer}>Use smaller amount</button><button onClick={props.onUseLonger}>Try 12 months</button></div>}</>}</Panel>;
}
