"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type DemoState = "idle" | "searching" | "results" | "authorized" | "ready";

const agents = [
  { name: "Agent A", area: "Osu Oxford Street", distance: "350 m", availability: "High availability", reliability: 96, position: "pin-a" },
  { name: "Agent B", area: "Independence Avenue", distance: "620 m", availability: "Likely sufficient", reliability: 91, position: "pin-b" },
  { name: "Agent C", area: "Ringway Estates", distance: "1.1 km", availability: "Currently unavailable", reliability: 94, position: "pin-c" },
];

const steps = [
  ["01", "Identify", "Tap using Near-Field Communication (NFC), scan a Quick Response (QR) code, or enter a TapWire identifier."],
  ["02", "Verify", "See the recipient’s verified identity before anything moves."],
  ["03", "Confirm", "Review the amount and the person or business you are paying."],
  ["04", "Authorize", "Approve a short-lived, secure request for this one action."],
  ["05", "Settle", "Your existing financial provider performs the actual transfer."],
];

export default function Home() {
  const [amount, setAmount] = useState(200);
  const [demoState, setDemoState] = useState<DemoState>("idle");
  const [selectedAgent, setSelectedAgent] = useState(0);
  const [seconds, setSeconds] = useState(600);

  useEffect(() => {
    if (demoState !== "authorized" && demoState !== "ready") return;
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [demoState]);

  const findAgents = () => {
    setDemoState("searching");
    window.setTimeout(() => setDemoState("results"), 1100);
  };

  const authorize = (index: number) => {
    if (agents[index].availability === "Currently unavailable") return;
    setSelectedAgent(index);
    setSeconds(600);
    setDemoState("authorized");
  };

  const resetDemo = () => {
    setAmount(200);
    setSeconds(600);
    setDemoState("idle");
  };

  const countdown = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <main>
      <nav className="nav-shell" aria-label="Primary navigation">
        <a className="brand" href="#top" aria-label="TapWire home"><Image className="brand-logo" src="/tapwire-logo-dark.png" alt="TapWire — Tap. Connect. Send." width={166} height={46} sizes="166px" style={{ width: 166, height: 46, objectFit: "contain" }} priority /></a>
        <div className="nav-links">
          <a href="#problem">Why TapWire</a>
          <a href="#how">How it works</a>
          <a href="#security">Security</a>
          <a className="nav-cta" href="#withdraw">Try the demo</a>
        </div>
      </nav>

      <section className="hero" id="top">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow"><span /> Proximity-powered payments</p>
          <h1>Tap. Verify.<br /><em>Pay.</em></h1>
          <p className="hero-lede">A proximity-based identity and payment network for simpler payments and smarter agent withdrawals.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#how">See how it works <span>↓</span></a>
            <a className="button button-secondary" href="#withdraw">Explore TapWire</a>
          </div>
          <p className="simulation-note">Concept experience · No real transactions</p>
        </div>

        <div className="hero-visual" aria-label="Mock TapWire payment interface">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="phone">
            <div className="phone-top"><span>9:41</span><span>● ● ●</span></div>
            <div className="phone-body">
              <div className="mini-brand"><Image className="brand-symbol" src="/icon.png" alt="" width={28} height={28} sizes="28px" /> TapWire</div>
              <p className="phone-label">SEND PAYMENT</p>
              <h2>GHS 250<span>.00</span></h2>
              <div className="tap-zone"><div className="tap-rings"><span>)))</span></div><strong>Tap to identify</strong><small>Hold near a TapWire tag</small></div>
              <div className="verified-row"><span className="avatar">AK</span><span><small>VERIFIED VENDOR</small><strong>Akua&apos;s Kitchen</strong></span><b>✓</b></div>
              <button type="button">Confirm payment</button>
            </div>
          </div>
          <div className="float-card float-verified"><span>✓</span><p><small>IDENTITY CHECKED</small><strong>Verified recipient</strong></p></div>
          <div className="float-card float-secure"><span>⌁</span><p><small>PRIVATE BY DESIGN</small><strong>Your details stay yours</strong></p></div>
        </div>
      </section>

      <section className="problem section" id="problem">
        <div className="section-intro">
          <p className="kicker">THE FRICTION</p>
          <h2>Payments shouldn&apos;t start with <em>typing numbers.</em></h2>
          <p>TapWire replaces error-prone details and uncertain trips with a clear, verified handoff.</p>
        </div>
        <div className="comparison-grid">
          <article className="comparison-card current-card">
            <div className="card-topline"><span>Today</span><b>Too many unknowns</b></div>
            <div className="friction-flow"><span>Enter number</span><i>→</i><span>Check name</span><i>→</i><span>Pay</span></div>
            <div className="divider" />
            <div className="travel-flow">
              <div className="travel-step"><span className="route-node">1</span><p><strong>Find an agent</strong><small>Search manually</small></p></div>
              <div className="travel-step"><span className="route-node">2</span><p><strong>Travel there</strong><small>Hope cash is available</small></p></div>
              <div className="travel-step"><span className="route-node fail">×</span><p><strong>Start again</strong><small>No cash available</small></p></div>
            </div>
          </article>
          <article className="comparison-card tapwire-card">
            <div className="card-topline"><span>With TapWire</span><b>Know before you go</b></div>
            <div className="friction-flow better"><span>Tap / scan</span><i>→</i><span>Verify</span><i>→</i><span>Pay</span></div>
            <div className="divider" />
            <div className="mini-map">
              <div className="route-path" />
              <span className="map-dot user-dot">You</span><span className="map-dot agent-dot">A</span>
              <div className="map-card"><span className="status-dot" /><p><small>SUITABLE AGENT</small><strong>High availability · 350 m</strong></p></div>
            </div>
          </article>
        </div>
      </section>

      <section className="how section" id="how">
        <div className="section-intro centered">
          <p className="kicker">ONE CLEAR FLOW</p>
          <h2>From proximity to payment, <em>without the guesswork.</em></h2>
        </div>
        <div className="steps-grid">
          {steps.map(([number, title, copy], index) => (
            <article className="step-card" key={title}>
              <div className="step-number">{number}</div>
              <div className="step-icon">{["⌁", "✓", "◎", "◫", "→"][index]}</div>
              <h3>{title}</h3><p>{copy}</p>
            </article>
          ))}
        </div>
        <div className="rail-note"><span>TapWire coordinates</span><b>→</b><span>Financial provider settles</span></div>
      </section>

      <section className="withdraw" id="withdraw">
        <div className="section withdraw-heading">
          <div className="section-intro light">
            <p className="kicker">SMART WITHDRAWALS</p>
            <h2>Need cash? Know where to go <em>before you go.</em></h2>
            <p>Request an amount, compare suitable verified agents, and create a short-lived authorization — all in one guided flow.</p>
          </div>
          <div className="demo-badge"><span>●</span> LIVE USER-INTERFACE SIMULATION</div>
        </div>

        <div className="withdraw-demo section">
          <div className="demo-controls">
            <div className="demo-step-label"><span>01</span> Set your request</div>
            <label htmlFor="amount">How much cash do you need? <small>Ghanaian cedi (GHS)</small></label>
            <div className="amount-field"><span>GHS</span><input id="amount" inputMode="numeric" value={amount} onChange={(event) => setAmount(Number(event.target.value.replace(/\D/g, "")) || 0)} aria-label="Amount in Ghanaian cedi" /></div>
            <div className="amount-chips" aria-label="Preset amounts">
              {[100, 200, 500].map((value) => <button className={amount === value ? "selected" : ""} type="button" key={value} onClick={() => setAmount(value)}>GHS {value}</button>)}
            </div>
            <div className="demo-detail"><span>⌖</span><p><small>SEARCHING NEAR</small><strong>Osu, Accra</strong></p><b>Mock location</b></div>
            <button className="find-button" type="button" onClick={findAgents} disabled={demoState === "searching"}>{demoState === "searching" ? "Searching…" : "Find suitable agents"}<span>→</span></button>
            <p className="demo-disclaimer">This is a local visual simulation. No location or financial data is collected.</p>
          </div>

          <div className="demo-map" aria-live="polite">
            <div className="map-pattern" />
            <div className="map-toolbar"><span><b>Nearby agents</b><small>{demoState === "idle" ? "Start a search to see matches" : "Matched for your request"}</small></span><button type="button" onClick={resetDemo}>Reset</button></div>
            {demoState === "idle" && <div className="map-empty"><div className="radar"><span>⌖</span></div><strong>Ready when you are</strong><p>Choose an amount and find agents matched to your request.</p></div>}
            {demoState === "searching" && <div className="map-empty"><div className="radar searching"><span>⌖</span></div><strong>Searching nearby verified agents…</strong><p>Considering availability, reliability, freshness, and distance.</p></div>}
            {(demoState === "results" || demoState === "authorized" || demoState === "ready") && (
              <>
                <span className="map-user">You</span>
                {agents.map((agent, index) => <button key={agent.name} type="button" className={`agent-pin ${agent.position} ${agent.availability === "Currently unavailable" ? "unavailable" : ""}`} aria-label={`${agent.name}, ${agent.distance}`}>{String.fromCharCode(65 + index)}</button>)}
                <div className="agent-results">
                  {agents.map((agent, index) => (
                    <button type="button" key={agent.name} disabled={agent.availability === "Currently unavailable" || demoState !== "results"} onClick={() => authorize(index)} className={`agent-result ${selectedAgent === index && demoState !== "results" ? "active" : ""}`}>
                      <span className="agent-avatar">{String.fromCharCode(65 + index)}</span>
                      <span className="agent-copy"><strong>{agent.name}</strong><small>{agent.area} · {agent.distance}</small><i className={agent.availability === "Currently unavailable" ? "off" : ""}>{agent.availability}</i></span>
                      <span className="reliability"><small>RELIABILITY</small><b>{agent.reliability}%</b></span>
                    </button>
                  ))}
                </div>
              </>
            )}
            {(demoState === "authorized" || demoState === "ready") && (
              <div className="authorization-card">
                <div className="auth-check">✓</div>
                <p className="kicker">{demoState === "ready" ? "YOU’RE ALL SET" : "WITHDRAWAL AUTHORIZED"}</p>
                <h3>{demoState === "ready" ? "Ready to visit agent" : `GHS ${amount} reserved`}</h3>
                <p>{agents[selectedAgent].name} · {agents[selectedAgent].distance} away</p>
                <div className="request-id"><span><small>REQUEST IDENTIFIER</small><strong>TW-A7C4-29</strong></span><span><small>EXPIRES IN</small><strong>{countdown}</strong></span></div>
                {demoState === "authorized" ? <button type="button" onClick={() => setDemoState("ready")}>I&apos;m ready to visit <span>→</span></button> : <button type="button" onClick={resetDemo}>Run simulation again</button>}
              </div>
            )}
          </div>
        </div>

        <div className="matching section">
          <div><p className="kicker">BETTER THAN “NEAREST”</p><h3>The right agent is more than a pin on a map.</h3><p>TapWire combines practical signals to recommend an agent more likely to fulfill your request — while keeping their exact cash and electronic-float balance private.</p></div>
          <div className="factor-cloud">
            {[["⌖","Distance"],["◒","Liquidity"],["↻","Freshness"],["★","Reliability"],["●","Availability"],["↗","Demand"]].map(([icon,label]) => <span key={label}><b>{icon}</b>{label}</span>)}
            <strong>→ Recommended agent</strong>
          </div>
        </div>
      </section>

      <section className="participants section">
        <div className="section-intro centered"><p className="kicker">BUILT FOR THE NETWORK</p><h2>One connection. <em>Three ways to move.</em></h2></div>
        <div className="participant-grid">
          {[
            ["01","Users","Send and receive money, identify recipients, request cash, and find suitable agents.","Send with confidence"],
            ["02","Vendors","Receive payments through a verified TapWire business identity.","Be easy to identify"],
            ["03","Agents","Receive authorized requests, update availability, and keep a digital record.","Serve smarter"],
          ].map(([num,title,copy,tag]) => <article key={title}><span>{num}</span><div className={`participant-icon icon-${num}`}>{title[0]}</div><h3>{title}</h3><p>{copy}</p><b>{tag} →</b></article>)}
        </div>
      </section>

      <section className="security" id="security">
        <div className="security-inner section">
          <div className="shield" aria-hidden="true"><span>✓</span><i /></div>
          <div className="security-copy"><p className="kicker">THE SECURITY PRINCIPLE</p><h2>Tap identifies you.<br /><em>Tap does not move your money.</em></h2><p>Near-Field Communication (NFC), Quick Response (QR) codes, and TapWire identifiers only establish who the intended recipient is. Identity tags never store balances, passwords, or payment authorization secrets.</p></div>
          <div className="security-flow">
            {[["01","Identify","NFC · QR · TapWire ID"],["02","Verify","Confirmed identity"],["03","Confirm","Amount and recipient"],["04","Authorize","Short-lived request"],["05","Settle","Financial provider"]].map(([num,title,copy]) => <div key={title}><span>{num}</span><p><strong>{title}</strong><small>{copy}</small></p></div>)}
          </div>
        </div>
      </section>

      <section className="future section">
        <div className="future-copy"><p className="kicker">THE ROAD AHEAD</p><h2>TapWire gets smarter <em>as the network grows.</em></h2><p>The first version focuses on clean transaction and liquidity signals. Better matching and forecasting come later — as future capabilities, not current claims.</p><span>FUTURE VISION · NOT YET ACTIVE</span></div>
        <div className="future-grid">
          {[["01","Digital ledger","A clean trail of coordinated activity."],["02","Better matching","Recommendations improve with real outcomes."],["03","Liquidity forecasting","Anticipate where cash may be needed."],["04","Fraud signals","Spot unusual patterns earlier."],["05","Rebalancing","Help the network respond to demand."]].map(([num,title,copy]) => <article key={title}><span>{num}</span><h3>{title}</h3><p>{copy}</p></article>)}
        </div>
      </section>

      <footer>
        <div className="footer-orbit" />
        <div className="footer-content section"><p className="kicker">START WITH IDENTITY</p><h2>Payments are already digital.<br /><em>Finding who to pay should be simpler.</em></h2><a className="button button-primary" href="#top">Experience TapWire <span>↑</span></a><div className="footer-chain">Identity <b>→</b> Proximity <b>→</b> Payment <b>→</b> Liquidity <b>→</b> Intelligence <b>→</b> Settlement</div><div className="footer-bottom"><a className="brand" href="#top" aria-label="TapWire home"><Image className="brand-logo" src="/tapwire-logo-dark.png" alt="TapWire — Tap. Connect. Send." width={166} height={46} sizes="166px" style={{ width: 166, height: 46, objectFit: "contain" }} /></a><p>Frontend concept · Built for demonstration</p><p>© 2026 TapWire</p></div></div>
      </footer>
    </main>
  );
}
