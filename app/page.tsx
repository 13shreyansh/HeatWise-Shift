"use client";

import { useEffect, useMemo, useState } from "react";

type Intensity = "light" | "moderate" | "heavy";
type Sun = "shade" | "mixed" | "direct";
type Ppe = "minimal" | "light" | "heavy";
type Symptom = "headache" | "cramps" | "nausea" | "confusion" | "fainting";

type SavedCheck = {
  id: number;
  score: number;
  level: string;
  heatIndex: number;
  createdAt: string;
};

const symptomOptions: { id: Symptom; label: string; urgent?: boolean }[] = [
  { id: "headache", label: "Headache" },
  { id: "cramps", label: "Muscle cramps" },
  { id: "nausea", label: "Nausea" },
  { id: "confusion", label: "Confusion", urgent: true },
  { id: "fainting", label: "Fainting", urgent: true },
];

const levelMeta = [
  { max: 20, level: "Low", tone: "low", action: "Normal precautions" },
  { max: 40, level: "Guarded", tone: "guarded", action: "Add water breaks" },
  { max: 60, level: "High", tone: "high", action: "Reduce exposure" },
  { max: 80, level: "Severe", tone: "severe", action: "Reschedule heavy work" },
  { max: 101, level: "Critical", tone: "critical", action: "Stop and respond" },
];

function calculateHeatIndex(tempC: number, humidity: number) {
  if (tempC < 27) return tempC;
  const t = tempC * (9 / 5) + 32;
  const rh = humidity;
  const hi =
    -42.379 +
    2.04901523 * t +
    10.14333127 * rh -
    0.22475541 * t * rh -
    0.00683783 * t * t -
    0.05481717 * rh * rh +
    0.00122874 * t * t * rh +
    0.00085282 * t * rh * rh -
    0.00000199 * t * t * rh * rh;
  return (hi - 32) * (5 / 9);
}

