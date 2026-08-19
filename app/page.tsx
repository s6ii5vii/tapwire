"use client";

import { useEffect, useMemo, useState } from "react";

const APP_CONFIG = {
  name: "CredLink",
  shortName: "CredLink",
  tagline: "Turning financial behaviour into financial opportunity.",
  shortTagline: "Your financial history, connected.",
};

type Status = "pending" | "needs_review" | "approved" | "declined";
type User = {
  id: string; fullName: string; firstName: string; ghanaCard: string; phone: string; otp: string; location: string; source: string;
  historyMonths: number; completedCycles: number; activeGroups: number; averageMonthlyContribution: number; onTimeContributionRate: number;
  missedContributions: number; lateContributionRate: number; scoreComponents: Record<string, number>;
};
type Application = {
  id: string; userId: string; amount: number; repaymentMonths: number; purpose: string; status: Status; consentGranted: boolean;
  signal: string; score: number; monthly: number; supported: number; createdAt: string; updatedAt: string; note?: string; decidedBy?: string; decidedAt?: string;
};

const factors = [
  ["contributionConsistency", "Contribution consistency", 25, "Regular contributions make the profile easier to understand."],
  ["paymentTimeliness", "Payment timeliness", 20, "Shows whether scheduled contributions arrive on time."],
  ["savingsStability", "Savings stability", 15, "Looks at whether contribution amounts stay steady."],
  ["susuObligationPerformance", "Susu obligation performance", 15, "Reflects cycle completion and payout reliability."],
  ["groupTenure", "Group tenure", 10, "Longer verified participation improves confidence."],
  ["contributionCapacity", "Contribution capacity", 10, "Compares requested borrowing with demonstrated contribution level."],
  ["behaviouralAnomalies", "Behavioural anomalies", 5, "Higher is better and means fewer concerning patterns."],
] as const;

const users: User[] = [
  { id: "usr_ama_mensah", fullName: "Ama Serwaa Mensah", firstName: "Ama", ghanaCard: "GHA-000000001-1", phone: "0245550187", otp: "482731", location: "Madina, Accra", source: "Unity Susu Cooperative", historyMonths: 18, completedCycles: 3, activeGroups: 1, averageMonthlyContribution: 750, onTimeContributionRate: 94, missedContributions: 1, lateContributionRate: 6, scoreComponents: { contributionConsistency: 88, paymentTimeliness: 94, savingsStability: 78, susuObligationPerformance: 85, groupTenure: 75, contributionCapacity: 72, behaviouralAnomalies: 95 } },
  { id: "usr_kojo_asare", fullName: "Kojo Kwame Asare", firstName: "Kojo", ghanaCard: "GHA-000000002-2", phone: "0556142738", otp: "619204", location: "Kasoa, Central Region", source: "Nkabom Susu Services", historyMonths: 12, completedCycles: 1, activeGroups: 1, averageMonthlyContribution: 500, onTimeContributionRate: 72, missedContributions: 3, lateContributionRate: 28, scoreComponents: { contributionConsistency: 72, paymentTimeliness: 70, savingsStability: 60, susuObligationPerformance: 65, groupTenure: 50, contributionCapacity: 58, behaviouralAnomalies: 80 } },
  { id: "usr_efua_owusu", fullName: "Efua Akosua Owusu", firstName: "Efua", ghanaCard: "GHA-000000003-3", phone: "0207834516", otp: "357816", location: "Tema Community 25", source: "Progress Susu Network", historyMonths: 5, completedCycles: 0, activeGroups: 1, averageMonthlyContribution: 300, onTimeContributionRate: 54, missedContributions: 4, lateContributionRate: 32, scoreComponents: { contributionConsistency: 48, paymentTimeliness: 52, savingsStability: 40, susuObligationPerformance: 45, groupTenure: 30, contributionCapacity: 42, behaviouralAnomalies: 60 } },
];

