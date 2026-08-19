"use client";

import { useMemo, useState } from "react";
import {
  Application,
  User,
  band,
  checkEligibility,
  estimatedSupportedAmount,
  events,
  factors,
  fmt,
  initials,
  maskCard,
  maskPhone,
  onTimeContributionCount,
  score,
  users,
} from "@/lib/data";
import { Metric, Panel, StatusText } from "@/app/components/shared";

type LookupProps = {
  lookupCard: string;
  setLookupCard: (v: string) => void;
  lookupBusy: boolean;
  lookupResult: User | null | undefined;
  runLookup: () => void;
  go: (p: string) => void;
  reset: () => void;
};

type ProfileProps = {
  user?: User;
  go: (path: string) => void;
};

type QueueProps = {
  apps: Application[];
  go: (p: string) => void;
};

function formatSubmitted(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function signalTone(signal: string) {
  if (signal.startsWith("Likely")) return "good";
  if (signal.startsWith("May")) return "mid";
  return "low";
}

function SignalBadge({ signal }: { signal: string }) {
  if (signal.startsWith("May")) {
    return (
      <div className="request-signal-wrap">
        <b className="queue-signal mid">May qualify</b>
        <small className="hint">Lender review recommended</small>
      </div>
    );
  }

  return (
    <div className="request-signal-wrap">
      <b className={`queue-signal ${signalTone(signal)}`}>{signal}</b>
    </div>
  );
}

export function InstitutionLookupView(props: LookupProps) {
  const scoreValue = props.lookupResult ? score(props.lookupResult) : 0;

  return (
    <>
      <header className="top institution-top">
        <div>
          <h1>Customer Lookup</h1>
          <p>Search for a permitted CredLink profile using a Ghana Card number.</p>
        </div>
      </header>

      <Panel className="institution-lookup-panel">
        <div className="lookup-inline-field">
          <label className="field">
            <span>Ghana Card number</span>
            <input
              value={props.lookupCard}
              onChange={(e) => props.setLookupCard(e.target.value)}
              placeholder="GHA-000000001-1"
            />
          </label>
          <button className="primary" onClick={props.runLookup}>
            Find profile
          </button>
        </div>
        <button className="link lookup-demo-link" onClick={() => props.setLookupCard(users[0].ghanaCard)}>
          Demo: use Ama&apos;s profile
        </button>
        <p className="hint">Ghana Card identifies the customer. Profile access still depends on customer permission.</p>
      </Panel>

      {props.lookupBusy && (
        <Panel>
          <p className="muted">Searching CredLink profile...</p>
        </Panel>
      )}

      {props.lookupResult === null && (
        <Panel>
          <h2>No CredLink profile found</h2>
          <p className="muted">We couldn&apos;t find a demo profile associated with that Ghana Card number.</p>
          <button onClick={props.reset}>Try another Ghana Card</button>
        </Panel>
      )}

      {props.lookupResult && (
        <Panel className="lookup-result-panel">
          <div className="identity-head compact">
            <span className="avatar">{initials(props.lookupResult.fullName)}</span>
            <div>
              <h2>{props.lookupResult.fullName}</h2>
              <p className="check">Identity verified</p>
              <p className="check">Customer permission active</p>
            </div>
          </div>

          <div className="lookup-result-meta">
            <p>{maskCard(props.lookupResult.ghanaCard)}</p>
            <p>{maskPhone(props.lookupResult.phone)}</p>
          </div>

          <div className="lookup-score-row">
            <span>CredLink Score</span>
            <b>
              {scoreValue} · {band(scoreValue)}
            </b>
          </div>

          <button onClick={() => props.go(`/institution/customer/${props.lookupResult!.id}`)}>Open profile →</button>
        </Panel>
      )}
    </>
  );
}

export function InstitutionApplicationListView({ apps, go }: QueueProps) {
  const pending = apps.filter((a) => a.status === "pending");
  const needsReview = pending.filter((a) => a.signal.startsWith("May")).length;
  const requested = apps.reduce((total, app) => total + app.amount, 0);
  const sortedApps = useMemo(
    () => [...apps].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [apps],
  );

  return (
    <>
      <div className="queue-summary polished">
        <Metric title="New requests" value={pending.length} />
        <Metric title="Needs review" value={needsReview} />
        <Metric title="Total amount requested" value={fmt(requested)} />
      </div>

      <Panel className="application-queue polished">
        <div className="queue-heading">
          <div>
            <h2>Loan requests</h2>
            <p className="muted">Review customer-permitted applications before making a lender decision.</p>
          </div>
          <span className="queue-count">{sortedApps.length} total</span>
        </div>

        {sortedApps.length === 0 && <p className="muted">New permitted customer applications will appear here.</p>}

        {sortedApps.length > 0 && (
          <>
            <div className="queue-table-head" role="presentation">
              <span>Applicant</span>
              <span>Request</span>
              <span>CredLink profile</span>
              <span>CredLink signal</span>
              <span>Status</span>
              <span>Submitted</span>
              <span>Action</span>
            </div>

            {sortedApps.map((a) => {
              const u = users.find((x) => x.id === a.userId)!;
              return (
                <article className="application-card polished" key={a.id}>
                  <div className="application-person">
                    <span className="avatar">{initials(u.fullName)}</span>
                    <div>
                      <h3>{u.fullName}</h3>
                      <p>{u.source}</p>
                    </div>
                  </div>

                  <div className="application-request">
                    <strong>{fmt(a.amount)}</strong>
                    <span>
                      {a.repaymentMonths} months · {a.purpose}
                    </span>
                  </div>

                  <div className="application-score">
                    <span>CredLink profile</span>
                    <b>
                      {a.score} · {band(a.score)}
                    </b>
                  </div>

                  <div className="application-signal">
                    <span>CredLink signal</span>
                    <SignalBadge signal={a.signal} />
                  </div>

                  <div className="application-status">
                    <span>Status</span>
                    <span className="status pending">Pending</span>
                  </div>

                  <div className="application-date">
                    <span>Submitted</span>
                    <b>{formatSubmitted(a.createdAt)}</b>
                  </div>

                  <div className="application-action">
                    <button className="queue-action" onClick={() => go(`/institution/applications/${a.id}`)}>
                      Review →
                    </button>
                  </div>
                </article>
              );
            })}
          </>
        )}
      </Panel>
    </>
  );
}

function IdentityStrip({ user }: { user: User }) {
  return (
    <Panel className="identity-strip">
      <h2>Verified identity</h2>
      <div className="identity-list">
        <p>
          <span>Identity</span>
          <b>Verified</b>
        </p>
        <p>
          <span>Ghana Card</span>
          <b>{maskCard(user.ghanaCard)}</b>
        </p>
        <p>
          <span>Mobile</span>
          <b>{maskPhone(user.phone)}</b>
        </p>
        <p>
          <span>Location</span>
          <b>{user.location}</b>
        </p>
      </div>
    </Panel>
  );
}

function SourceStrip({ user }: { user: User }) {
  return (
    <Panel className="source-strip">
      <p className="eyebrow">Verified financial source</p>
      <h2>{user.source}</h2>
      <p className="muted">{user.historyMonths} months of permitted activity</p>
      <p className="check">✓ Verified partner data</p>
    </Panel>
  );
}

function CapacityTerms({ user }: { user: User }) {
  const terms = [
    { months: 3, estimate: estimatedSupportedAmount(user, 3), copy: "Higher monthly pressure" },
    { months: 6, estimate: estimatedSupportedAmount(user, 6), copy: "Moderate term" },
    { months: 9, estimate: estimatedSupportedAmount(user, 9), copy: "Balanced monthly pressure" },
    { months: 12, estimate: estimatedSupportedAmount(user, 12), copy: "Lower monthly pressure" },
  ];

  return (
    <Panel>
      <h2>Estimated borrowing capacity</h2>
      <div className="capacity-grid">
        {terms.map((term) => (
          <article className="capacity-card" key={term.months}>
            <span>{term.months} months</span>
            <b>Up to {fmt(term.estimate)}</b>
            <small>{term.copy}</small>
          </article>
        ))}
      </div>
    </Panel>
  );
}

export function InstitutionCustomerProfileView({ user, go }: ProfileProps) {
  const [amount, setAmount] = useState(5000);
  const [months, setMonths] = useState(12);
  const [assessed, setAssessed] = useState(false);

  if (!user) {
    return (
      <Panel>
        <h2>Customer not found</h2>
        <button onClick={() => go("/institution/lookup")}>Back to lookup</button>
      </Panel>
    );
  }

  if (user.institutionAccess === false) {
    return (
      <Panel>
        <h2>Customer profile located</h2>
        <p className="muted">Permission required</p>
      </Panel>
    );
  }

  const scoreValue = score(user);
  const assessment = checkEligibility(user, amount, months);

  return (
    <div className="institution-profile-page">
      <button className="back-button" onClick={() => go("/institution/lookup")}>← Customer Lookup</button>

      <Panel className="institution-profile-header">
        <div className="profile-header-main">
          <div className="identity-head compact">
            <span className="avatar">{initials(user.fullName)}</span>
            <div>
              <h1>{user.fullName}</h1>
              <p className="check">Identity verified</p>
              <p className="check">✓ Customer permission active</p>
              <p className="muted profile-ids">
                {maskCard(user.ghanaCard)} · {maskPhone(user.phone)}
              </p>
              <p className="muted">{user.location}</p>
            </div>
          </div>
          <button className="primary profile-assess-cta" onClick={() => {
            const section = document.getElementById("assess-a-loan");
            if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
          }}>
            Assess a loan
          </button>
        </div>

        <section className="score-band institution-score-band">
          <span>CredLink Score</span>
          <strong>{scoreValue}</strong>
          <b>{band(scoreValue)}</b>
        </section>
      </Panel>

      <Panel>
        <h2>Financial snapshot</h2>
        <div className="grid four">
          <Metric title="CredLink Score" value={`${scoreValue} · ${band(scoreValue)}`} />
          <Metric title="Verified history" value={`${user.historyMonths} months`} />
          <Metric title="On-time" value={`${user.onTimeContributionRate}%`} />
          <Metric title="Completed cycles" value={user.completedCycles} />
        </div>
        <div className="grid two compact-gap">
          <Metric title="Average contribution" value={fmt(user.averageMonthlyContribution)} />
          <Metric title="Missed contributions" value={user.missedContributions} />
        </div>
      </Panel>

      <IdentityStrip user={user} />
      <SourceStrip user={user} />
      <CapacityTerms user={user} />

      <Panel>
        <h2>CredLink guidance</h2>
        <div className="grid two compact-gap">
          <Metric
            title="Comfortable borrowing range"
            value={`${fmt(assessment.comfortableLow)} - ${fmt(assessment.comfortableHigh)}`}
          />
          <Metric title="Upper estimated range" value={`Around ${fmt(estimatedSupportedAmount(user, 12))}`} />
        </div>
        <p className="hint">
          Based on the financial commitments currently visible in this customer&apos;s verified profile.
        </p>
      </Panel>

      <Panel className="institution-assessment">
        <h2>Assess a loan</h2>

        <div className="assessment-form-row">
          <label className="field">
            <span>Loan amount</span>
            <input
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value.replace(/\D/g, "")) || 0)}
            />
          </label>

          <label className="field">
            <span>Repayment period</span>
            <select value={months} onChange={(e) => setMonths(Number(e.target.value))}>
              {[3, 6, 9, 12].map((n) => (
                <option key={n} value={n}>
                  {n} months
                </option>
              ))}
            </select>
          </label>
        </div>

        <button className="primary" onClick={() => setAssessed(true)}>
          Assess this loan
        </button>

        {assessed && (
          <div className="assessment-result">
            <StatusText signal={amount > assessment.supported ? "Above estimated capacity" : assessment.signal} />
            <div className="grid three">
              <Metric title="Requested" value={fmt(amount)} />
              <Metric title="Illustrative repayment" value={`${fmt(assessment.monthly)}/month`} />
              <Metric title="Estimated supported amount" value={`Up to ${fmt(assessment.supported)}`} />
              <Metric title="CredLink Score" value={assessment.s} />
              <Metric title="Confidence" value={assessment.confidence} />
              <Metric title="Repayment period" value={`${months} months`} />
            </div>

            <Panel className="assessment-why">
              <h3>Why?</h3>
              {[
                `✓ ${user.onTimeContributionRate}% on-time contributions`,
                `✓ ${user.historyMonths} months verified history`,
                `✓ ${user.completedCycles} completed cycles`,
                "✓ Stable contribution behaviour",
                "✓ No critical anomaly flags",
                amount <= assessment.supported
                  ? "✓ Request is within estimated supported range"
                  : "Request is above estimated supported range",
              ].map((item) => (
                <p key={item} className={item.startsWith("✓") ? "check" : "muted"}>
                  {item}
                </p>
              ))}
            </Panel>
          </div>
        )}
      </Panel>

      <details className="panel score-breakdown">
        <summary>
          <h2>Score breakdown</h2>
        </summary>
        {factors.map(([key, name, weight, copy]) => (
          <article className="factor" key={key}>
            <div>
              <b>{name}</b>
              <small>
                {user.scoreComponents[key]} / 100 · Weight: {weight}%
              </small>
              <p>{copy}</p>
            </div>
            <progress value={user.scoreComponents[key]} max={100} />
          </article>
        ))}
      </details>

      <Panel>
        <h2>Financial activity summary</h2>
        <div className="grid four">
          <Metric title="On-time contributions" value={onTimeContributionCount(user)} />
          <Metric title="Late/missed" value={user.missedContributions} />
          <Metric title="Completed cycles" value={user.completedCycles} />
          <Metric title="Verified payouts" value={user.completedCycles} />
        </div>
      </Panel>

      <details className="panel">
        <summary>
          <h2>Permitted activity details</h2>
        </summary>
        {events(user).map((event) => (
          <article className="event" key={event.ref}>
            <span>{event.type.replaceAll("_", " ")}</span>
            <b>{event.amount ? fmt(event.amount) : "Verified"}</b>
            <small>
              {event.date} · {event.state}
            </small>
          </article>
        ))}
      </details>
    </div>
  );
}
