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

`우리 아기 증여 도우미`는 아이에게 현금을 보내기 전 증여금액, 관계, 최근 10년 동일인 증여 이력을 입력해 참고용 예상 증여세, 신고기한, 홈택스 입력 순서, 신고 준비 PDF를 확인하는 미니앱입니다. 일시 현금 증여와 매월 정기 증여를 모두 지원하며, 계산 로직은 공개 웹앱과 같은 엔진을 사용합니다. 자동 신고, 세무 대리, 확정 세액 보증, 홈택스 로그인/제출, 서버 저장은 제공하지 않습니다.

## In-App Feature

- Korean feature name: `증여세 계산`
- English feature name: `Gift tax estimate`
- Path: `/`
- Description: 증여 관계와 금액을 입력해 참고용 예상 증여세, 신고기한, 홈택스 입력 순서, PDF 준비자료를 확인합니다.

## Release Notes

계산기 복원 후보입니다. 현금 일시증여와 매월 정기증여의 평가액, 참고용 예상 증여세, 신고기한, 홈택스 준비 순서, PDF 저장을 제공합니다. 자동 신고, 세무 대리, 확정 세액 보증, 홈택스 자동 제출, 서버 저장은 지원하지 않습니다.

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
./node_modules/.bin/ait deploy --api-key "$AITS_CONSOLE_API_KEY" --location ./baby-gift-tax-helper.ait -m "계산기 복원 후보: 현금 일시증여와 매월 정기증여의 평가액, 예상 증여세, 신고기한, 홈택스 준비 순서, PDF 저장을 제공합니다. 자동 신고, 세무 대리, 확정 세액 보증, 서버 저장은 지원하지 않습니다."
```

## Uploaded Candidate

- Uploaded at: `2026-06-10 KST`
- Deployment scheme: `intoss-private://baby-gift-tax-helper?_deploymentId=019eaf09-214e-7d28-95f2-8a023568ea63`
- Temporary Console API key names used during upload: `codexupload0610`, `codexux0610`, `codexpdf0610`
- Cleanup: revoke or delete all temporary keys in the Apps in Toss Console after verifying the candidate.

## Latest Restored Calculator Candidate

- Uploaded at: `2026-06-13 KST`
- Deployment scheme: `intoss-private://baby-gift-tax-helper?_deploymentId=019ec152-19e3-76a8-bc3c-39ae750a7583`
- Upload memo: `계산기 복원 후보: 현금 일시증여와 매월 정기증여의 평가액, 예상 증여세, 신고기한, 홈택스 준비 순서, PDF 저장을 제공합니다. 자동 신고, 세무 대리, 확정 세액 보증, 서버 저장은 지원하지 않습니다.`
- Cleanup: revoke or delete the one-time Console API key after verifying the candidate and finishing review submission.

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
- Latest uploaded build before policy correction: `20260610-4`.
- Build review is not submitted yet. The restored calculator candidate was uploaded on `2026-06-13 KST`; Console lists the latest build as `20260613-6`.
- Calculation restore on `2026-06-13 KST`: the user decided to challenge the tax-calculator rejection because other Apps in Toss tax calculators appear to be listed. The Apps in Toss miniapp was restored to a calculator experience using the shared `src/tax.js` engine. New local `.ait` build completed, new calculator thumbnail/screenshots were generated, and the restored calculator candidate was uploaded as `intoss-private://baby-gift-tax-helper?_deploymentId=019ec152-19e3-76a8-bc3c-39ae750a7583`. Review risk remains because ChannelTalk previously said tax calculators are not currently allowed regardless of type.
- Console state on `2026-06-14 KST`: the user restored the Chrome login session. The app info page still showed `검토 중이에요. 결과는 영업일 기준 2일 내 이메일로 알려드릴게요.` with the prior information-only copy visible and no edit/cancel action. On the App Release page, build `20260613-6` was visible, the Console push test was sent successfully, and `검토 요청` was enabled, but clicking it showed `앱 정보 검토를 먼저 완료해 주세요`. Build review cannot be submitted until Apps in Toss finishes, cancels, or rejects the pending app-info review.
- ChannelTalk blocker follow-up on `2026-06-14 KST`: after the release-review block, the agent opened the support widget, selected `미니앱 관련 문의` > `앱 출시 문의` > `상담원 연결`, submitted partner `SOULIB` and miniapp `우리 아기 증여 도우미`, then sent a message requesting app-info cancellation/rejection/unlock or release-review enablement. The message explicitly asked for replies to `kongncompany@naver.com`.
- Mac/device test environment on `2026-06-13 KST`: official sandbox testing was checked. This Mac has only Command Line Tools, not full Xcode/Simulator (`xcrun simctl` unavailable), and Android `adb` is not installed. Opening the `intoss-private://` scheme on macOS fails because no Toss protocol handler is installed. Therefore the remaining real Toss app/sandbox execution needs a logged-in mobile Toss app, iOS Simulator with the sandbox app installed, or Android device/emulator with `adb`.
- Local automated WebView QA passed on `2026-06-13 KST` against `http://127.0.0.1:5173/` in headless Chrome at 390px: one-time 10,000,000 KRW sample showed `예상 납부세액 0원`, one-time 50,000,000 KRW sample showed `2,910,000원`, no horizontal overflow was detected, PDF preview contained `증여세 신고 준비`, PDF save fallback showed `PDF 저장을 열었어요.`, and no browser console errors were captured.
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

## Review Notes

- All personal data is processed locally in the miniapp.
- The default state is memory only.
- Device storage is used only when the user taps `임시저장`.
- PDF generation runs on-device from the in-app document preview.
- The final candidate requests no Apps in Toss permissions.
- No Toss Login, payment, analytics SDK, server storage, or external ad network is used.
- HomeTax guidance is provided inside the app. The feature does not depend on an external link to complete the calculation and document-prep flow.
- As of `2026-06-13 KST`, the user requested reverting the Apps in Toss miniapp to the original calculator direction and resubmitting despite the `2026-06-12 KST` ChannelTalk policy risk. Do not disguise the feature as information-only if the calculator is submitted; Console copy, screenshots, release notes, and in-app feature text must accurately describe it as a reference gift-tax estimate and must clearly say it is not automatic filing, tax agency work, confirmed tax, HomeTax login/submission, or server storage.
