"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Application,
  Status as ApplicationStatus,
  User,
  band,
  checkEligibility,
  clean,
  delay,
  events,
  factors,
  fmt,
  initials,
  maskCard,
  maskPhone,
  phone,
  score,
  users,
  estimatedSupportedAmount,
} from "@/lib/data";
import {
  BorrowingCapacity,
  ConnectedSourceCard,
  ConsumerProfileHero,
  InstitutionLoanAssessment,
  Metric,
  Panel,
  PermissionsCard,
  ProfileQuickActions,
  StatusText,
  VerifiedIdentityCard,
} from "@/app/components/shared";

const APP_CONFIG = {
  name: "CredLink",
  shortName: "CredLink",
  tagline: "Turning financial behaviour into financial opportunity.",
  shortTagline: "Your financial history, connected.",
};

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
  const [lookupCard, setLookupCard] = useState("GHA-000000001-1");
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupResult, setLookupResult] = useState<User | null>();

  const user = users.find((u) => u.id === sessionId) ?? users[0];
  const result = useMemo(() => checkEligibility(user, amount, months), [user, amount, months]);
  const userApps = apps.filter((a) => a.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const pageTitle = route === "/dashboard" ? "Home" : route === "/history" ? "History" : route === "/score" ? "Score" : route === "/eligibility" ? "Loan options" : route === "/applications" ? "Applications" : route === "/profile" ? "Profile" : "CredLink";
  const currentApp = apps.find((a) => route.includes(a.id));
  const appUser = users.find((u) => u.id === currentApp?.userId) ?? users[0];

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

  async function login() {
    setError("");
    setBusy("Verifying your identity...");
    await delay(650);
    const found = users.find((u) => clean(u.ghanaCard) === clean(ghanaCard) && clean(u.phone) === clean(mobile));
    if (!found) { setBusy(""); setError("We couldn't match those details. Check the Ghana Card number and mobile number."); return; }
    setSession(found.id);
    setBusy(`Identity verified — ${found.fullName}`);
    await delay(550);
    setBusy("");
    setOtp("");
    go("/otp");
  }

  async function verify() {
    setError("");
    setBusy("Checking code...");
    await delay(500);
    if (otp !== user.otp) { setBusy(""); setError("That code isn't correct. Please use the verification code shown below."); return; }
    setBusy("Number verified");
    await delay(450);
    setBusy("");
    go(onboarded.includes(user.id) ? "/dashboard" : "/consent");
  }

  async function sync() {
    go("/sync");
    for (let i = 0; i < 7; i++) {
      setSyncStep(i + 1);
      await delay(430);
    }
    const next = Array.from(new Set([...onboarded, user.id]));
    setOnboarded(next);
    localStorage.setItem("credlink.onboarded", JSON.stringify(next));
  }

  async function submitApplication() {
    if (!loanConsent) return;
    setBusy("Sharing permitted profile with lender...");
    await delay(700);
    const app: Application = {
      id: `app_${Date.now()}`,
      userId: user.id,
      amount,
      repaymentMonths: months,
      purpose,
      status: "pending",
      consentGranted: true,
      signal: result.signal,
      score: result.s,
      monthly: result.monthly,
      supported: result.supported,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveApps([app, ...apps]);
    setBusy("");
    go("/applications");
  }

  function decide(app: Application, status: ApplicationStatus) {
    const note = status === "approved" ? "Strong verified contribution history and requested amount appears consistent with demonstrated capacity." : status === "needs_review" ? "Additional affordability information requested." : "Requested amount exceeds current affordability assessment.";
    saveApps(apps.map((a) => a.id === app.id ? { ...a, status, note, decidedBy: "Daniel Ofori", decidedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : a));
  }

  function resetDemo(loadId = "usr_ama_mensah") {
    localStorage.removeItem("credlink.apps");
    localStorage.removeItem("credlink.onboarded");
    localStorage.setItem("credlink.session", loadId);
    setApps([]);
    setOnboarded([]);
    setSessionId(loadId);
    setChecked(false);
    setSyncStep(0);
    go("/login");
  }

  async function runLookup() {
    setLookupBusy(true);
    setLookupResult(undefined);
    await delay(620);
    setLookupResult(users.find((u) => clean(u.ghanaCard) === clean(lookupCard)) ?? null);
    setLookupBusy(false);
  }

  if (route.startsWith("/institution")) {
    const institutionCustomerId = route.startsWith("/institution/customer/") ? route.split("/")[3] : "";
    const foundInstitutionUser = users.find((u) => u.id === institutionCustomerId);
    return (
      <main className="institution">
        <aside className="side dark"><Brand /><nav>{[["/institution/dashboard", "Dashboard"], ["/institution/lookup", "Lookup"], ["/institution/customers", "Customers"], ["/institution/applications", "Applications"]].map(([p, l]) => <button className={route === p ? "active" : ""} onClick={() => go(p)} key={p}>{l}</button>)}</nav><button className="ghost" onClick={() => go("/login")}>Consumer app</button></aside>
        <section className="screen">
          {route === "/institution/login" && <Panel narrow><Brand /><h1>Institution portal</h1><p className="muted">For participating lenders reviewing customer-permitted CredLink profiles.</p><label className="field"><span>Email</span><input value={inst.email} onChange={(e) => setInst({ ...inst, email: e.target.value })} /></label><label className="field"><span>Password</span><input type="password" value={inst.password} onChange={(e) => setInst({ ...inst, password: e.target.value })} /></label><button className="primary" onClick={() => inst.email === "daniel.ofori@akwaabamfi.test" && inst.password === "CredLinkDemo26!" ? (setInst({ ...inst, ok: true }), go("/institution/dashboard")) : setError("Those institution credentials are not valid.")}>Sign in</button>{error && <p className="error">{error}</p>}</Panel>}
          {route !== "/institution/login" && !inst.ok && <Panel narrow><h1>Sign in required</h1><button className="primary" onClick={() => go("/institution/login")}>Open institution login</button></Panel>}
          {route === "/institution/dashboard" && inst.ok && <InstitutionDashboard apps={apps} go={go} />}
          {route === "/institution/lookup" && inst.ok && <InstitutionLookup lookupCard={lookupCard} setLookupCard={setLookupCard} lookupBusy={lookupBusy} lookupResult={lookupResult} runLookup={runLookup} go={go} reset={() => setLookupResult(undefined)} />}
          {route === "/institution/customers" && inst.ok && <InstitutionCustomers go={go} />}
          {route.startsWith("/institution/customer/") && inst.ok && <InstitutionCustomerProfile user={foundInstitutionUser} go={go} />}
          {route === "/institution/applications" && inst.ok && <><Top title="Customer applications" sub="Permitted customer requests shared with your institution." /><ApplicationList apps={apps} go={go} /></>}
          {currentApp && inst.ok && <Review app={currentApp} u={appUser} decide={decide} />}
        </section>
      </main>
    );
  }

  if (route === "/" || route === "/login") return <Auth><Panel narrow><Brand /><h1>Your financial history already exists.</h1><h2>Make it count.</h2><p className="muted">Turn your verified financial activity into a financial profile that participating lenders can understand.</p><label className="field"><span>Ghana Card number</span><input value={ghanaCard} onChange={(e) => setGhanaCard(e.target.value)} /></label><label className="field"><span>Mobile number</span><input value={mobile} inputMode="tel" onChange={(e) => setMobile(e.target.value)} /></label><button className="primary" onClick={login}>{busy || "Continue"}</button><button className="link" onClick={() => { setGhanaCard(users[0].ghanaCard); setMobile(phone(users[0].phone)); }}>Use sample account</button><button className="link" onClick={() => go("/institution/login")}>Financial institution? Open institution portal</button>{error && <p className="error">{error}</p>}</Panel></Auth>;
  if (route === "/otp") return <Auth><Panel narrow><AuthBack onBack={() => go("/login")} /><h1>Verify your number</h1><p className="muted">Enter the 6-digit code sent to {maskPhone(user.phone)}</p><div className="otp">{[0, 1, 2, 3, 4, 5].map((i) => <input key={i} inputMode="numeric" maxLength={1} aria-label={`Digit ${i + 1}`} value={otp[i] ?? ""} onChange={(e) => setOtp((otp.slice(0, i) + e.target.value.replace(/\D/g, "").slice(-1) + otp.slice(i + 1)).slice(0, 6))} />)}</div><p className="hint">Verification code: {user.otp}</p><button className="primary" onClick={verify}>{busy || "Verify"}</button>{error && <p className="error">{error}</p>}</Panel></Auth>;
  if (route === "/consent") return <Auth><Panel narrow><AuthBack onBack={() => go("/otp")} /><h1>Before we build your profile</h1><p className="muted">CredLink uses permitted financial activity from participating services to understand your financial behavior.</p>{["Connect participating financial records", "Build a CredLink financial profile", "Calculate financial behavior indicators", "Estimate loan eligibility", "Share selected financial information only when you choose"].map((x) => <p className="check" key={x}>✓ {x}</p>)}<label className="consent"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /> I understand and consent to CredLink processing this information for these purposes.</label><button className="primary" disabled={!consent} onClick={sync}>Continue</button></Panel></Auth>;
  if (route === "/sync") return <Auth><Panel narrow><AuthBack onBack={() => go("/consent")} /><h1>{syncStep >= 7 ? "Your financial profile is ready" : "Building your financial profile"}</h1>{["Identity verified", "Finding participating financial records", `Connecting ${user.source}`, "Checking contributions and payouts", "Verifying financial events", "Calculating financial behaviour", "Building your CredLink Score"].map((x, i) => <p className={syncStep > i ? "check" : "pending"} key={x}>{syncStep > i ? "✓" : "○"} {x}</p>)}{syncStep >= 7 && <><div className="ready">{user.historyMonths} months of activity found<br />{user.source}</div><button className="primary" onClick={() => go("/dashboard")}>View my profile</button></>}</Panel></Auth>;

  return <Shell route={route} go={go} pageTitle={pageTitle}>{route === "/dashboard" && <Dashboard u={user} apps={userApps} go={go} />}{route === "/history" && <History u={user} />}{route === "/score" && <Score u={user} />}{route === "/eligibility" && <Eligibility u={user} amount={amount} setAmount={setAmount} months={months} setMonths={setMonths} purpose={purpose} setPurpose={setPurpose} checked={checked} setChecked={setChecked} result={result} submit={submitApplication} busy={busy} loanConsent={loanConsent} setLoanConsent={setLoanConsent} />}{route === "/applications" && <Applications apps={userApps} go={go} />}{route === "/profile" && <Profile u={user} resetDemo={resetDemo} go={go} userApps={userApps} />}</Shell>;
}

function Brand() { return <div className="brand"><span>CL</span><b>{APP_CONFIG.name}</b><small>{APP_CONFIG.shortTagline}</small></div>; }
function Auth({ children }: { children: React.ReactNode }) { return <main className="auth"><div className="auth-art"><Brand /><h1>{APP_CONFIG.tagline}</h1><p>Informal financial activity becomes verified history, a transparent score, and consent-based lender sharing.</p></div>{children}</main>; }
function AuthBack({ onBack }: { onBack: () => void }) { return <button className="back-button" onClick={onBack} aria-label="Go back">‹ Back</button>; }
function MobileTop({ title, back, onBack }: { title: string; back: boolean; onBack: () => void }) { return <div className="mobile-top">{back ? <button onClick={onBack} aria-label="Go back">‹</button> : <span />}<b>{title}</b><button onClick={() => location.reload()} aria-label="Refresh">↻</button></div>; }
function Top({ title, sub }: { title: string; sub: string }) { return <header className="top"><div><h1>{title}</h1><p>{sub}</p></div></header>; }
function Shell({ route, go, pageTitle, children }: { route: string; go: (path: string) => void; pageTitle: string; children: React.ReactNode }) {
  return <main className="app"><aside className="side"><Brand /><nav>{[["/dashboard", "Overview"], ["/history", "Financial History"], ["/score", "My Score"], ["/eligibility", "Loan Eligibility"], ["/applications", "Applications"], ["/profile", "Profile"]].map(([p, l]) => <button className={route === p ? "active" : ""} key={p} onClick={() => go(p)}>{l}</button>)}</nav><button className="ghost" onClick={() => go("/institution/login")}>Institution portal</button></aside><section className="screen"><MobileTop title={pageTitle} back={route !== "/dashboard"} onBack={() => go("/dashboard")} />{children}</section><nav className="bottom">{[["/dashboard", "Home"], ["/history", "History"], ["/score", "Score"], ["/profile", "Profile"]].map(([p, l]) => <button className={route === p ? "active" : ""} key={p} onClick={() => go(p)}>{l}</button>)}</nav></main>;
}

function Dashboard({ u, apps, go }: { u: User; apps: Application[]; go: (p: string) => void }) {
  const s = score(u);
  return <><Top title={`Good morning, ${u.firstName}`} sub="Your verified financial behavior profile is ready." /><section className="hero-card"><p>CredLink Score</p><strong>{s}</strong><span>{band(s)} · ↑ 4 points over the last 3 months</span><small>Financial Behavior Score. This does not guarantee loan approval.</small></section><div className="grid four"><Metric title="On-time" value={`${u.onTimeContributionRate}%`} /><Metric title="Verified history" value={`${u.historyMonths} months`} /><Metric title="Completed cycles" value={u.completedCycles} /><Metric title="Average contribution" value={fmt(u.averageMonthlyContribution)} /></div><div className="grid two"><Panel><h2>What lenders can understand</h2>{["Identity and phone verification status", `${u.historyMonths} months of contribution history`, "CredLink Score and score factors", "Loan guidance aligned to observed behavior"].map((x) => <p className="check" key={x}>✓ {x}</p>)}</Panel><Panel><h2>Latest application status</h2>{apps.length ? <p><Status status={apps[0].status} /><br />{fmt(apps[0].amount)} over {apps[0].repaymentMonths} months</p> : <p className="muted">No applications yet. Check your options when ready.</p>}<button onClick={() => go("/eligibility")}>Explore loan options</button></Panel></div></>;
}

function InstitutionDashboard({ apps, go }: { apps: Application[]; go: (p: string) => void }) {
  const pending = apps.filter((a) => a.status === "pending");
  const likely = pending.filter((a) => a.signal.startsWith("Likely")).length;
  const needsReview = pending.filter((a) => a.signal.startsWith("May")).length;
  const low = pending.filter((a) => a.signal.startsWith("Unlikely")).length;
  return <><Top title="Akwaaba Microfinance Ltd." sub="Daniel Ofori · Credit Officer" /><Panel><h2>Institution overview</h2><label className="field"><span>Assess a customer</span><input readOnly value="GHA-000000001-1" aria-label="Example Ghana Card" /></label><button onClick={() => go("/institution/lookup")}>Open customer lookup</button></Panel><div className="grid four"><Metric title="New requests" value={pending.length} /><Metric title="Likely eligible" value={likely} /><Metric title="Needs review" value={needsReview} /><Metric title="Low eligibility signal" value={low} /></div><Panel><h2>Recent applications</h2>{apps.slice(0, 4).map((a) => { const u = users.find((x) => x.id === a.userId)!; return <button className="app-row" key={a.id} onClick={() => go(`/institution/applications/${a.id}`)}><span><b>{u.fullName}</b><small>{fmt(a.amount)} · {a.repaymentMonths} months</small></span><Status status={a.status} /></button>; })}{apps.length === 0 && <p className="muted">No applications yet.</p>}</Panel></>;
}

function InstitutionLookup(props: { lookupCard: string; setLookupCard: (v: string) => void; lookupBusy: boolean; lookupResult: User | null | undefined; runLookup: () => void; go: (p: string) => void; reset: () => void }) {
  return <><Top title="Customer lookup" sub="Find a customer by Ghana Card number." /><Panel><label className="field"><span>Ghana Card number</span><input value={props.lookupCard} onChange={(e) => props.setLookupCard(e.target.value)} placeholder="GHA-000000001-1" /></label><button className="primary" onClick={props.runLookup}>Find CredLink profile</button><button className="link" onClick={() => props.setLookupCard(users[0].ghanaCard)}>Use sample Ghana Card</button></Panel>{props.lookupBusy && <Panel><p>Searching CredLink...</p></Panel>}{props.lookupResult === null && <Panel><h2>No CredLink profile found</h2><button onClick={props.reset}>Try another Ghana Card</button></Panel>}{props.lookupResult && <Panel><div className="identity-head"><span className="avatar">{initials(props.lookupResult.fullName)}</span><div><h2>{props.lookupResult.fullName}</h2><p className="check">Identity verified</p></div></div><p>{maskCard(props.lookupResult.ghanaCard)} · {maskPhone(props.lookupResult.phone)}</p><p><b>CredLink Score {score(props.lookupResult)}</b> · {band(score(props.lookupResult))}</p><button onClick={() => props.go(`/institution/customer/${props.lookupResult?.id}`)}>Open financial profile</button></Panel>}</>;
}

function InstitutionCustomers({ go }: { go: (path: string) => void }) {
  const visible = users.filter((u) => u.institutionAccess !== false);
  return <><Top title="Customers" sub="Customer profiles your institution can view." /><div className="grid two">{visible.map((u) => <Panel key={u.id}><h2>{u.fullName}</h2><p className="muted">Score {score(u)} · {u.historyMonths} months verified</p><button onClick={() => go(`/institution/customer/${u.id}`)}>View profile</button></Panel>)}</div></>;
}

function InstitutionCustomerProfile({ user, go }: { user?: User; go: (path: string) => void }) {
  const [amount, setAmount] = useState(5000);
  const [months, setMonths] = useState(12);
  const [assessed, setAssessed] = useState(false);
  if (!user) return <Panel><h2>Customer not found</h2><button onClick={() => go("/institution/lookup")}>Back to lookup</button></Panel>;
  if (user.institutionAccess === false) return <Panel><h2>Customer profile located</h2><p className="muted">Permission required</p></Panel>;

  const assessment = checkEligibility(user, amount, months);
  const scoreValue = score(user);
  const terms = [
    { months: 3, estimate: estimatedSupportedAmount(user, 3), copy: "Higher monthly pressure" },
    { months: 6, estimate: estimatedSupportedAmount(user, 6), copy: "Moderate term" },
    { months: 9, estimate: estimatedSupportedAmount(user, 9), copy: "Balanced monthly pressure" },
    { months: 12, estimate: estimatedSupportedAmount(user, 12), copy: "Lower monthly pressure" },
  ];

  return <><Top title={user.fullName} sub="Lender-facing customer financial profile." /><Panel><h2>Identity summary</h2><div className="grid four"><Metric title="Identity" value="Verified" /><Metric title="Ghana Card" value={maskCard(user.ghanaCard)} /><Metric title="Mobile" value={maskPhone(user.phone)} /><Metric title="Location" value={user.location} /></div></Panel><Panel><h2>Financial snapshot</h2><div className="grid four"><Metric title="CredLink score" value={`${scoreValue} · ${band(scoreValue)}`} /><Metric title="Verified history" value={`${user.historyMonths} months`} /><Metric title="On-time" value={`${user.onTimeContributionRate}%`} /><Metric title="Completed cycles" value={user.completedCycles} /><Metric title="Average contribution" value={fmt(user.averageMonthlyContribution)} /><Metric title="Connected source" value={user.source} /></div></Panel><BorrowingCapacity terms={terms} /><Panel><h2>CredLink guidance</h2><div className="grid two"><Metric title="Comfortable borrowing range" value={`${fmt(assessment.comfortableLow)} - ${fmt(assessment.comfortableHigh)}`} /><Metric title="Upper estimated range" value={fmt(estimatedSupportedAmount(user, 12))} /></div><p className="hint">These estimates are illustrative and lender decisions may include additional checks.</p></Panel><InstitutionLoanAssessment amount={amount} setAmount={setAmount} months={months} setMonths={setMonths} assessed={assessed} onAssess={() => setAssessed(true)} signal={assessment.signal} monthly={assessment.monthly} supported={assessment.supported} scoreValue={assessment.s} confidence={assessment.confidence} strengths={[`${user.onTimeContributionRate}% on-time contribution rate`, `${user.historyMonths} months of verified history`, `${user.completedCycles} completed cycles`]} concerns={[user.missedContributions > 2 ? `${user.missedContributions} missed contributions observed` : "Requested amount still requires lender affordability checks", amount > assessment.supported ? "Requested amount is above current estimated support" : "Loan terms should remain aligned with monthly capacity"]} saferAmount={assessment.safer} onUseSafer={() => setAmount(assessment.safer)} onUseLonger={() => setMonths(12)} /></>;
}

function History({ u }: { u: User }) {
  const [filter, setFilter] = useState("All");
  const list = events(u).filter((e) => filter === "All" || e.type.includes(filter.toUpperCase().slice(0, -1)));
  return <><Top title="Financial history" sub={`${u.historyMonths} months of permitted activity from ${u.source}.`} /><div className="chips">{["All", "Contributions", "Payouts", "Cycles"].map((x) => <button className={filter === x ? "active" : ""} onClick={() => setFilter(x)} key={x}>{x}</button>)}</div><Panel>{list.map((e) => <details className="event-detail" key={e.ref}><summary><Event e={e} /></summary><div className="detail-grid"><Metric title="Source" value={e.source} /><Metric title="Reference" value={e.ref} /><Metric title="Verification status" value="Verified" /><Metric title="Integrity proof" value="0xa82cf17e9428...91f4" /></div><p className="hint">Tamper-evident record verified on-chain.</p></details>)}</Panel></>;
}

function Event({ e }: { e: ReturnType<typeof events>[number] }) { return <article className="event"><span>{e.type.replaceAll("_", " ")}</span><b>{e.amount ? fmt(e.amount) : "Verified"}</b><small>{e.date} · {e.state}</small></article>; }

function Score({ u }: { u: User }) {
  const s = score(u);
  const weakest = [...factors].sort((a, b) => u.scoreComponents[a[0]] - u.scoreComponents[b[0]]).slice(0, 3);
  return <><Top title="CredLink Score" sub="Financial Behavior Score, 0-100. This is not a traditional credit score." /><section className="score-band"><strong>{s}</strong><span>{band(s)}</span></section><Panel><h2>Score factors</h2>{factors.map(([key, name, weight, copy]) => <article className="factor" key={key}><div><b>{name}</b><small>{u.scoreComponents[key]} / 100 · Weight: {weight}%</small><p>{copy}</p></div><progress value={u.scoreComponents[key]} max={100} /></article>)}</Panel><div className="grid two"><Panel><h2>What&apos;s helping you</h2>{[`${u.onTimeContributionRate}% of contributions were made on time`, `${u.completedCycles} completed susu cycles`, "Contribution amounts have remained stable", "Long participation history"].map((x) => <p className="check" key={x}>✓ {x}</p>)}</Panel><Panel><h2>What could improve</h2>{weakest.map((x) => <p key={x[0]}>Continue strengthening {x[1].toLowerCase()}.</p>)}</Panel></div><Panel><h2>Build a stronger profile</h2><div className="grid three">{["Make your next 3 contributions on time|Estimated +2-3 points", "Complete your active susu cycle|Estimated +2 points", "Maintain stable contributions for 3 more months|Estimated +1-2 points"].map((x) => { const [a, b] = x.split("|"); return <article className="advice" key={a}><b>{a}</b><span>{b}</span><small>Estimated impact</small></article>; })}</div></Panel></>;
}

function Eligibility(props: { u: User; amount: number; setAmount: (n: number) => void; months: number; setMonths: (n: number) => void; purpose: string; setPurpose: (s: string) => void; checked: boolean; setChecked: (b: boolean) => void; result: ReturnType<typeof checkEligibility>; submit: () => void; busy: string; loanConsent: boolean; setLoanConsent: (b: boolean) => void }) {
  const r = props.result;
  return <><Top title="Explore your loan options" sub="See how different loan amounts and repayment periods compare with your financial profile." /><Panel><label className="field"><span>How much do you need?</span><input inputMode="numeric" value={props.amount} onChange={(e) => props.setAmount(Number(e.target.value.replace(/\D/g, "")) || 0)} /></label><div className="chips">{[1000, 2500, 5000, 10000, 20000].map((n) => <button onClick={() => props.setAmount(n)} key={n}>{fmt(n)}</button>)}</div><div className="chips">{[3, 6, 9, 12].map((n) => <button className={props.months === n ? "active" : ""} onClick={() => props.setMonths(n)} key={n}>{n} months</button>)}</div><div className="chips">{["Business", "Education", "Emergency", "Personal", "Other"].map((x) => <button className={props.purpose === x ? "active" : ""} onClick={() => props.setPurpose(x)} key={x}>{x}</button>)}</div><button className="primary" onClick={() => props.setChecked(true)}>Check my options</button></Panel>{props.checked && <><Panel><StatusText signal={r.signal} /><div className="grid three"><Metric title="Requested amount" value={fmt(props.amount)} /><Metric title="Illustrative repayment" value={`${fmt(r.monthly)}/month`} /><Metric title="Estimated supported borrowing" value={`Up to ${fmt(r.supported)}`} /><Metric title="CredLink Score" value={r.s} /><Metric title="Assessment confidence" value={r.confidence} /><Metric title="Repayment period" value={`${props.months} months`} /></div><p className="muted">Illustrative repayment before lender interest and fees.</p>{r.signal === "Unlikely at this amount" ? <div className="warning"><h3>This amount may be difficult to support</h3><p>Try {fmt(r.safer)} over {props.months} months or choose a longer repayment period.</p><button onClick={() => props.setAmount(r.safer)}>Use recommended amount</button><button onClick={() => props.setMonths(12)}>Try a longer term</button></div> : <p className="check">✓ Requested repayment appears consistent with demonstrated capacity.</p>}</Panel><Panel><h2>CredLink guidance</h2><p>Your profile currently supports this request reasonably well. A {props.months}-month repayment period places {props.months >= 12 ? "less" : "more"} monthly pressure on your demonstrated financial capacity.</p><div className="grid two"><Metric title="Comfortable range" value={`${fmt(r.comfortableLow)} - ${fmt(r.comfortableHigh)}`} /><Metric title="Upper estimated range" value={`Around ${fmt(r.supported)}`} /></div><p className="hint">These are CredLink estimates. Individual lenders may use additional information.</p></Panel><Panel><h2>Compare another option</h2><p>{fmt(props.amount)} over 6 months is about {fmt(props.amount / 6)}/month. Over 12 months it is about {fmt(props.amount / 12)}/month.</p><label className="consent"><input type="checkbox" checked={props.loanConsent} onChange={(e) => props.setLoanConsent(e.target.checked)} /> Share selected profile information with Akwaaba Microfinance Ltd.</label><button className="primary" disabled={!props.loanConsent} onClick={props.submit}>{props.busy || "Submit loan request"}</button></Panel></>}</>;
}

function Applications({ apps, go }: { apps: Application[]; go: (p: string) => void }) {
  return <><Top title="Applications" sub="Track lender decisions made after you grant permission." />{apps.length === 0 ? <Panel><h2>No applications yet</h2><p className="muted">Check what your financial profile may support when you&apos;re ready.</p><button className="primary" onClick={() => go("/eligibility")}>Explore loan options</button></Panel> : apps.map((a) => <Panel key={a.id}><Status status={a.status} /><h2>{fmt(a.amount)} · {a.repaymentMonths} months</h2><p>{a.status === "approved" ? "Approved by Akwaaba Microfinance Ltd." : a.status === "needs_review" ? "Additional review required by Akwaaba Microfinance Ltd." : a.status === "declined" ? "Not approved by lender. Explore another amount from loan guidance." : "Shared with Akwaaba Microfinance Ltd. for review."}</p>{a.note && <p className="hint">{a.note}</p>}</Panel>)}</>;
}

function Profile({ u, resetDemo, go, userApps }: { u: User; resetDemo: (id?: string) => void; go: (p: string) => void; userApps: Application[] }) {
  const activeInstitutions = userApps.length ? ["Akwaaba Microfinance Ltd."] : [];
  return <><Top title="Profile" sub="Your verified identity and financial profile details." /><ConsumerProfileHero u={u} /><VerifiedIdentityCard u={u} /><Panel><h2>Your financial footprint</h2><div className="grid four"><Metric title="Verified history" value={`${u.historyMonths} months`} /><Metric title="Completed cycles" value={u.completedCycles} /><Metric title="On-time" value={`${u.onTimeContributionRate}%`} /><Metric title="Average contribution" value={fmt(u.averageMonthlyContribution)} /></div></Panel><ConnectedSourceCard u={u} /><PermissionsCard activeInstitutions={activeInstitutions} /><ProfileQuickActions go={go} /><details className="panel"><summary><h2>Switch profile</h2></summary><p className="muted">View the experience from a different user profile.</p><div className="chips">{users.map((x) => <button key={x.id} onClick={() => resetDemo(x.id)}>{x.firstName}</button>)}<button onClick={() => resetDemo()}>Reset</button></div></details></>;
}

function ApplicationList({ apps, go }: { apps: Application[]; go: (p: string) => void }) {
  return <Panel><h2>{apps.length ? "Loan requests" : "No new loan requests"}</h2>{apps.length === 0 && <p className="muted">New permitted customer applications will appear here.</p>}{apps.map((a) => { const u = users.find((x) => x.id === a.userId)!; return <button className="app-row" key={a.id} onClick={() => go(`/institution/applications/${a.id}`)}><span><b>{u.fullName}</b><small>{fmt(a.amount)} · {a.repaymentMonths} months · Score {a.score}</small></span><Status status={a.status} /></button>; })}</Panel>;
}

function Review({ app, u, decide }: { app: Application; u: User; decide: (a: Application, s: ApplicationStatus) => void }) {
  const r = checkEligibility(u, app.amount, app.repaymentMonths);
  return <><Top title={u.fullName} sub="Customer-permitted financial profile review." /><Panel><h2>Identity</h2><div className="grid four"><Metric title="Identity" value="Verified" /><Metric title="Ghana Card" value={maskCard(u.ghanaCard)} /><Metric title="Mobile" value={maskPhone(u.phone)} /><Metric title="Customer permission" value="Active" /></div></Panel><div className="grid two"><Panel><h2>CredLink assessment</h2><StatusText signal={app.signal} /><p>CredLink gives intelligence. The lender makes the decision.</p></Panel><Panel><h2>Akwaaba Microfinance decision</h2><Status status={app.status} /><p>{app.note ?? "No decision yet"}</p></Panel></div><Panel><h2>CredLink Score</h2><section className="score-band small"><strong>{score(u)}</strong><span>{band(score(u))}</span></section><p className="muted">Transparent financial behavior signal generated from permitted verified activity.</p></Panel><div className="grid four"><Metric title="Verified history" value={`${u.historyMonths} months`} /><Metric title="On-time rate" value={`${u.onTimeContributionRate}%`} /><Metric title="Completed cycles" value={u.completedCycles} /><Metric title="Average contribution" value={fmt(u.averageMonthlyContribution)} /><Metric title="Missed contribution" value={u.missedContributions} /><Metric title="Critical anomaly flags" value="0" /><Metric title="Requested" value={fmt(app.amount)} /><Metric title="Supported borrowing" value={`Up to ${fmt(r.supported)}`} /></div><Panel><h2>Score factors</h2>{factors.map(([key, name, weight]) => <p className="split" key={key}><span>{name}</span><b>{u.scoreComponents[key]} / 100 · {weight}%</b></p>)}</Panel><Panel><h2>Financial activity</h2><div className="grid four"><Metric title="On-time contributions" value={17} /><Metric title="Late/missed" value={u.missedContributions} /><Metric title="Completed cycles" value={u.completedCycles} /><Metric title="Verified payouts" value={3} /></div><details><summary>View permitted activity</summary>{events(u).map((e) => <Event e={e} key={e.ref} />)}</details></Panel><Panel><h2>Lender decision</h2><div className="chips"><button className="approve" onClick={() => decide(app, "approved")}>Approve</button><button onClick={() => decide(app, "needs_review")}>Needs review</button><button className="decline" onClick={() => decide(app, "declined")}>Decline</button></div></Panel></>;
}

function Status({ status }: { status: ApplicationStatus }) { return <span className={`status ${status}`}>{status.replace("_", " ")}</span>; }
