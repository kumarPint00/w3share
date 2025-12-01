# DogeGiFty Full Stack – Next.js 14 App Router

Complete production scaffold including the Gift Pack creation & claim flow.

## Key Points

- Next.js 14 **App Router** (`app/`)
- TypeScript strict mode
- MUI v5 + Emotion + custom theme
- Context-driven state for Create/Claim flow
- Mock escrow service in `lib/escrow.ts` (replace with on‑chain logic)
- Zod schemas for strong validation
- Responsive & accessible UI
- Minimal dummy assets placeholders (`/public/...`)

## Getting started

```bash
npm install
npm run dev
```

Put your exported images in `/public`.

## Production TODO

- Swap escrow mock with real smart contract or backend API.
- Wallet hook via `wagmi` or `ethers.js`.
- Add tests (Jest + React Testing Library).
- CI / lint / deploy pipeline.
