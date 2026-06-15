# Agent Manual

This repo is a static GitHub Pages PWA for Korean gift tax filing prep. Treat this file as the handoff manual for future agents.

## Product Shape

- Service name: `우리 아기 증여 도우미`
- Public URL: `https://pkkong.github.io/periodic-gift-tax/`
- MVP job: help a user decide and document a cash gift so they can prepare a HomeTax gift tax filing.
- Current scope: Korean resident cash gifts, one-time cash gift or fixed monthly periodic gift, parent/child, adult child/parent, grandparent/grandchild.
- Out of scope: HomeTax auto login/submission, tax agent judgment, server storage, dynamic legal update.
- Privacy rule: do not send personal data to a server. Default state is memory only. Local save and JSON backup happen only when the user asks.

## Handoff Discipline

Keep this manual current. After each meaningful product or technical change, update `AGENTS.md` in the same commit when any of these changed:

- Product decisions, scope, monetization stance, or user-facing flow.
- UX rules, copy rules, visual system decisions, or interaction patterns.
- Calculation rules, legal/tax assumptions, document contents, or HomeTax guidance.
- Browser/mobile gotchas, deployment behavior, cache/versioning behavior, or verification steps.
- Known pitfalls the user already corrected, especially things that caused repeated feedback.

If no documentation change is needed, say that explicitly in the final response. Do not make future agents rediscover settled decisions from chat history.

## Quality Bar

This app should feel like a Toss mobile service, not like a form demo.

- For Apps in Toss conversion, UX preservation is the default. The `2026-06-12 KST` ChannelTalk review said tax calculators are not currently allowed in Apps in Toss regardless of type, and gift tax calculators are included. On `2026-06-15 KST`, the user changed direction from the historical `20260610-4` rollback target to a small policy-adjusted candidate that keeps the same page structure but removes user-entered tax calculation, estimated tax results, and PDF calculation tables.
- First screen must be a polished landing flow with short copy, generous white space, a relevant visual asset, and a clear start action.
- Wizard pages should show only what the user needs now. Reveal the next input after the current value is valid and confirmed.
- If a step is incomplete, the primary next button should not look available. Hide it and keep only the previous button.
- Mobile keyboard Enter/Done must behave like tapping the current field's confirm arrow.
- If gift tax may arise, do not block the user. Warn clearly and expose a deliberate `이대로 결과 보기` action.
- Keep copy short and concrete. Avoid AI-like explanatory phrasing such as "차근차근 정리해드립니다", "설계합니다", or long legal narration in primary UI.
- Use Toss-like typography: Pretendard webfont, body around 400, controls around 600, major headings around 650. Do not make the whole UI bold.
- Use tabular numeric rendering for money/date figures.
- Avoid decorative card piles. Prefer white screens, list rows, light section dividers, and timeline rows.
- Do not use raw text glyphs such as `→`, `✓`, `›`, or `->` as visible UI controls. Use real buttons with CSS-drawn icons or natural Korean copy.
- The wizard has a small inline SVG baby mascot after the landing page. Keep it subtle, soft, and baby-like: rounded organic face, cheeks, ears, swaddle, and progress mood changes should support the task without dominating it.

## File Map