const fmt = (n: number) => `GH₵${Math.round(n).toLocaleString()}`;
const phone = (v: string) => `${v.slice(0, 3)} ${v.slice(3, 6)} ${v.slice(6)}`;
const maskPhone = (v: string) => `${v.slice(0, 3)} ••• •${v.slice(-3)}`;
const maskCard = (v: string) => `GHA-•••••••${v.slice(8, 11)}-${v.slice(-1)}`;
const score = (u: User) => Math.round(factors.reduce((sum, [key, , weight]) => sum + u.scoreComponents[key] * (weight / 100), 0));
const band = (s: number) => s >= 80 ? "Strong" : s >= 65 ? "Good" : s >= 50 ? "Developing" : s >= 35 ? "Limited" : "Very limited";
const clean = (v: string) => v.replace(/\s/g, "").toUpperCase();
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function events(u: User) {
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

function checkEligibility(u: User, amount: number, months: number) {
  const s = score(u);
  const sf = s >= 80 ? 0.8 : s >= 70 ? 0.7 : s >= 60 ? 0.6 : s >= 50 ? 0.45 : 0.3;
  const capacity = u.averageMonthlyContribution * sf;
  const supported = capacity * months;
  const monthly = amount / months;
  const likely = s >= 70 && u.historyMonths >= 6 && amount <= supported && u.missedContributions <= 2;
  const review = !likely && s >= 55 && amount <= supported * 1.3;
  const signal = likely ? "Likely eligible" : review ? "May qualify — lender review recommended" : "Unlikely at this amount";
  const confidence = s >= 80 && u.historyMonths >= 12 ? "High" : u.historyMonths >= 6 ? "Medium" : "Developing";
  return { s, supported, monthly, signal, confidence, comfortableLow: supported * 0.48, comfortableHigh: supported * 0.76, safer: Math.max(500, Math.round(supported / 100) * 100) };
}

export default function Home() {
  const [route, setRoute] = useState("/");
  const [sessionId, setSessionId] = useState("");
  const [onboarded, setOnboarded] = useState<string[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [ghanaCard, setGhanaCard] = useState("GHA-000000001-1");
  const [mobile, setMobile] = useState("024 555 0187");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [consent, setConsent] = useState(false);
  const [syncStep, setSyncStep] = useState(0);
  const [amount, setAmount] = useState(5000);
  const [months, setMonths] = useState(12);
  const [purpose, setPurpose] = useState("Business");
  const [checked, setChecked] = useState(false);
  const [loanConsent, setLoanConsent] = useState(true);
  const [inst, setInst] = useState({ email: "daniel.ofori@akwaabamfi.test", password: "CredLinkDemo26!", ok: false });
  const user = users.find((u) => u.id === sessionId) ?? users[0];
  const result = useMemo(() => checkEligibility(user, amount, months), [user, amount, months]);
  const userApps = apps.filter((a) => a.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  useEffect(() => {
    const load = () => {
      setSessionId(localStorage.getItem("credlink.session") ?? "");
      setOnboarded(JSON.parse(localStorage.getItem("credlink.onboarded") ?? "[]"));
      setApps(JSON.parse(localStorage.getItem("credlink.apps") ?? "[]"));
      setRoute(location.pathname);
    };
    load();
    addEventListener("storage", load);
    addEventListener("focus", load);
    return () => { removeEventListener("storage", load); removeEventListener("focus", load); };
  }, []);

  const go = (path: string) => { history.pushState(null, "", path); setRoute(path); scrollTo(0, 0); };
  const saveApps = (next: Application[]) => { setApps(next); localStorage.setItem("credlink.apps", JSON.stringify(next)); };
  const setSession = (id: string) => { setSessionId(id); localStorage.setItem("credlink.session", id); };
  const currentApp = apps.find((a) => route.includes(a.id));
  const appUser = users.find((u) => u.id === currentApp?.userId) ?? users[0];

  async function login() {
    setError(""); setBusy("Verifying your identity...");
    await delay(650);
    const found = users.find((u) => clean(u.ghanaCard) === clean(ghanaCard) && clean(u.phone) === clean(mobile));
    if (!found) { setBusy(""); setError("We couldn't match those details. Check the Ghana Card number and mobile number or use a demo profile."); return; }
    setSession(found.id); setBusy(`Identity verified — ${found.fullName}`);
    await delay(550); setBusy(""); setOtp(""); go("/otp");
  }
  async function verify() {
    setError(""); setBusy("Checking code...");
    await delay(500);
    if (otp !== user.otp) { setBusy(""); setError("That code isn't correct. For this demo, use the verification code shown below."); return; }
    setBusy("Number verified"); await delay(450); setBusy("");
    go(onboarded.includes(user.id) ? "/dashboard" : "/consent");
  }
  async function sync() {
    go("/sync");
    for (let i = 0; i < 7; i++) { setSyncStep(i + 1); await delay(430); }
    const next = Array.from(new Set([...onboarded, user.id]));
    setOnboarded(next); localStorage.setItem("credlink.onboarded", JSON.stringify(next));
  }
  async function submitApplication() {
    if (!loanConsent) return;
    setBusy("Sharing permitted profile with lender...");
    await delay(700);
    const app: Application = { id: `app_${Date.now()}`, userId: user.id, amount, repaymentMonths: months, purpose, status: "pending", consentGranted: true, signal: result.signal, score: result.s, monthly: result.monthly, supported: result.supported, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    saveApps([app, ...apps]); setBusy(""); go("/applications");
  }
  function decide(app: Application, status: Status) {
    const note = status === "approved" ? "Strong verified contribution history and requested amount appears consistent with demonstrated capacity." : status === "needs_review" ? "Additional affordability information requested." : "Requested amount exceeds current affordability assessment.";
    saveApps(apps.map((a) => a.id === app.id ? { ...a, status, note, decidedBy: "Daniel Ofori", decidedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : a));
  }
  function resetDemo(loadId = "usr_ama_mensah") {
    localStorage.removeItem("credlink.apps"); localStorage.removeItem("credlink.onboarded"); localStorage.setItem("credlink.session", loadId);
    setApps([]); setOnboarded([]); setSessionId(loadId); setChecked(false); setSyncStep(0); go("/login");
  }

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <main className="app">
      <aside className="side"><Brand /><nav>{[["/dashboard", "Overview"], ["/history", "Financial History"], ["/score", "My Score"], ["/eligibility", "Loan Eligibility"], ["/applications", "Applications"], ["/profile", "Profile"]].map(([p, l]) => <button className={route === p ? "active" : ""} key={p} onClick={() => go(p)}>{l}</button>)}</nav><button className="ghost" onClick={() => go("/institution/login")}>Institution portal</button></aside>
      <section className="screen">{children}</section>
      <nav className="bottom">{[["/dashboard", "Home"], ["/history", "History"], ["/score", "Score"], ["/profile", "Profile"]].map(([p, l]) => <button className={route === p ? "active" : ""} key={p} onClick={() => go(p)}>{l}</button>)}</nav>
    </main>
  );

  if (route.startsWith("/institution")) return (
    <main className="institution">
      <aside className="side dark"><Brand /><nav><button onClick={() => go("/institution/dashboard")}>Dashboard</button><button onClick={() => go("/institution/applications")}>Applications</button></nav><button className="ghost" onClick={() => go("/login")}>Consumer app</button></aside>
      <section className="screen">
        {route === "/institution/login" && <Panel narrow><Brand /><h1>Institution portal</h1><p className="muted">For participating lenders reviewing customer-permitted CredLink profiles.</p><Input label="Email" value={inst.email} onChange={(v) => setInst({ ...inst, email: v })} /><Input label="Password" type="password" value={inst.password} onChange={(v) => setInst({ ...inst, password: v })} /><button className="primary" onClick={() => inst.email === "daniel.ofori@akwaabamfi.test" && inst.password === "CredLinkDemo26!" ? (setInst({ ...inst, ok: true }), go("/institution/dashboard")) : setError("Those institution credentials are not valid for this demo.")}>Sign in</button>{error && <p className="error">{error}</p>}</Panel>}
        {route !== "/institution/login" && !inst.ok && <Panel narrow><h1>Sign in required</h1><button className="primary" onClick={() => go("/institution/login")}>Open institution login</button></Panel>}
        {route === "/institution/dashboard" && inst.ok && <><Top title="Akwaaba Microfinance Ltd." sub="Daniel Ofori · Credit Officer" /><div className="grid three"><Metric title="New requests" value={apps.filter((a) => a.status === "pending").length} /><Metric title="Average signal" value={apps.length ? Math.round(apps.reduce((s, a) => s + a.score, 0) / apps.length) : "—"} /><Metric title="Customer permission" value="Active" /></div><ApplicationList apps={apps} go={go} /></>}
        {route === "/institution/applications" && inst.ok && <><Top title="Customer applications" sub="Permitted customer requests shared with your institution." /><ApplicationList apps={apps} go={go} /></>}
        {currentApp && inst.ok && <Review app={currentApp} u={appUser} decide={decide} />}
      </section>
    </main>
  );

  if (route === "/" || route === "/login") return <Auth><Panel narrow><Brand /><h1>Your financial history already exists.</h1><h2>Make it count.</h2><p className="muted">Turn your verified financial activity into a financial profile that participating lenders can understand.</p><Input label="Ghana Card number" value={ghanaCard} onChange={setGhanaCard} /><Input label="Mobile number" value={mobile} onChange={setMobile} inputMode="tel" /><button className="primary" onClick={login}>{busy || "Continue"}</button><button className="link" onClick={() => { setGhanaCard(users[0].ghanaCard); setMobile(phone(users[0].phone)); }}>Use Ama demo account</button><button className="link" onClick={() => go("/institution/login")}>Financial institution? Open institution portal</button>{error && <p className="error">{error}</p>}</Panel></Auth>;
  if (route === "/otp") return <Auth><Panel narrow><h1>Verify your number</h1><p className="muted">Enter the 6-digit code sent to {maskPhone(user.phone)}</p><div className="otp">{[0, 1, 2, 3, 4, 5].map((i) => <input key={i} inputMode="numeric" maxLength={1} value={otp[i] ?? ""} onChange={(e) => setOtp((otp.slice(0, i) + e.target.value.replace(/\D/g, "").slice(-1) + otp.slice(i + 1)).slice(0, 6))} />)}</div><p className="hint">Demo code: {user.otp}</p><button className="primary" onClick={verify}>{busy || "Verify"}</button>{error && <p className="error">{error}</p>}</Panel></Auth>;
  if (route === "/consent") return <Auth><Panel narrow><h1>Before we build your profile</h1><p className="muted">CredLink uses permitted financial activity from participating services to understand your financial behavior.</p>{["Connect participating financial records", "Build a CredLink financial profile", "Calculate financial behavior indicators", "Estimate loan eligibility", "Share selected financial information only when you choose"].map((x) => <p className="check" key={x}>✓ {x}</p>)}<label className="consent"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /> I understand and consent to CredLink processing this information for these purposes.</label><button className="primary" disabled={!consent} onClick={sync}>Continue</button></Panel></Auth>;
  if (route === "/sync") return <Auth><Panel narrow><h1>{syncStep >= 7 ? "Your financial profile is ready" : "Building your financial profile"}</h1>{["Identity verified", "Finding participating financial records", `Connecting ${user.source}`, "Checking contributions and payouts", "Verifying financial events", "Calculating financial behaviour", "Building your CredLink Score"].map((x, i) => <p className={syncStep > i ? "check" : "pending"} key={x}>{syncStep > i ? "✓" : "○"} {x}</p>)}{syncStep >= 7 && <><div className="ready">{user.historyMonths} months of activity found<br />{user.source}</div><button className="primary" onClick={() => go("/dashboard")}>View my profile</button></>}</Panel></Auth>;

  return <Shell>{route === "/dashboard" && <Dashboard u={user} apps={userApps} go={go} />}{route === "/history" && <History u={user} />}{route === "/score" && <Score u={user} />}{route === "/eligibility" && <Eligibility u={user} amount={amount} setAmount={setAmount} months={months} setMonths={setMonths} purpose={purpose} setPurpose={setPurpose} checked={checked} setChecked={setChecked} result={result} submit={submitApplication} busy={busy} loanConsent={loanConsent} setLoanConsent={setLoanConsent} />}{route === "/applications" && <Applications apps={userApps} go={go} />}{route === "/profile" && <Profile u={user} resetDemo={resetDemo} go={go} />}</Shell>;
}

function Brand() { return <div className="brand"><span>CL</span><b>{APP_CONFIG.name}</b><small>{APP_CONFIG.shortTagline}</small></div>; }
function Auth({ children }: { children: React.ReactNode }) { return <main className="auth"><div className="auth-art"><Brand /><h1>{APP_CONFIG.tagline}</h1><p>Informal financial activity becomes verified history, a transparent score, and consent-based lender sharing.</p></div>{children}</main>; }
function Panel({ children, narrow = false }: { children: React.ReactNode; narrow?: boolean }) { return <section className={narrow ? "panel narrow" : "panel"}>{children}</section>; }
function Input({ label, value, onChange, type = "text", inputMode }: { label: string; value: string; onChange: (v: string) => void; type?: string; inputMode?: "text" | "tel" | "numeric" }) { return <label className="field"><span>{label}</span><input value={value} type={type} inputMode={inputMode} onChange={(e) => onChange(e.target.value)} /></label>; }
function Top({ title, sub }: { title: string; sub: string }) { return <header className="top"><div><p className="eyebrow">CredLink demo</p><h1>{title}</h1><p>{sub}</p></div></header>; }
function Metric({ title, value }: { title: string; value: string | number }) { return <article className="metric"><span>{title}</span><b>{value}</b></article>; }
function Dashboard({ u, apps, go }: { u: User; apps: Application[]; go: (p: string) => void }) { const s = score(u); return <><Top title={`Good morning, ${u.firstName}`} sub="Your verified financial behavior profile is ready." /><section className="hero-card"><p>CredLink Score</p><strong>{s}</strong><span>{band(s)} · ↑ 4 points over the last 3 months</span><small>Financial Behavior Score. This does not guarantee loan approval.</small></section><div className="grid four"><Metric title="On-time" value={`${u.onTimeContributionRate}%`} /><Metric title="Verified history" value={`${u.historyMonths} months`} /><Metric title="Completed cycles" value={u.completedCycles} /><Metric title="Average contribution" value={fmt(u.averageMonthlyContribution)} /></div><Panel><h2>Need a loan?</h2><p className="muted">See what your financial profile may currently support.</p><button className="primary" onClick={() => go("/eligibility")}>Check loan options</button></Panel><Panel><h2>Your next opportunity</h2><p>Your financial profile is strong enough to explore moderate borrowing.</p><button onClick={() => go("/score")}>See recommendations</button></Panel>{apps[0] && <Panel><h2>Latest application</h2><Status status={apps[0].status} /><p>{fmt(apps[0].amount)} over {apps[0].repaymentMonths} months with Akwaaba Microfinance Ltd.</p></Panel>}<Panel><h2>Recent activity</h2>{events(u).slice(0, 4).map((e) => <Event e={e} key={e.ref} />)}</Panel></>; }
function History({ u }: { u: User }) { const [filter, setFilter] = useState("All"); const list = events(u).filter((e) => filter === "All" || e.type.includes(filter.toUpperCase().slice(0, -1))); return <><Top title="Financial history" sub={`${u.historyMonths} months of permitted activity from ${u.source}.`} /><div className="chips">{["All", "Contributions", "Payouts", "Cycles"].map((x) => <button className={filter === x ? "active" : ""} onClick={() => setFilter(x)} key={x}>{x}</button>)}</div><Panel>{list.map((e) => <details className="event-detail" key={e.ref}><summary><Event e={e} /></summary><div className="detail-grid"><Metric title="Source" value={e.source} /><Metric title="Reference" value={e.ref} /><Metric title="Verification status" value="Verified" /><Metric title="Integrity proof" value="0xa82cf17e9428...91f4" /></div><p className="hint">Tamper-evident record. This is a mock proof for the demo.</p></details>)}</Panel></>; }
function Event({ e }: { e: ReturnType<typeof events>[number] }) { return <article className="event"><span>{e.type.replaceAll("_", " ")}</span><b>{e.amount ? fmt(e.amount) : "Verified"}</b><small>{e.date} · {e.state}</small></article>; }
function Score({ u }: { u: User }) { const s = score(u); const weakest = [...factors].sort((a, b) => u.scoreComponents[a[0]] - u.scoreComponents[b[0]]).slice(0, 3); return <><Top title="CredLink Score" sub="Financial Behavior Score, 0-100. This is not a traditional credit score." /><section className="score-band"><strong>{s}</strong><span>{band(s)}</span></section><Panel><h2>Score factors</h2>{factors.map(([key, name, weight, copy]) => <article className="factor" key={key}><div><b>{name}</b><small>{u.scoreComponents[key]} / 100 · Weight: {weight}%</small><p>{copy}</p></div><progress value={u.scoreComponents[key]} max={100} /></article>)}</Panel><div className="grid two"><Panel><h2>What's helping you</h2>{["94% of contributions were made on time", `${u.completedCycles} completed susu cycles`, "Contribution amounts have remained stable", "Long participation history"].map((x) => <p className="check" key={x}>✓ {x}</p>)}</Panel><Panel><h2>What could improve</h2>{weakest.map((x) => <p key={x[0]}>Continue strengthening {x[1].toLowerCase()}.</p>)}</Panel></div><Panel><h2>Build a stronger profile</h2><div className="grid three">{["Make your next 3 contributions on time|Estimated +2-3 points", "Complete your active susu cycle|Estimated +2 points", "Maintain stable contributions for 3 more months|Estimated +1-2 points"].map((x) => { const [a, b] = x.split("|"); return <article className="advice" key={a}><b>{a}</b><span>{b}</span><small>Estimated impact</small></article>; })}</div></Panel></>; }
function Eligibility(props: { u: User; amount: number; setAmount: (n: number) => void; months: number; setMonths: (n: number) => void; purpose: string; setPurpose: (s: string) => void; checked: boolean; setChecked: (b: boolean) => void; result: ReturnType<typeof checkEligibility>; submit: () => void; busy: string; loanConsent: boolean; setLoanConsent: (b: boolean) => void }) { const r = props.result; return <><Top title="Explore your loan options" sub="See how different loan amounts and repayment periods compare with your financial profile." /><Panel><label className="field"><span>How much do you need?</span><input inputMode="numeric" value={props.amount} onChange={(e) => props.setAmount(Number(e.target.value.replace(/\D/g, "")) || 0)} /></label><div className="chips">{[1000, 2500, 5000, 10000, 20000].map((n) => <button onClick={() => props.setAmount(n)} key={n}>{fmt(n)}</button>)}</div><div className="chips">{[3, 6, 9, 12].map((n) => <button className={props.months === n ? "active" : ""} onClick={() => props.setMonths(n)} key={n}>{n} months</button>)}</div><div className="chips">{["Business", "Education", "Emergency", "Personal", "Other"].map((x) => <button className={props.purpose === x ? "active" : ""} onClick={() => props.setPurpose(x)} key={x}>{x}</button>)}</div><button className="primary" onClick={() => props.setChecked(true)}>Check my options</button></Panel>{props.checked && <><Panel><StatusText signal={r.signal} /><div className="grid three"><Metric title="Requested amount" value={fmt(props.amount)} /><Metric title="Illustrative repayment" value={`${fmt(r.monthly)}/month`} /><Metric title="Estimated supported borrowing" value={`Up to ${fmt(r.supported)}`} /><Metric title="CredLink Score" value={r.s} /><Metric title="Assessment confidence" value={r.confidence} /><Metric title="Repayment period" value={`${props.months} months`} /></div><p className="muted">Illustrative repayment before lender interest and fees.</p>{r.signal === "Unlikely at this amount" ? <div className="warning"><h3>This amount may be difficult to support</h3><p>Try {fmt(r.safer)} over {props.months} months or choose a longer repayment period.</p><button onClick={() => props.setAmount(r.safer)}>Use recommended amount</button><button onClick={() => props.setMonths(12)}>Try a longer term</button></div> : <p className="check">✓ Requested repayment appears consistent with demonstrated capacity.</p>}</Panel><Panel><h2>CredLink guidance</h2><p>Your profile currently supports this request reasonably well. A {props.months}-month repayment period places {props.months >= 12 ? "less" : "more"} monthly pressure on your demonstrated financial capacity.</p><div className="grid two"><Metric title="Comfortable range" value={`${fmt(r.comfortableLow)} - ${fmt(r.comfortableHigh)}`} /><Metric title="Upper estimated range" value={`Around ${fmt(r.supported)}`} /></div><p className="hint">These are CredLink estimates. Individual lenders may use additional information.</p></Panel><Panel><h2>Compare another option</h2><p>{fmt(props.amount)} over 6 months is about {fmt(props.amount / 6)}/month. Over 12 months it is about {fmt(props.amount / 12)}/month.</p><label className="consent"><input type="checkbox" checked={props.loanConsent} onChange={(e) => props.setLoanConsent(e.target.checked)} /> Share selected profile information with Akwaaba Microfinance Ltd.</label><button className="primary" disabled={!props.loanConsent} onClick={props.submit}>{props.busy || "Submit loan request"}</button></Panel></>}</>; }
function Applications({ apps, go }: { apps: Application[]; go: (p: string) => void }) { return <><Top title="Applications" sub="Track lender decisions made after you grant permission." />{apps.length === 0 ? <Panel><h2>No applications yet</h2><p className="muted">Check what your financial profile may support when you're ready.</p><button className="primary" onClick={() => go("/eligibility")}>Explore loan options</button></Panel> : apps.map((a) => <Panel key={a.id}><Status status={a.status} /><h2>{fmt(a.amount)} · {a.repaymentMonths} months</h2><p>{a.status === "approved" ? "Approved by Akwaaba Microfinance Ltd." : a.status === "needs_review" ? "Additional review required by Akwaaba Microfinance Ltd." : a.status === "declined" ? "Not approved by lender. Explore another amount from loan guidance." : "Shared with Akwaaba Microfinance Ltd. for review."}</p>{a.note && <p className="hint">{a.note}</p>}</Panel>)}</>; }
function Profile({ u, resetDemo, go }: { u: User; resetDemo: (id?: string) => void; go: (p: string) => void }) { return <><Top title="Profile" sub="Demo identity and permission controls." /><Panel><h2>{u.fullName}</h2><p>{maskCard(u.ghanaCard)} · {maskPhone(u.phone)}</p><p>{u.location}</p><button onClick={() => go("/applications")}>View applications</button></Panel><Panel><h2>Demo reset</h2><div className="chips">{users.map((x) => <button key={x.id} onClick={() => resetDemo(x.id)}>Load {x.firstName}</button>)}<button onClick={() => resetDemo()}>Reset complete demo</button></div></Panel></>; }
function ApplicationList({ apps, go }: { apps: Application[]; go: (p: string) => void }) { return <Panel><h2>{apps.length ? "Loan requests" : "No new loan requests"}</h2>{apps.length === 0 && <p className="muted">New permitted customer applications will appear here.</p>}{apps.map((a) => { const u = users.find((x) => x.id === a.userId)!; return <button className="app-row" key={a.id} onClick={() => go(`/institution/applications/${a.id}`)}><span><b>{u.fullName}</b><small>{fmt(a.amount)} · {a.repaymentMonths} months · Score {a.score}</small></span><Status status={a.status} /></button>; })}</Panel>; }
function Review({ app, u, decide }: { app: Application; u: User; decide: (a: Application, s: Status) => void }) { const r = checkEligibility(u, app.amount, app.repaymentMonths); return <><Top title={u.fullName} sub="Customer-permitted financial profile review." /><Panel><h2>Identity</h2><div className="grid four"><Metric title="Identity" value="Verified" /><Metric title="Ghana Card" value={maskCard(u.ghanaCard)} /><Metric title="Mobile" value={maskPhone(u.phone)} /><Metric title="Customer permission" value="Active" /></div></Panel><div className="grid two"><Panel><h2>CredLink assessment</h2><StatusText signal={app.signal} /><p>CredLink gives intelligence. The lender makes the decision.</p></Panel><Panel><h2>Akwaaba Microfinance decision</h2><Status status={app.status} /><p>{app.note ?? "No decision yet"}</p></Panel></div><Panel><h2>CredLink Score</h2><section className="score-band small"><strong>{score(u)}</strong><span>{band(score(u))}</span></section><p className="muted">Transparent financial behavior signal generated from permitted verified activity.</p></Panel><div className="grid four"><Metric title="Verified history" value={`${u.historyMonths} months`} /><Metric title="On-time rate" value={`${u.onTimeContributionRate}%`} /><Metric title="Completed cycles" value={u.completedCycles} /><Metric title="Average contribution" value={fmt(u.averageMonthlyContribution)} /><Metric title="Missed contribution" value={u.missedContributions} /><Metric title="Critical anomaly flags" value="0" /><Metric title="Requested" value={fmt(app.amount)} /><Metric title="Supported borrowing" value={`Up to ${fmt(r.supported)}`} /></div><Panel><h2>Score factors</h2>{factors.map(([key, name, weight]) => <p className="split" key={key}><span>{name}</span><b>{u.scoreComponents[key]} / 100 · {weight}%</b></p>)}</Panel><Panel><h2>Financial activity</h2><div className="grid four"><Metric title="On-time contributions" value={17} /><Metric title="Late/missed" value={u.missedContributions} /><Metric title="Completed cycles" value={u.completedCycles} /><Metric title="Verified payouts" value={3} /></div><details><summary>View permitted activity</summary>{events(u).map((e) => <Event e={e} key={e.ref} />)}</details></Panel><Panel><h2>Lender decision</h2><div className="chips"><button className="approve" onClick={() => decide(app, "approved")}>Approve</button><button onClick={() => decide(app, "needs_review")}>Needs review</button><button className="decline" onClick={() => decide(app, "declined")}>Decline</button></div></Panel></>; }
function Status({ status }: { status: Status }) { return <span className={`status ${status}`}>{status.replace("_", " ")}</span>; }
function StatusText({ signal }: { signal: string }) { return <div className={signal.startsWith("Likely") ? "signal good" : signal.startsWith("May") ? "signal mid" : "signal low"}><h2>{signal.startsWith("Likely") ? "Your profile looks strong for this request" : signal.startsWith("May") ? "This request may qualify after lender review" : "This amount may be difficult to support"}</h2><b>{signal}</b></div>; }
