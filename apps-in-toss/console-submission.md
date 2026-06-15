# Apps in Toss Console Submission Draft

## App Identity

- Korean name: `우리 아기 증여 도우미`
- English name: `Baby Gift Tax Helper`
- appName: `baby-gift-tax-helper`
- Console app ID: `40739`
- Type: non-game
- Primary color: `#0064FF`
- Age: Apps in Toss currently serves users aged 19 or older.
- Customer support: `kongncompany@naver.com`
- Console category: `생활 > 공공·행정 > 공공·행정`
- Console keywords: `증여`, `증여세`, `세금계산`, `신고기한`, `홈택스`

## Assets

- App logo: `console-assets/app-icon-600.png`
  - 600 x 600 PNG
  - Rendered from `console-assets/app-icon-source.svg`
  - Solid brand-blue `#3182f6` background, no transparent or white canvas
  - Uses the in-app baby mascot only, without text badge
- Thumbnail: `console-assets/thumbnail-1932x828.png`
  - 1932 x 828 PNG
- Screenshots:
  - `console-assets/qa-360.png`
  - `console-assets/qa-390.png`
  - `console-assets/qa-430.png`
  - `console-assets/screenshot-vertical-1.png` (636 x 1048)
  - `console-assets/screenshot-vertical-2.png` (636 x 1048)
  - `console-assets/screenshot-vertical-3.png` (636 x 1048)
  - `console-assets/screenshot-horizontal-1.png` (1504 x 741)

## App Description

`우리 아기 증여 도우미`는 아이에게 현금을 보내기 전 미성년 자녀 증여재산공제 2,000만원 기준, 과세표준 50만원 미만 기준, 한 번에 보내기와 매월 보내기 대표 예시, 홈택스 준비 순서, 송금 전 체크리스트를 확인하는 미니앱입니다. 사용자가 금액을 입력해 세액을 계산하는 기능, 자동 신고, 세무 대리, 확정 세액 안내, 홈택스 로그인/제출, 서버 저장은 제공하지 않습니다.

## In-App Feature

- Korean feature name: `증여 준비 안내`
- English feature name: `Gift prep guide`
- Path: `/`
- Description: 미성년 자녀 증여 공제 기준, 2,050만원 미만 안내, 매월 보내기 대표 예시, 홈택스 준비 순서, PDF 체크리스트를 확인합니다.

## Release Notes

정책 반영 후보입니다. 세액 계산 입력과 예상 세액 결과를 제거하고, 미성년 자녀 증여 공제 기준, 2,050만원 미만 안내, 매월 보내기 대표 예시, 홈택스 준비 순서, PDF 체크리스트를 제공합니다. 자동 신고, 세무 대리, 확정 세액 안내, 홈택스 자동 제출, 서버 저장은 지원하지 않습니다.

## Challenge Application Draft

- Korean app name: `우리 아기 증여 도우미`
- appName: `baby-gift-tax-helper`
- Submitter email: `kongncompany@naver.com` unless the user provides a different email.
- Submitted user info: `공평근`, `01044213616`, `kongncompany@naver.com`
- One-line intro: `아이 현금 증여 전 신고기한과 준비서류를 기기 안에서 정리해요.`
- Theme relevance: `아이에게 현금을 증여할 때 반복해서 확인해야 하는 신고기한, 수취 계좌, 이체확인증, 가족관계 증빙, 홈택스 입력 순서를 한 흐름으로 정리해 일상의 기록 부담을 줄입니다.`

## Upload Command

Use a one-time Console API key or a locally registered profile. Do not commit or print the key.

```sh
./node_modules/.bin/ait deploy --api-key "$AITS_CONSOLE_API_KEY" --location ./baby-gift-tax-helper.ait -m "정책 반영 후보: 세액 계산 입력과 예상 세액 결과를 제거하고, 미성년 자녀 증여 공제 기준, 2,050만원 미만 안내, 매월 보내기 대표 예시, 홈택스 준비 순서, PDF 체크리스트를 제공합니다."
```

## Uploaded Candidate

- Uploaded at: `2026-06-10 KST`
- Deployment scheme: `intoss-private://baby-gift-tax-helper?_deploymentId=019eaf09-214e-7d28-95f2-8a023568ea63`
- Temporary Console API key names used during upload: `codexupload0610`, `codexux0610`, `codexpdf0610`
- Cleanup: revoke or delete all temporary keys in the Apps in Toss Console after verifying the candidate.

## Current Console Review Target