- `index.html`: static shell, wizard markup, landing copy, cache-busting versions.
- `styles.css`: all app styling. The final mobile/Toss polish block is near the end before print styles.
- `src/app.js`: state, progressive input flow, validation, rendering, local save/export/import, print actions.
- `src/tax.js`: valuation and gift tax calculation engine. Keep this pure and covered by tests.
- `src/documents.js`: printable HomeTax prep document pack.
- `apps-in-toss/`: separate Apps in Toss WebView miniapp. As of `2026-06-15 KST`, the current local candidate is policy-adjusted: it keeps the `20260610-4` style page structure while removing tax calculator inputs/results and presenting gift-prep guidance instead.
- `apps-in-toss/granite.config.ts`: Apps in Toss config. Current appName is `baby-gift-tax-helper`, display name is `우리 아기 증여 도우미`, Console app ID is `40739`, and the app requests no Apps in Toss permissions.
- `apps-in-toss/src/main.tsx`: Apps in Toss React entry. The current local candidate removes user-entered tax calculation and estimated tax results, keeps the `20260610-4` style page structure, and presents gift-prep guidance, 2,050만원 미만 기준 안내, a fixed monthly representative example, HomeTax prep steps, and a PDF checklist with `html2canvas`, `jspdf`, `saveBase64Data`, and `openPDFViewer`.
- `apps-in-toss/scripts/capture-console-assets.mjs`: Chrome DevTools Protocol screenshot script for QA viewport captures and Console screenshots.
- `apps-in-toss/console-submission.md`: console copy, in-app feature, release notes, and review notes.
- `apps-in-toss/console-assets/`: submission assets such as the 600px logo, 1932x828 thumbnail, QA viewport captures, and Apps in Toss console screenshot assets.
- `tests/tax.test.js`: Node test suite for valuation, tax calculation, filing deadline, validation.
- `assets/baby-gift-hero.png`: landing visual asset.
- `manifest.webmanifest`, `sw.js`, `icon.svg`: PWA/static hosting assets.
- `AGENTS.md`: living handoff manual. Update it when decisions or gotchas change.

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
- Donor step: name, address, phone, first seven resident ID digits, relationship.
- Recipient step: name, address, guardian, first seven resident ID digits.
- Recipient address defaults to donor address when `sameAddressAsDonor` is checked.
- Guardian defaults to donor name but must remain editable.
- Account step is strategically important but must not look like a Toss or securities affiliate integration until one is real. Current choices are `계좌가 있어요` and `아직 없지만 시뮬레이션할게요`; do not show a Toss Securities child-account CTA in production copy.
- History step asks whether the same donor gave anything in the last 10 years. It feeds `priorSameDonorGiftValue`, `priorDeductionUsed`, and `priorGiftTaxPaid` into the existing tax engine.
- Safe step explains the no-tax range before asking the gift mode.
- Gift mode branches one-time gift and monthly periodic gift.
- Amount step must show the tax-warning override if assessed value exceeds the safe limit.
- Amount step should prefill recommended amounts when fields are empty or still hold the app-provided recommendation. Do not overwrite user-edited amounts.
- Result step should summarize expected tax, deadline, next actions, HomeTax filing guidance, calculation basis, and PDF document actions.
- Result step is a checkpoint, not the end of the service. Keep it short: outcome, three key facts, next actions, and PDF save. Then continue to transfer execution and HomeTax guided filing steps.
- Transfer execution step should send the user back to the recipient account action if needed, then require explicit transfer completion before HomeTax filing guidance.
- HomeTax guided filing step should say automatic filing is not supported yet, then lead with concrete actions such as login/signup, gift tax menu, basic information, asset entry, evidence upload, and submission.
- HomeTax guide belongs on the result screen, not inside the printable PDF pack. Keep auto filing clearly labeled as preparing/not available until a real submission integration exists.
- HomeTax guidance must separate `prepared by this service` from `must be obtained or verified separately`. Do not merge generated draft documents with external evidence such as family certificates, full resident IDs, transfer records, or prior gift records.
- Printable document pack should contain filing-prep documents only: cover, valuation/cash statement, gift tax draft, property statement draft, and agreement/confirmation. Do not print the HomeTax input checklist.

## Visual Decisions

- Confirmation controls are empty `<button type="button">` elements with CSS-drawn chevron/check states. Keep accessible names in `aria-label`; do not put visible arrow/check text inside the buttons.
- Relationship labels should be natural Korean copy, e.g. `부모가 미성년 자녀에게`, not ASCII arrows.
- Money inputs are text inputs with `inputmode="numeric"` so the app can show comma grouping while preserving mobile numeric keyboard behavior.
- Resident ID fields collect only the first seven digits and display the remaining six hidden digits as mask dots.
- The baby mascot is inline SVG styled by CSS. It should remain rounded and cute at small mobile sizes, with cheeks/ears/swaddle visible and soft, slightly organic curves instead of mechanical circles. Mood states are currently `cry`, `calm`, `smile`, `happy`, `proud`, and `flex`; final HomeTax guidance uses the flex visual state with ring/arm/sparkles visible. Mascot copy should not describe the mascot mood, e.g. avoid labels like `처음엔 울상`; use short natural helper copy such as `괜찮아요` or `조금만 더`.
- Account CTA cards use a left pseudo-element icon. Any specialized account card, especially `execute-account-card`, must preserve enough left padding or an explicit icon column so the icon never overlaps the headline or helper text.

