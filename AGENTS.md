# Agent Manual

This repo is a static GitHub Pages PWA for Korean gift tax filing prep. Treat this file as the handoff manual for future agents.

## Product Shape

- Service name: `우리 아기 증여 도우미`
- Public URL: `https://pkkong.github.io/periodic-gift-tax/`
- MVP job: help a user decide and document a cash gift so they can prepare a HomeTax gift tax filing.
- Current scope: Korean resident cash gifts, one-time cash gift or fixed monthly periodic gift, parent/child, adult child/parent, grandparent/grandchild.
- Out of scope: HomeTax auto login/submission, tax agent judgment, server storage, dynamic legal update.
- Privacy rule: do not send personal data to a server. Default state is memory only. Local save and JSON backup happen only when the user asks.

## Quality Bar

This app should feel like a Toss mobile service, not like a form demo.

- First screen must be a polished landing flow with short copy, generous white space, a relevant visual asset, and a clear start action.
- Wizard pages should show only what the user needs now. Reveal the next input after the current value is valid and confirmed.
- If a step is incomplete, the primary next button should not look available. Hide it and keep only the previous button.
- Mobile keyboard Enter/Done must behave like tapping the current field's confirm arrow.
- If gift tax may arise, do not block the user. Warn clearly and expose a deliberate `이대로 결과 보기` action.
- Keep copy short and concrete. Avoid AI-like explanatory phrasing such as "차근차근 정리해드립니다", "설계합니다", or long legal narration in primary UI.
- Use Toss-like typography: Pretendard webfont, body around 400, controls around 600, major headings around 650. Do not make the whole UI bold.
- Use tabular numeric rendering for money/date figures.
- Avoid decorative card piles. Prefer white screens, list rows, light section dividers, and timeline rows.

## File Map

- `index.html`: static shell, wizard markup, landing copy, cache-busting versions.
- `styles.css`: all app styling. The final mobile/Toss polish block is near the end before print styles.
- `src/app.js`: state, progressive input flow, validation, rendering, local save/export/import, print actions.
- `src/tax.js`: valuation and gift tax calculation engine. Keep this pure and covered by tests.
- `src/documents.js`: printable HomeTax prep document pack.
- `tests/tax.test.js`: Node test suite for valuation, tax calculation, filing deadline, validation.
- `assets/baby-gift-hero.png`: landing visual asset.
- `manifest.webmanifest`, `sw.js`, `icon.svg`: PWA/static hosting assets.

## Calculation Rules

Keep calculation changes in `src/tax.js` and add or update tests before touching UI.

- Periodic gift valuation groups monthly payments by calendar receipt year.
- Payments in the valuation base year are not discounted, including a partial first year.
- Following receipt years are discounted by `1.03 ^ yearOffset`.
- Apply the annual periodic amount times 20 cap.
- One-time cash gift is valued at the cash amount on gift date.
- Gift tax calculation includes relationship deduction, 10-year same-donor aggregation input, gift tax brackets, taxable minimum under 500,000 KRW, filing credit, and generation-skipping surcharge.
- Safe no-tax display limit is `available deduction + 499,999`.
- Filing deadline is gift-month end plus three months, adjusted forward if it lands on a weekend.

## UX Flow Rules

- Intro: landing page, not a form page. Keep scrollable service guidance and bottom start section.
- Donor step: name -> address -> phone -> first seven resident ID digits -> relationship.
- Recipient step: name -> address -> guardian -> first seven resident ID digits.
- Recipient address defaults to donor address when `sameAddressAsDonor` is checked.
- Guardian defaults to donor name but must remain editable.
- Account step is strategically important. Keep the recipient-name account check and Toss Securities child-account CTA visible.
- History step asks whether the same donor gave anything in the last 10 years. It feeds `priorSameDonorGiftValue`, `priorDeductionUsed`, and `priorGiftTaxPaid` into the existing tax engine.
- Safe step explains the no-tax range before asking the gift mode.
- Gift mode branches one-time gift and monthly periodic gift.
- Amount step must show the tax-warning override if assessed value exceeds the safe limit.
- Amount step should prefill recommended amounts when fields are empty or still hold the app-provided recommendation. Do not overwrite user-edited amounts.
- Result step should summarize expected tax, deadline, next actions, HomeTax filing guidance, calculation basis, and PDF document actions.
- Result step should keep the default view short. Show the outcome, three key facts, next actions, PDF save, and HomeTax CTA first; keep preparation lists, HomeTax details, calculation basis, and valuation tables collapsed by default.
- HomeTax guide belongs on the result screen, not inside the printable PDF pack. Keep auto filing clearly labeled as preparing/not available until a real submission integration exists.
- HomeTax guidance must separate `prepared by this service` from `must be obtained or verified separately`. Do not merge generated draft documents with external evidence such as family certificates, full resident IDs, transfer records, or prior gift records.
- Printable document pack should contain filing-prep documents only: cover, valuation/cash statement, gift tax draft, property statement draft, and agreement/confirmation. Do not print the HomeTax input checklist.

