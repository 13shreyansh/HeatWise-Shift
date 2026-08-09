# HeatWise Shift

HeatWise Shift is a fast, explainable heat-stress decision aid for outdoor teams.
It combines local temperature, humidity, exposure duration, workload, sun,
protective gear and worker-reported symptoms into an immediate risk level and a
plain-language shift plan.

Built for **HackDevengers 1.0** under the event's open-innovation problem
statement.

## The problem

Heat risk is easy to underestimate when weather readings are considered without
work intensity, PPE, direct sun or symptoms. Supervisors and workers need a quick
way to turn field conditions into consistent, shareable actions before someone
becomes seriously ill.

## What the prototype does

- Calculates a feels-like heat index from temperature and humidity.
- Adds transparent risk factors for workload, sun, PPE and exposure duration.
- Treats confusion or fainting as an urgent stop-work signal.
- Generates hydration, recovery-break and work-control guidance instantly.
- Lets the user copy or download the action plan.
- Saves up to four recent checks on the same device with `localStorage`.
- Works responsively on desktop and mobile with no account or server database.

The scoring method is deliberately visible in the product. It is a practical
prototype, not a medical device or a substitute for local regulations, trained
safety staff, emergency services or clinical advice.

## Run locally

Requires Node.js `>=22.13.0`.

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Validate

```bash
npm run lint
npm test
```

## Technology

React 19, TypeScript, vinext, Vite and Cloudflare Workers-compatible hosting.
The production experience is client-side by design: no personal health or shift
data is transmitted to a backend.

## Privacy and safety

Assessment history stays in the user's browser. The prototype records no names,
location or account identifiers. If a worker is confused, faints or appears
seriously ill, stop work, begin cooling, and contact local emergency services.