## Browser And Mobile Gotchas

- Do not rely on `file://` for final verification. Use a local static server or GitHub Pages.
- Do not hand users a `file://` link as the working app URL. Safari and Chrome can block ES module imports from local files, so buttons may look dead even though the same file works in the Codex in-app browser. Use the public GitHub Pages URL or a local `http://localhost` static server URL.
- Safari/Chrome tap reliability depends on real buttons. Keep confirm controls as `<button type="button">`.
- Keep `input`, `select`, and `textarea` font size at least `16px` to prevent iOS zoom on focus.
- Keep `enterkeyhint="next"` on progressive inputs.
- Enter handling lives in `handleFormEnterKey`, `handleFormLineBreak`, `handleFormSubmit`, and `scheduleAutoConfirmField`.
- Validation toasts must stay above the mobile keyboard and bottom browser bar. `syncViewportInset` updates `--visual-viewport-bottom`; do not replace it with a hardcoded bottom value.
- When changing CSS/JS, bump the query version in `index.html`, `src/app.js`, and `src/documents.js` imports so GitHub Pages and mobile browsers do not serve stale assets.
- Apps in Toss WebView builds may fail under the Codex app embedded Node because Rollup native modules can be blocked by macOS library validation. Use the bundled runtime Node at `/Users/pkkong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node` for Vite, typecheck, and build commands if that happens.
- The local shell may not have `npm` or `npx`. This repo used a repo-external npm CLI tarball under `/Users/pkkong/.cache/codex-tooling/npm/` during setup. Do not commit that cache.
- `apps-in-toss/src/main.tsx` in the current local branch no longer imports the shared `src/tax.js` calculation engine for the Apps in Toss UI. On `2026-06-15 KST`, the local candidate was changed to remove amount inputs, prior-gift amount inputs, estimated tax/result metrics, and PDF calculation tables. It keeps the existing page structure and uses fixed guidance copy for 미성년 자녀 2,000만원 공제, 과세표준 50만원 미만, 2,050만원 미만 안내, and a `2026.06.15` monthly representative example of `월 19만 6천원대`.
- Apps in Toss WebView may not respond to `window.print()`. Keep the miniapp PDF path in `apps-in-toss/src/main.tsx`: it renders the checklist preview with `html2canvas`, creates a PDF with `jspdf`, then calls `saveBase64Data` for `PDF 저장` and `openPDFViewer` for preview, with browser download fallback for local QA.
- Apps in Toss upload can use a local token registered by the user with `ait token add` or a one-time Console API key passed directly to `ait deploy --api-key`. Do not ask for, print, commit, or store API keys, passwords, OTPs, or console sessions. If a temporary key is created only for agent upload, revoke it in the Apps in Toss Console after the candidate is verified.
- Apps in Toss AX is installed for Codex at `/Users/pkkong/.codex/tools/bin/ax` and registered in `/Users/pkkong/.codex/config.toml` as the `apps-in-toss` MCP server. Restart Codex or open a new session before expecting MCP tools to appear. Without restarting, use the CLI directly, for example `~/.codex/tools/bin/ax search docs --query "WebView PDF 저장" --limit 5`.
- Chrome extension file upload through Playwright `filechooser.setFiles` can be blocked with `Not allowed` unless the Codex extension has local file access. For Apps in Toss Console asset uploads, a working fallback was native Chrome file picker automation: click the visible file button, use macOS Go to Folder, enter the absolute PNG path, press Return, then press Return again to open.
- Official Apps in Toss sandbox testing supports iOS Simulator, iOS real device, Android emulator, or Android real device. The current Mac check on `2026-06-13 KST` found no full Xcode/Simulator (`xcrun simctl` unavailable) and no Android `adb`. Opening `intoss-private://baby-gift-tax-helper?_deploymentId=019eaf09-214e-7d28-95f2-8a023568ea63` directly on macOS fails because no Toss protocol handler is installed. Real Toss app/sandbox verification therefore needs a configured simulator, Android tooling, or a logged-in mobile Toss app.
- Chrome login was restored by the user on `2026-06-14 KST`. The Console app info page was still `검토 중이에요`, with the prior information-only copy visible and no edit/cancel action. After the user clarified the rollback target, the agent selected build `20260610-4`, sent its Console push test successfully, and clicked its `검토 요청`, but the Console showed `앱 정보 검토를 먼저 완료해 주세요`. On `2026-06-15 KST`, Chrome itself was running and the Codex Chrome Extension/native host diagnostics passed, but extension communication still failed with `Browser is not available: extension`; Console browser automation may need the user to reopen Chrome for the selected profile or reinstall the Chrome plugin.

