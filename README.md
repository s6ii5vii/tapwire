# TapWire

TapWire is a responsive, frontend-only product concept for proximity-powered
identity, verified payments, and smarter agent withdrawals.

The interactive payment, Near-Field Communication (NFC), Quick Response (QR),
map, agent, and withdrawal states are local simulations. The site does not move
money, collect location data, or connect to a backend.

## Technology

- Next.js App Router
- TypeScript
- React
- Tailwind CSS

## Run locally

Node.js 20.9 or newer is required.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Other devices on the same unrestricted local
network can use the network address printed by the development server.

## Verify the project

```bash
npm run lint
npm test
```

`npm test` creates a production Next.js build and runs the source-level product
checks.

## Deploy on Vercel

Import this GitHub repository into Vercel. Vercel detects Next.js automatically,
so the default framework, build command, and output settings are sufficient. No
environment variables or backend services are required.