## Browser And Mobile Gotchas

- Do not rely on `file://` for final verification. Use a local static server or GitHub Pages.
- Safari/Chrome tap reliability depends on real buttons. Keep confirm controls as `<button type="button">`.
- Keep `input`, `select`, and `textarea` font size at least `16px` to prevent iOS zoom on focus.
- Keep `enterkeyhint="next"` on progressive inputs.
- Enter handling lives in `handleFormEnterKey`, `handleFormLineBreak`, `handleFormSubmit`, and `scheduleAutoConfirmField`.
- Validation toasts must stay above the mobile keyboard and bottom browser bar. `syncViewportInset` updates `--visual-viewport-bottom`; do not replace it with a hardcoded bottom value.
- When changing CSS/JS, bump the query version in `index.html`, `src/app.js`, and `src/documents.js` imports so GitHub Pages and mobile browsers do not serve stale assets.

## Verification Checklist

Run this before committing:

```sh
node --check src/app.js
node --check src/documents.js
node --test
git diff --check
```

Manual browser checks:

- Landing opens with the hero image, short headline, and start action.
- Incomplete form step hides the next button.
- Name Enter reveals the next input and moves focus.
- Phone and resident ID hyphen formatting works.
- Resident ID fields accept only the first seven digits but should display the six hidden trailing digits as a mask, e.g. `900101-1••••••`.
- Recipient address defaults to donor address.
- Guardian can be edited.
- A taxable amount shows a warning and still allows `이대로 결과 보기`.
- Result page can show the HomeTax filing guide, open HomeTax, and generate/print the document pack.
- Local save, JSON export/import, and reset still work if those files were touched.

GitHub Pages deployment check after push:

```sh
curl -fsSL "https://pkkong.github.io/periodic-gift-tax/?deploy-check=$(git rev-parse --short HEAD)" | rg 'PROJECT_TAX_VERSION__'
curl -fsSL "https://pkkong.github.io/periodic-gift-tax/styles.css?v=<version>" | rg 'Final Toss-style polish'
curl -fsSL "https://pkkong.github.io/periodic-gift-tax/src/app.js?v=<version>" | rg 'tax.js\\?v=<version>'
```

## Copy Style

Use short Korean sentences that sound like a mobile finance product.

Good:

- `세금이 나올 수 있어요`
- `이대로 결과 보기`
- `받는 분 명의 계좌가 있나요?`
- `10년 동안 약 2,050만원 미만이 기준이에요`

Avoid:

- `신고 준비팩을 생성합니다`
- `증여 실행 전에 결정해야 할 것만 순서대로 정리합니다`
- `보수적으로 설계합니다`
- Long paragraphs in primary screens.

Legal or tax caveats belong in the result, document pack, or rule overlay, not on every page.

## Applying This To New Services

For a new tax or finance helper MVP, reuse this bar:

- Build the actual task flow first, not a marketing page.
- Landing explains the service briefly, then the app does the work.
- Break the workflow into small screens.
- Validate one field at a time.
- Never make disabled or unavailable actions look clickable.
- If a user may still validly continue despite a warning, make the warning explicit and provide a deliberate continue action.
- Keep calculations pure, typed with JSDoc, and tested.
- Keep document generation separate from calculation.
- Keep all data local unless the product explicitly needs a backend.
- Deploy to static hosting early and verify the public URL, because mobile browser behavior and cache behavior matter.