## Verification Checklist

Run this before committing:

```sh
node --check src/app.js
node --check src/documents.js
node --test
git diff --check
```

Apps in Toss checks:

```sh
cd apps-in-toss
/Users/pkkong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node ./node_modules/typescript/bin/tsc -b
/Users/pkkong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node ./node_modules/eslint/bin/eslint.js .
/Users/pkkong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node ./node_modules/vite/bin/vite.js build
PATH="/Users/pkkong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" node /Users/pkkong/.cache/codex-tooling/npm/npm-11.16.0/bin/npm-cli.js run build
```

After a local deployment API key is registered with `ait token add`, upload the current release candidate with:

```sh
cd apps-in-toss
PATH="/Users/pkkong/.cache/codex-tooling/bin:/Users/pkkong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" npm run deploy:candidate
```

The final `2026-06-10 KST` UX-preserving candidate was uploaded through the Apps in Toss Console API as:

```text
intoss-private://baby-gift-tax-helper?_deploymentId=019eaf09-214e-7d28-95f2-8a023568ea63
```

Superseded candidate uploaded on `2026-06-13 KST` but no longer the active review target:

```text
intoss-private://baby-gift-tax-helper?_deploymentId=019ec152-19e3-76a8-bc3c-39ae750a7583
```

Apps in Toss Console build registry captured on `2026-06-14 KST`:

Public GitHub Pages baseline captured on `2026-06-14 KST`: `https://pkkong.github.io/periodic-gift-tax/` served `window.__PROJECT_TAX_VERSION__ = "40"` from `origin/main` commit `1879898ee49332853935471b24480d12762b3522`. Preserve this as tags `webapp/v40-public-20260614` and `apps-in-toss/20260610-4-webapp-baseline`. Build `20260610-4` is the closest Apps in Toss Console bundle to this public webapp UX, but it is still a Console bundle reference rather than a source-rebuildable Apps in Toss artifact.

| Build | Deployment ID | Rollback status |
| --- | --- | --- |
| `20260613-6` | `019ec152-19e3-76a8-bc3c-39ae750a7583` | Superseded calculator-restore candidate; do not use unless explicitly reselected. |
| `20260612-5` | `019eba0a-c3dc-7f96-b12d-33ecece36535` | Superseded information-only policy candidate. |
| `20260610-4` | `019eaf09-214e-7d28-95f2-8a023568ea63` | Historical rollback target; closest Console bundle to public webapp v40. |
| `20260610-3` | `019eaeec-baa9-750a-8d0b-451e825324d2` | Superseded; Console review button disabled. |
| `20260610-2` | `019eaeea-2d57-7bcb-a70c-dd40539b2d5a` | Superseded; Console review button disabled. |
| `20260610-1` | `019eacca-a95e-702e-96cd-ba664f0ee9e5` | Superseded; Console review button disabled. |

Important versioning caveat: these Console builds can be selected or tested by deployment ID while the Console keeps them, but earlier uploads were not committed and tagged at the exact upload moment. Do not claim exact source-level reproducibility for historical Console builds. Future Apps in Toss uploads must commit the exact source first, build from that commit, upload, record the Console build/deployment ID, then tag the commit as `apps-in-toss/<bundle-version>`.

Apps in Toss QA:

