# Cloudflare staging deployment

This branch is an isolated staging setup. It does not change the production Vercel project, custom domains, Supabase schema, or payment/provider settings.

## Important safety rules

- Do not attach `store.falintino.com` to this Worker until the staging URL has passed end-to-end tests.
- Do not run Prisma migrations as part of the Cloudflare build.
- Configure runtime secrets in the Cloudflare Worker settings; never commit credentials.
- Keep the existing Supabase database and existing `DATABASE_URL`. Do not rotate or replace it during staging.
- The existing Prisma client currently uses the default Prisma 6 engine. Cloudflare runtime compatibility must be verified before this Worker can safely handle live orders. A successful static build alone is not sufficient.

## Build

Install dependencies with npm, then run:

```bash
npm run cf:build
npm run cf:preview
```

Only deploy after database connectivity, admin login, payment callbacks, Digiflazz processing, and order status updates have been tested on the preview URL.

## Runtime configuration still required

Set the existing application environment variables as encrypted Worker secrets/variables in Cloudflare. Do not paste secrets into GitHub or chat. Confirm compatibility of the Prisma 6 database engine with Workers before routing production traffic.