export default function Home() {
  const [temperature, setTemperature] = useState(34);
  const [humidity, setHumidity] = useState(68);
  const [duration, setDuration] = useState(120);
  const [intensity, setIntensity] = useState<Intensity>("moderate");
  const [sun, setSun] = useState<Sun>("direct");
  const [ppe, setPpe] = useState<Ppe>("light");
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [saved, setSaved] = useState<SavedCheck[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const data = window.localStorage.getItem("heatwise-assessments");
    if (data) {
      try {
        const parsed = JSON.parse(data) as SavedCheck[];
        window.setTimeout(() => setSaved(parsed), 0);
      } catch {
        window.localStorage.removeItem("heatwise-assessments");
      }
    }
  }, []);

  const assessment = useMemo(() => {
    const heatIndex = calculateHeatIndex(temperature, humidity);
    const urgent = symptoms.some((item) => item === "confusion" || item === "fainting");
    const symptomPoints = symptoms.reduce(
      (sum, item) => sum + (item === "confusion" || item === "fainting" ? 40 : 8),
      0,
    );
    const score = Math.min(
      100,
      Math.max(0, (heatIndex - 27) * 2) +
        { light: 0, moderate: 8, heavy: 16 }[intensity] +
        { shade: 0, mixed: 3, direct: 7 }[sun] +
        { minimal: 0, light: 5, heavy: 12 }[ppe] +
        (duration >= 240 ? 9 : duration >= 120 ? 5 : duration >= 60 ? 2 : 0) +
        symptomPoints,
    );
    const finalScore = urgent ? Math.max(88, score) : score;
    const meta = levelMeta.find((item) => finalScore < item.max) ?? levelMeta[4];
    const waterInterval = finalScore >= 80 ? 10 : finalScore >= 60 ? 15 : finalScore >= 40 ? 20 : 30;
    const restInterval = finalScore >= 80 ? 20 : finalScore >= 60 ? 30 : finalScore >= 40 ? 45 : 60;
    const restMinutes = finalScore >= 80 ? 15 : finalScore >= 60 ? 10 : finalScore >= 40 ? 8 : 5;

    return {
      ...meta,
      score: Math.round(finalScore),
      heatIndex: Math.round(heatIndex * 10) / 10,
      urgent,
      waterInterval,
      restInterval,
      restMinutes,
    };
  }, [temperature, humidity, duration, intensity, sun, ppe, symptoms]);

  const planText = `HeatWise Shift assessment\nRisk: ${assessment.level} (${assessment.score}/100)\nFeels-like heat: ${assessment.heatIndex}°C\nWater: 250 mL every ${assessment.waterInterval} minutes\nRecovery: ${assessment.restMinutes} minutes in shade every ${assessment.restInterval} minutes\nAction: ${assessment.action}${assessment.urgent ? "\nURGENT: Stop work, cool the person and contact local emergency services." : ""}`;

  function toggleSymptom(symptom: Symptom) {
    setSymptoms((current) =>
      current.includes(symptom)
        ? current.filter((item) => item !== symptom)
        : [...current, symptom],
    );
  }

  function saveAssessment() {
    const next = [
      {
        id: Date.now(),
        score: assessment.score,
        level: assessment.level,
        heatIndex: assessment.heatIndex,
        createdAt: new Date().toISOString(),
      },
      ...saved,
    ].slice(0, 4);
    setSaved(next);
    window.localStorage.setItem("heatwise-assessments", JSON.stringify(next));
  }

  async function copyPlan() {
    await navigator.clipboard.writeText(planText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function downloadPlan() {
    const blob = new Blob([planText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "heatwise-shift-plan.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="HeatWise Shift home">
          <span className="brand-mark" aria-hidden="true">HW</span>
          <span>HeatWise <strong>Shift</strong></span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#assess">Assess</a>
          <a href="#plan">Action plan</a>
          <a href="#history">Saved checks</a>
        </nav>
        <span className="privacy-pill">On-device · No sign-in</span>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span></span> Rapid heat-risk decisions</div>
          <h1>Heat decisions, before heat becomes an emergency.</h1>
          <p>
            A transparent field tool for outdoor teams. Combine weather, workload,
            protective gear and symptoms to get a practical shift plan in seconds.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#assess">Run a safety check</a>
            <a className="text-link" href="#method">See how scoring works <span>↗</span></a>
          </div>
          <div className="trust-row" aria-label="Product principles">
            <span>✓ Explainable score</span>
            <span>✓ Mobile ready</span>
            <span>✓ Works offline after load</span>
          </div>
        </div>

        <div className={`hero-signal ${assessment.tone}`}>
          <div className="signal-head">
            <span>Live risk preview</span>
            <span className="status-dot">Assessment active</span>
          </div>
          <div className="signal-score">
            <div>
              <strong>{assessment.score}</strong><span>/100</span>
            </div>
            <div>
              <small>Current level</small>
              <b>{assessment.level}</b>
            </div>
          </div>
          <div className="signal-track"><span style={{ width: `${assessment.score}%` }}></span></div>
          <div className="signal-stats">
            <div><span>Feels like</span><strong>{assessment.heatIndex}°C</strong></div>
            <div><span>Water break</span><strong>{assessment.waterInterval} min</strong></div>
            <div><span>Recovery</span><strong>{assessment.restMinutes} min</strong></div>
          </div>
          <p>{assessment.action}. Adjust the inputs below to reflect the actual shift.</p>
        </div>
      </section>

      <section className="workspace" id="assess">
        <div className="section-intro">
          <span className="section-kicker">01 · Assess</span>
          <h2>Build the shift picture</h2>
          <p>Use conditions at the worksite—not a city-wide average.</p>
        </div>

        <div className="assessment-grid">
          <form className="input-panel" onSubmit={(event) => event.preventDefault()}>
            <div className="panel-heading">
              <div>
                <h3>Conditions & workload</h3>
                <p>All fields update the plan instantly.</p>
              </div>
              <button
                className="reset-button"
                type="button"
                onClick={() => {
                  setTemperature(34); setHumidity(68); setDuration(120);
                  setIntensity("moderate"); setSun("direct"); setPpe("light"); setSymptoms([]);
                }}
              >Reset</button>
            </div>

            <div className="field-grid">
              <label>
                <span>Air temperature <b>{temperature}°C</b></span>
                <input type="range" min="20" max="48" value={temperature} onChange={(e) => setTemperature(Number(e.target.value))} />
                <small>20°C <em>48°C</em></small>
              </label>
              <label>
                <span>Relative humidity <b>{humidity}%</b></span>
                <input type="range" min="20" max="100" value={humidity} onChange={(e) => setHumidity(Number(e.target.value))} />
                <small>20% <em>100%</em></small>
              </label>
              <label>
                <span>Exposure duration <b>{duration} min</b></span>
                <input type="range" min="30" max="480" step="30" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
                <small>30 min <em>8 hours</em></small>
              </label>
            </div>

            <div className="choice-group">
              <span>Work intensity</span>
              <div className="segmented">
                {(["light", "moderate", "heavy"] as Intensity[]).map((item) => (
                  <button type="button" key={item} className={intensity === item ? "active" : ""} onClick={() => setIntensity(item)}>{item}</button>
                ))}
              </div>
            </div>

            <div className="two-choices">
              <label>
                <span>Sun exposure</span>
                <select value={sun} onChange={(e) => setSun(e.target.value as Sun)}>
                  <option value="shade">Full shade</option>
                  <option value="mixed">Mixed</option>
                  <option value="direct">Direct sun</option>
                </select>
              </label>
              <label>
                <span>Protective gear</span>
                <select value={ppe} onChange={(e) => setPpe(e.target.value as Ppe)}>
                  <option value="minimal">Minimal</option>
                  <option value="light">Light PPE</option>
                  <option value="heavy">Heavy / impermeable</option>
                </select>
              </label>
            </div>

            <fieldset className="symptoms">
              <legend>Symptoms observed <span>select all that apply</span></legend>
              <div>
                {symptomOptions.map((item) => (
                  <label key={item.id} className={item.urgent ? "urgent-chip" : ""}>
                    <input type="checkbox" checked={symptoms.includes(item.id)} onChange={() => toggleSymptom(item.id)} />
                    <span>{item.label}{item.urgent ? " · urgent" : ""}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </form>

          <aside className={`result-panel ${assessment.tone}`} aria-live="polite">
            <div className="result-topline"><span>HeatWise risk score</span><span>Live</span></div>
            <div className="result-number"><strong>{assessment.score}</strong><span>/100</span></div>
            <div className="result-level"><span className="level-dot"></span>{assessment.level} risk</div>
            <p className="result-action">{assessment.action}</p>

            {assessment.urgent && (
              <div className="urgent-alert">
                <strong>Possible heat emergency</strong>
                <span>Stop work, begin rapid cooling and contact local emergency services.</span>
              </div>
            )}

            <div className="factor-list">
              <div><span>Heat index</span><b>{assessment.heatIndex}°C</b></div>
              <div><span>Workload</span><b>{intensity}</b></div>
              <div><span>Exposure</span><b>{Math.round(duration / 60 * 10) / 10} hr</b></div>
              <div><span>Symptoms</span><b>{symptoms.length || "None"}</b></div>
            </div>
            <button className="save-button" type="button" onClick={saveAssessment}>Save this check</button>
            <small className="local-note">Saved only on this device.</small>
          </aside>
        </div>
      </section>

      <section className="plan-section" id="plan">
        <div className="section-intro light">
          <span className="section-kicker">02 · Act</span>
          <h2>Turn risk into a shift plan</h2>
          <p>Clear instructions a supervisor can share at the toolbox talk.</p>
        </div>
        <div className="plan-grid">
          <article>
            <span className="plan-icon">01</span>
            <small>Hydration cadence</small>
            <h3>250 mL every {assessment.waterInterval} minutes</h3>
            <p>Cool water, within reach. Avoid waiting for thirst.</p>
          </article>
          <article>
            <span className="plan-icon">02</span>
            <small>Recovery cadence</small>
            <h3>{assessment.restMinutes} min shade every {assessment.restInterval} min</h3>
            <p>Use ventilated shade or a cooled space where available.</p>
          </article>
          <article>
            <span className="plan-icon">03</span>
            <small>Work control</small>
            <h3>{assessment.action}</h3>
            <p>Pair workers and re-check whenever conditions or symptoms change.</p>
          </article>
        </div>
        <div className="plan-actions">
          <button type="button" onClick={copyPlan}>{copied ? "Copied" : "Copy team brief"}</button>
          <button type="button" onClick={downloadPlan}>Download plan</button>
        </div>
      </section>

      <section className="method-section" id="method">
        <div>
          <span className="section-kicker">03 · Understand</span>
          <h2>Visible logic, not a black box</h2>
          <p>
            HeatWise starts with a temperature–humidity heat-index estimate, then adds
            transparent modifiers for workload, direct sun, protective gear, exposure
            length and observed symptoms. Urgent neurological symptoms override the score.
          </p>
        </div>
        <div className="method-scale" aria-label="Risk scale">
          {levelMeta.map((item, index) => (
            <div key={item.level}>
              <span className={item.tone}></span>
              <b>{item.level}</b>
              <small>{index === 0 ? "0–19" : `${levelMeta[index - 1].max}–${item.max - 1}`}</small>
            </div>
          ))}
        </div>
        <div className="disclaimer">
          <strong>Safety note</strong>
          <p>This decision aid supports—not replaces—site procedures, trained medical judgment or emergency services. If in doubt, stop work and escalate.</p>
        </div>
      </section>

      <section className="history-section" id="history">
        <div className="section-intro">
          <span className="section-kicker">Saved on this device</span>
          <h2>Recent checks</h2>
        </div>
        {saved.length ? (
          <div className="history-list">
            {saved.map((item) => (
              <div key={item.id}>
                <span className={`history-score ${item.level.toLowerCase()}`}>{item.score}</span>
                <span><strong>{item.level}</strong><small>{item.heatIndex}°C feels-like</small></span>
                <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</time>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-history">No saved checks yet. Run an assessment and save it for a quick local log.</p>
        )}
      </section>

      <footer>
        <a className="brand footer-brand" href="#top"><span className="brand-mark">HW</span><span>HeatWise <strong>Shift</strong></span></a>
        <p>Built for clearer heat-safety decisions in the field.</p>
        <a href="#assess">Run another check ↑</a>
      </footer>
    </main>
  );
}