- Local app runs from `apps-in-toss/`.
- Production build creates an `.ait` candidate.
- 360px, 390px, and 430px screenshots do not show horizontal overflow or bottom CTA overlap.
- PDF 저장 creates a real PDF in local fallback and opens the Apps in Toss native save/view path in the miniapp.
- Relationship, prior gift yes/no, account status, gift mode guidance, summary, PDF preview, and PDF save all work for the current Apps in Toss candidate.
- The GitHub Pages calculator samples still match `tests/tax.test.js`. The historical Console build `20260610-4` should not be treated as source-rebuildable because it was not committed at upload time.
- Local restored Apps in Toss automated QA passed on `2026-06-13 KST` at 390px in headless Chrome for a later calculator source state, but that is no longer the current local release direction.
- Local policy-adjusted Apps in Toss automated QA passed on `2026-06-15 KST` at 360px, 390px, and 430px in headless Chrome: amount inputs and estimated-tax result text were absent, `2,050만원 미만`, `월 19만 6천원대`, `준비 요약`, and `PDF 저장` were present, no horizontal overflow was detected, and PDF preview contained checklist content without calculation-table fields.
- Console assets are present: 600 x 600 icon and 1932 x 828 thumbnail.
- Console screenshot assets are present: `screenshot-vertical-1.png`, `screenshot-vertical-2.png`, `screenshot-vertical-3.png` at 636 x 1048, plus `screenshot-horizontal-1.png` at 1504 x 741.
- Before uploading Console display assets, check the official Apps in Toss console registration guide and asset guide links from the Console. App logos must be validated against the current guide before upload; do not rely on generic mobile app icon assumptions.

Apps in Toss Console state as of `2026-06-14 KST`:

- App info was rejected. The rejection reason shown in the Console edit page was: `정확한 서비스 확인을 위해 채널톡으로 진행 예정인 서비스 내용을 말씀해 주세요.`
- The ChannelTalk workflow URL opened from the rejection reason is `https://apps-in-toss.channel.io/workflows/787658`. After the user clicked `동의하고 계속하기`, the agent selected `미니앱 관련 문의`, `앱정보 문의`, and `상담원 연결`, then submitted partner `SOULIB`, app `우리 아기 증여 도우미`, and reply email `kongncompany@naver.com`.
- ChannelTalk message sent:
  `안녕하세요. appName baby-gift-tax-helper / 한국어 앱 이름 우리 아기 증여 도우미입니다. 이 미니앱은 부모·자녀·조부모·손자녀 사이 현금 증여를 준비하는 사용자가 증여액, 관계, 과거 10년 동일인 증여 여부를 입력하면 예상 증여세, 신고기한, 송금 후 확인할 일, 홈택스 입력 순서, 신고 준비 PDF를 한 흐름으로 확인하도록 돕는 서비스입니다. 앱 안에서 자동 신고, 홈택스 로그인/제출, 세무 대리, 확정 세액 보증, Toss Login, 결제, 서버 저장, 분석 SDK는 제공하지 않습니다. 개인정보는 기본적으로 기기 안에서만 처리하고, 임시저장/백업/PDF 저장은 사용자 명시 액션으로만 동작합니다. 비사업자 개인 개발자로 수익화 기능 없이 제출 예정입니다. 앱 정보 반려 사유에 따라 진행 예정인 서비스 내용을 설명드립니다. 추가로 확인이 필요한 항목을 알려주시면 바로 보완하겠습니다.`
