# Rent a Tilet

Build the complete Rent a Tilet MVP starting with the lender multi-step listing form and photo uploads, then the browse feed and rental details, matching the attached design screenshots and concept document:
- Match the visual styling and brand aesthetic: deep forest green typography and badges, warm cream background (#FAF8F5), gold/tilet accent buttons, and the floating bottom navigation bar (Home, Browse, List +, Dashboard).
- 5-step lender listing form:
  1. Photos (up to 6 photos with drag/upload and cover photo selection)
  2. Details (title, category: Habesha Kemis / Cocktail / Wedding Guest / Formal, tilet embroidery style, Addis Ababa neighborhood)
  3. Measurements & sizing
  4. Pricing (rental fee per 4 days, retail purchase comparison, security deposit, and transparent fee split calculator showing lender payout vs platform fee)
  5. Availability calendar
- Browse feed and dress cards: Category pills, neighborhood selector (e.g. Bole • 2.3km away), search bar, dress cards displaying distance, rental fee in ETB per 4 days, rating, and favorite toggle.
- Rental details & escrow booking flow: Breakdown of rental fee + refundable security deposit, manual payment instructions (Telebirr / CBE Birr), and booking submission.
- Handover and return audit: Digital condition checklist (hem, tilet embroidery, stains, zipper), meetup photo upload, dual digital signatures for lender and renter, and dispute trigger ('Do Not Confirm') that freezes escrow for mediation.
- Lender dashboard: Total earned, pending payouts, refund status tracker, payout split explainer, and listings management tabs.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/25d72a60-ed5f-4918-8aaf-1c356bdbe9e9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