- Target build: `20260610-4`
- Uploaded at: `2026-06-10 KST`
- Deployment scheme: `intoss-private://baby-gift-tax-helper?_deploymentId=019eaf09-214e-7d28-95f2-8a023568ea63`
- Upload memo: `PDF 저장 수정 후보: 기존 UX는 유지하고 Apps in Toss WebView에서 PDF 저장 버튼이 실제 PDF를 생성해 네이티브 저장/뷰어로 열리도록 수정했습니다.`
- User correction on `2026-06-14 KST`: the intended rollback/review target is the already uploaded Console build `20260610-4`, not a new `20260613-6` candidate.
- Superseded candidate: `20260613-6` / `intoss-private://baby-gift-tax-helper?_deploymentId=019ec152-19e3-76a8-bc3c-39ae750a7583` is not the active review target unless the user explicitly changes direction again.

## Console Build Registry

Captured from the Apps in Toss Console on `2026-06-14 KST`. These rows are Console-uploaded bundles, so the Console bundle/deployment is the source of truth for rollback. Earlier uploads were not committed and tagged at the exact upload moment, so do not claim source-level reproducibility for those builds.

Public GitHub Pages baseline captured on `2026-06-14 KST`: `https://pkkong.github.io/periodic-gift-tax/` served `window.__PROJECT_TAX_VERSION__ = "40"` from `origin/main` commit `1879898ee49332853935471b24480d12762b3522`. Preserve this source baseline as tags `webapp/v40-public-20260614` and `apps-in-toss/20260610-4-webapp-baseline`. Build `20260610-4` is the closest Apps in Toss Console bundle to this public webapp UX, but it remains a Console bundle reference, not a proven source-rebuildable artifact.

| Build | Created | SDK | Console status | Deployment ID | Rollback note |
| --- | --- | --- | --- | --- | --- |
| `20260613-6` | `2026. 06. 13` | `2.6.1` | `검토 필요` | `019ec152-19e3-76a8-bc3c-39ae750a7583` | Superseded calculator-restore candidate. Do not use unless the user explicitly reselects it. |
| `20260612-5` | `2026. 06. 12` | `2.6.1` | `검토 필요` | `019eba0a-c3dc-7f96-b12d-33ecece36535` | Superseded information-only policy candidate. |
| `20260610-4` | `2026. 06. 10` | `2.6.1` | `검토 필요` | `019eaf09-214e-7d28-95f2-8a023568ea63` | Active rollback/review target. PDF save fix candidate; closest Console bundle to the public webapp v40 UX baseline. |
| `20260610-3` | `2026. 06. 10` | `2.6.1` | `검토 필요` | `019eaeec-baa9-750a-8d0b-451e825324d2` | Superseded UX-preserving candidate. Review button is disabled in Console. |
| `20260610-2` | `2026. 06. 10` | `2.6.1` | `검토 필요` | `019eaeea-2d57-7bcb-a70c-dd40539b2d5a` | Superseded UX-preserving re-upload candidate. Review button is disabled in Console. |
| `20260610-1` | `2026. 06. 10` | `2.6.1` | `검토 필요` | `019eacca-a95e-702e-96cd-ba664f0ee9e5` | Superseded first Apps in Toss candidate. Review button is disabled in Console. |

To test a specific Console bundle, use `intoss-private://baby-gift-tax-helper?_deploymentId=<Deployment ID>`.

Future uploads must be versioned in this order:

1. Commit the exact source state.
2. Build the `.ait` bundle from that commit.
3. Upload the bundle and capture the Console build number plus deployment ID.
4. Tag the commit as `apps-in-toss/<bundle-version>`.
5. Update this registry before asking for review.

## Console Review State