- App info was re-submitted after the ChannelTalk message. The console showed `검토 중이에요. 결과는 영업일 기준 2일 내 이메일로 알려드릴게요.` and `검토를 요청했어요.`
- App info was rejected again for the logo asset: `앱 로고: 로고 배경의 모서리는 둥근 형태 없이 네 모서리가 직각인 형태로 제작해주세요.`
- A first logo correction changed `apps-in-toss/console-assets/app-icon-600.png` from a rounded white-card background to a full square white background and was re-submitted, but this was still invalid because the logo background cannot be white or transparent.
- App info was rejected again for the logo background color: `앱 로고: 로고 배경에 투명색과 흰색은 사용할 수 없어요. 브랜드 대표 컬러로 배경색을 설정해주세요.`
- The logo was changed to use the in-app baby mascot only, without the prior `증여` text badge. `apps-in-toss/console-assets/app-icon-source.svg` is the source SVG and `apps-in-toss/console-assets/app-icon-600.png` is the rendered 600 x 600 PNG. The background is solid brand blue `#3182f6`, not white or transparent, and the same PNG was uploaded to both app logo and dark-mode app logo fields. App info was re-submitted again and the console returned to `검토 중이에요. 결과는 영업일 기준 2일 내 이메일로 알려드릴게요.` with `검토를 요청했어요.`
- App info was rejected again with `채널톡으로 안내되어 반려합니다.`
- The prior ChannelTalk conversation contained the detailed reason: `세금 관련 계산기는 종류와 무관하게 현재 앱인토스 정책상 허용하지 않고 있으며, 증여세 계산기도 이에 해당합니다. 증여세 계산 기능을 제거하고 신고기한 안내, 홈택스 입력 순서 가이드, 송금 후 체크리스트 등 정보 제공 중심으로 재구성하신다면 재검토가 가능합니다.`
- Apps in Toss code was changed on `2026-06-12 KST` to remove gift tax calculation and become an information-only guide.
- On `2026-06-14 KST`, the user clarified that the intended action was to roll back to the existing Console build `20260610-4`, not to create or submit a new `20260613-6` candidate.
- On `2026-06-15 KST`, the user then changed direction to a small policy-adjusted candidate based on the 04-style flow: remove calculation features, expand information guidance, keep `2,050만원 미만` and a fixed `월 19만 6천원대` representative example. Commit `e3d5183` implements this and local `ait build` produced deploymentId `019ecb88-ac50-7f9a-8359-a5afc0571d86`, but CLI upload is still blocked until a local Apps in Toss deployment API key is registered.
- Historical target build `20260610-4`, deployment `intoss-private://baby-gift-tax-helper?_deploymentId=019eaf09-214e-7d28-95f2-8a023568ea63`: On `2026-06-14 KST`, the agent sent the Console push test for this build and attempted `검토 요청`, but the Console blocked release review with `앱 정보 검토를 먼저 완료해 주세요` because app info was still pending. A ChannelTalk correction message was sent requesting app-info cancellation/rejection/unlock or release-review enablement for `20260610-4`.
- ChannelTalk blocker message sent on `2026-06-14 KST`:
  `안녕하세요. 파트너 SOULIB / appName baby-gift-tax-helper / 앱 ID 40739 / 한국어 앱 이름 우리 아기 증여 도우미입니다. 현재 앱 정보가 '검토 중이에요' 상태라 앱 출시 화면에서 최신 빌드 20260613-6 검토 요청을 누르면 '앱 정보 검토를 먼저 완료해 주세요' 모달이 떠서 제출이 막힙니다. 최신 빌드는 intoss-private://baby-gift-tax-helper?_deploymentId=019ec152-19e3-76a8-bc3c-39ae750a7583 이고, 콘솔 푸시 테스트까지 발송했습니다. 사용자 요청으로 계산기 복원 후보를 정확한 설명으로 재검토받으려 합니다. 현재 검토 중인 앱 정보를 취소/반려 처리해 수정 가능 상태로 열어주시거나, 최신 빌드 검토 요청이 가능하도록 조치 부탁드립니다. 회신은 kongncompany@naver.com 로 부탁드립니다.`
- ChannelTalk correction message sent on `2026-06-14 KST`:
  `정정드립니다. 위 메시지의 검토 요청 대상 빌드는 20260613-6이 아니라 기존 후보 20260610-4입니다. 검토 대상은 20260610-4 / intoss-private://baby-gift-tax-helper?_deploymentId=019eaf09-214e-7d28-95f2-8a023568ea63 입니다. 방금 이 버전으로 콘솔 푸시 테스트를 다시 발송했고, 20260610-4 행의 검토 요청을 눌렀지만 동일하게 '앱 정보 검토를 먼저 완료해 주세요' 모달로 막혔습니다. 따라서 현재 요청은 20260610-4 빌드 검토 요청이 가능하도록 앱 정보 검토를 완료/취소/반려 처리해 주시거나 수정 가능 상태로 열어달라는 내용입니다. 회신은 kongncompany@naver.com 로 부탁드립니다.`
- Challenge application form was submitted on `2026-06-11 KST` with submitter `공평근` and email `kongncompany@naver.com`; the success page showed `답변을 제출했어요`. The form required the phone number as digits only.

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
- Baby mascot is hidden on landing, shows crying/tear on the first wizard step, and reaches the final flex visual state with visible ring/arm by the HomeTax guided filing step.
- Visible UI should not contain raw arrow/check glyphs like `->`, `→`, `✓`, or `›`.

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