- App info submitted for review at `2026-06-10 KST`.
- Console status on `2026-06-11 KST`: rejected for service confirmation, re-submitted after ChannelTalk follow-up, rejected for logo background shape, re-submitted after square-corner correction, rejected again for white/transparent logo background, then re-submitted after brand-blue mascot logo correction.
- First rejection reason: `정확한 서비스 확인을 위해 채널톡으로 진행 예정인 서비스 내용을 말씀해 주세요.`
- Second rejection reason: `앱 로고: 로고 배경의 모서리는 둥근 형태 없이 네 모서리가 직각인 형태로 제작해주세요.`
- Third rejection reason: `앱 로고: 로고 배경에 투명색과 흰색은 사용할 수 없어요. 브랜드 대표 컬러로 배경색을 설정해주세요.`
- Fourth rejection reason: `채널톡으로 안내되어 반려합니다.`
- ChannelTalk detail on `2026-06-12 KST`: Apps in Toss confirmed that tax calculators are not currently allowed regardless of type, and gift tax calculators are included. Re-review is possible if the gift tax calculation feature is removed and the app is rebuilt around filing deadline guidance, HomeTax input order guidance, and post-transfer checklists.
- ChannelTalk workflow: `https://apps-in-toss.channel.io/workflows/787658`
- ChannelTalk follow-up completed after the user clicked `동의하고 계속하기`. The agent selected `미니앱 관련 문의`, `앱정보 문의`, `상담원 연결`, submitted partner `SOULIB`, app `우리 아기 증여 도우미`, and reply email `kongncompany@naver.com`, then sent the service explanation below.
- App info was re-submitted after ChannelTalk. The Console showed `검토 중이에요. 결과는 영업일 기준 2일 내 이메일로 알려드릴게요.` and `검토를 요청했어요.`
- First logo correction on `2026-06-11 KST`: `console-assets/app-icon-600.png` was changed from a rounded white-card background to a full square white background and uploaded to both `앱 로고` and `다크모드 앱 로고`, then app info was re-submitted. This was still invalid because the logo background cannot be white or transparent.
- Current logo correction completed on `2026-06-11 KST`: `console-assets/app-icon-source.svg` now renders the in-app baby mascot on a solid brand-blue `#3182f6` background, and `console-assets/app-icon-600.png` is the generated 600 x 600 PNG. The PNG was uploaded to both `앱 로고` and `다크모드 앱 로고`, then app info was re-submitted again. The Console showed `검토 중이에요. 결과는 영업일 기준 2일 내 이메일로 알려드릴게요.` and `검토를 요청했어요.`
- Asset upload preflight for future Console edits: check the official Apps in Toss console registration guide and linked asset guides before upload, then verify dimensions, format, background color, corner shape, and brand/resource restrictions against the current guide.
- Active target build: `20260610-4`.
- Build review is not submitted yet. On `2026-06-14 KST`, after the user clarified the rollback target, the agent selected `20260610-4`, sent its Console push test successfully, then clicked `검토 요청`. The Console blocked review with `앱 정보 검토를 먼저 완료해 주세요`.
- Superseded calculation restore on `2026-06-13 KST`: a later local `.ait` candidate was uploaded as build `20260613-6`, but the user clarified on `2026-06-14 KST` that this should not be the review target. Do not continue against `20260613-6` unless the user explicitly reselects it.
- Console state on `2026-06-14 KST`: the app info page still showed `검토 중이에요. 결과는 영업일 기준 2일 내 이메일로 알려드릴게요.` with the prior information-only copy visible and no edit/cancel action. Build `20260610-4` is visible and its `검토 요청` button is enabled, but release review remains blocked until Apps in Toss finishes, cancels, or rejects the pending app-info review.
- ChannelTalk blocker follow-up on `2026-06-14 KST`: the initial blocker message incorrectly referenced `20260613-6`; a correction was then sent saying the target is `20260610-4` / deployment `019eaf09-214e-7d28-95f2-8a023568ea63`, that its Console push test was sent, and that its review request is blocked by pending app-info review. The message explicitly asked for replies to `kongncompany@naver.com`.
- Mac/device test environment on `2026-06-13 KST`: official sandbox testing was checked. This Mac has only Command Line Tools, not full Xcode/Simulator (`xcrun simctl` unavailable), and Android `adb` is not installed. Opening the `intoss-private://` scheme on macOS fails because no Toss protocol handler is installed. Therefore the remaining real Toss app/sandbox execution needs a logged-in mobile Toss app, iOS Simulator with the sandbox app installed, or Android device/emulator with `adb`.
- Local automated WebView QA passed on `2026-06-13 KST` against `http://127.0.0.1:5173/` in headless Chrome at 390px: one-time 10,000,000 KRW sample showed `예상 납부세액 0원`, one-time 50,000,000 KRW sample showed `2,910,000원`, no horizontal overflow was detected, PDF preview contained `증여세 신고 준비`, PDF save fallback showed `PDF 저장을 열었어요.`, and no browser console errors were captured.
- Local automated WebView QA passed on `2026-06-15 KST` against `http://127.0.0.1:5173/` in headless Chrome at 360px, 390px, and 430px: amount inputs and estimated-tax result text were absent, `2,050만원 미만`, `월 19만 6천원대`, `준비 요약`, and `PDF 저장` were present, no horizontal overflow was detected, and PDF preview contained checklist content without calculation-table fields.
- Challenge application form submitted on `2026-06-11 KST`. The success page showed `답변을 제출했어요`.
- Challenge submitter: `공평근`, `kongncompany@naver.com`; phone was submitted as digits only, as required by the form.

ChannelTalk message sent:

```text
안녕하세요. appName baby-gift-tax-helper / 한국어 앱 이름 우리 아기 증여 도우미입니다. 이 미니앱은 부모·자녀·조부모·손자녀 사이 현금 증여를 준비하는 사용자가 증여액, 관계, 과거 10년 동일인 증여 여부를 입력하면 예상 증여세, 신고기한, 송금 후 확인할 일, 홈택스 입력 순서, 신고 준비 PDF를 한 흐름으로 확인하도록 돕는 서비스입니다.

앱 안에서 자동 신고, 홈택스 로그인/제출, 세무 대리, 확정 세액 보증, Toss Login, 결제, 서버 저장, 분석 SDK는 제공하지 않습니다. 개인정보는 기본적으로 기기 안에서만 처리하고, 임시저장/백업/PDF 저장은 사용자 명시 액션으로만 동작합니다.

비사업자 개인 개발자로 수익화 기능 없이 제출 예정입니다. 앱 정보 반려 사유에 따라 진행 예정인 서비스 내용을 설명드립니다. 추가로 확인이 필요한 항목을 알려주시면 바로 보완하겠습니다.
```

ChannelTalk blocker message sent on `2026-06-14 KST`:

```text
안녕하세요. 파트너 SOULIB / appName baby-gift-tax-helper / 앱 ID 40739 / 한국어 앱 이름 우리 아기 증여 도우미입니다.

현재 앱 정보가 '검토 중이에요' 상태라 앱 출시 화면에서 최신 빌드 20260613-6 검토 요청을 누르면 '앱 정보 검토를 먼저 완료해 주세요' 모달이 떠서 제출이 막힙니다. 최신 빌드는 intoss-private://baby-gift-tax-helper?_deploymentId=019ec152-19e3-76a8-bc3c-39ae750a7583 이고, 콘솔 푸시 테스트까지 발송했습니다.

사용자 요청으로 계산기 복원 후보를 정확한 설명으로 재검토받으려 합니다. 현재 검토 중인 앱 정보를 취소/반려 처리해 수정 가능 상태로 열어주시거나, 최신 빌드 검토 요청이 가능하도록 조치 부탁드립니다. 회신은 kongncompany@naver.com 로 부탁드립니다.
```

ChannelTalk correction message sent on `2026-06-14 KST`:

```text
정정드립니다. 위 메시지의 검토 요청 대상 빌드는 20260613-6이 아니라 기존 후보 20260610-4입니다.

검토 대상은 20260610-4 / intoss-private://baby-gift-tax-helper?_deploymentId=019eaf09-214e-7d28-95f2-8a023568ea63 입니다. 방금 이 버전으로 콘솔 푸시 테스트를 다시 발송했고, 20260610-4 행의 검토 요청을 눌렀지만 동일하게 '앱 정보 검토를 먼저 완료해 주세요' 모달로 막혔습니다.

따라서 현재 요청은 20260610-4 빌드 검토 요청이 가능하도록 앱 정보 검토를 완료/취소/반려 처리해 주시거나 수정 가능 상태로 열어달라는 내용입니다. 회신은 kongncompany@naver.com 로 부탁드립니다.
```

## Review Notes

- All personal data is processed locally in the miniapp.
- The default state is memory only.
- Device storage is used only when the user taps `임시저장`.
- PDF generation runs on-device from the in-app document preview.
- The final candidate requests no Apps in Toss permissions.
- No Toss Login, payment, analytics SDK, server storage, or external ad network is used.
- HomeTax guidance is provided inside the app. The feature does not depend on an external link to complete the calculation and document-prep flow.
- As of `2026-06-13 KST`, the user requested reverting the Apps in Toss miniapp to the original calculator direction and resubmitting despite the `2026-06-12 KST` ChannelTalk policy risk. Do not disguise the feature as information-only if the calculator is submitted; Console copy, screenshots, release notes, and in-app feature text must accurately describe it as a reference gift-tax estimate and must clearly say it is not automatic filing, tax agency work, confirmed tax, HomeTax login/submission, or server storage.
