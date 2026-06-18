import { LAW_BASIS_DATE, formatKoreanDate, formatWon } from "./tax.js";

/**
 * @typedef {Object} DocumentContext
 * @property {import("./tax.js").GiftInput} input
 * @property {import("./tax.js").ValuationResult} valuation
 * @property {import("./tax.js").TaxResult} tax
 * @property {string[]} errors
 * @property {string[]} warnings
 */

export function renderDocumentPack(context) {
  const { input, tax, errors, warnings } = context;
  const hasIssues = errors.length || warnings.length;

  return `
    <article class="print-pack" aria-label="증여 신고 준비 자료">
      ${renderCover(input, tax, hasIssues)}
      ${renderLawMemo(input, tax)}
      ${renderPrepChecklist(input, tax)}
      ${input.giftMode === "periodic" ? renderPeriodicAgreement(input) : renderCashConfirmation(input)}
    </article>
  `;
}

function renderCover(input, tax, hasIssues) {
  return `
    <section class="print-page">
      <h2>증여 신고 준비 체크리스트</h2>
      <table class="doc-table">
        <tbody>
          <tr><th>증여자</th><td>${personLine(input.donorName, input.donorId)}</td></tr>
          <tr><th>수증자</th><td>${personLine(input.recipientName, input.recipientId)}</td></tr>
          <tr><th>관계</th><td>${escapeHtml(tax.relationshipLabel)}</td></tr>
          <tr><th>증여 방식</th><td>${input.giftMode === "periodic" ? "매월 보내기" : "한 번에 보내기"}</td></tr>
          <tr><th>증여 기준일</th><td>${formatKoreanDate(input.giftDate) || blank()}</td></tr>
          <tr><th>신고기한</th><td>${formatKoreanDate(tax.filingDeadline) || blank()}</td></tr>
          <tr><th>관할세무서</th><td>${escapeHtml(input.taxOffice) || blank()}</td></tr>
          <tr><th>작성 기준</th><td>${LAW_BASIS_DATE}</td></tr>
          <tr><th>입력 상태</th><td>${hasIssues ? "입력값 확인 필요" : "입력값 기준 준비"}</td></tr>
        </tbody>
      </table>
      <p class="doc-footnote">
        이 자료는 홈택스 신고를 준비하기 위한 메모와 확인서 초안입니다. 자동 신고, 세무 대리,
        확정 세액 산출 또는 제출용 확정 서식이 아닙니다.
      </p>
    </section>
  `;
}

function renderLawMemo(input, tax) {
  return `
    <section class="print-page">
      <h2>법령 기준 메모</h2>
      <table class="doc-table">
        <tbody>
          <tr>
            <th>기본공제</th>
            <td>
              <strong>${formatWon(tax.availableDeduction)}</strong><br />
              ${escapeHtml(getDeductionLawCopy(input))}
            </td>
          </tr>
          <tr>
            <th>과세표준 50만원 미만</th>
            <td>
              상속세 및 증여세법 제55조 제2항은 과세표준이 50만원 미만이면 증여세를 부과하지 않는다고 정하고 있습니다.
            </td>
          </tr>
          <tr>
            <th>최근 10년 동일인 증여</th>
            <td>
              같은 사람에게 받은 증여는 최근 10년 내 신고 이력과 가족관계 기준을 홈택스에서 다시 확인해야 합니다.
            </td>
          </tr>
          <tr>
            <th>세대생략 유의사항</th>
            <td>
              ${tax.generationSkippingRate > 0
                ? "조부모가 손자녀에게 증여하는 경우 세대생략 할증 여부를 홈택스 또는 전문가에게 확인하세요."
                : "현재 선택한 관계에서는 일반적인 세대생략 할증 대상이 아닌 것으로 안내합니다."}
            </td>
          </tr>
        </tbody>
      </table>
      <p class="doc-footnote">
        법령과 홈택스 화면은 바뀔 수 있으므로 실제 신고 직전 최신 안내를 확인하세요.
      </p>
    </section>
  `;
}

function renderPrepChecklist(input, tax) {
  const preparedItems = [
    "증여자와 수증자 기본정보",
    "기본공제와 과세최저한 근거 메모",
    input.giftMode === "periodic" ? "정기증여 약정서 초안" : "현금 증여 확인서 초안",
    tax.filingDeadline ? `${formatKoreanDate(tax.filingDeadline)} 신고기한 메모` : "신고기한 확인 메모"
  ];
  const neededItems = [
    "가족관계증명서 또는 기본증명서",
    "홈택스 제출에 필요한 전체 주민등록번호",
    "수증자 명의 계좌와 이체확인증",
    "최근 10년 동일인 증여 신고 이력",
    "홈택스 산출 화면의 최종 확인 결과"
  ];

  return `
    <section class="print-page">
      <h2>홈택스 입력 전 준비물</h2>
      <h3>이 앱에서 정리한 것</h3>
      <ol class="checklist">${preparedItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>
      <h3>직접 발급하거나 확인할 것</h3>
      <ol class="checklist">${neededItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>
      <p class="doc-footnote">
        홈택스 입력 시 증여재산 종류, 실제 이체일, 공제 적용 여부, 제출 전 산출 결과를 직접 대조하세요.
      </p>
    </section>
  `;
}

function renderPeriodicAgreement(input) {
  return `
    <section class="print-page">
      <h2>정기증여 약정서 초안</h2>
      <table class="doc-table">
        <tbody>
          <tr><th>증여자</th><td>${personLine(input.donorName, input.donorId)}</td></tr>
          <tr><th>수증자</th><td>${personLine(input.recipientName, input.recipientId)}</td></tr>
          <tr><th>법정대리인</th><td>${escapeHtml(input.guardianName || input.donorName) || blank()}</td></tr>
          <tr><th>약정일</th><td>${formatKoreanDate(input.giftDate) || blank()}</td></tr>
          <tr><th>지급 방식</th><td>수증자 명의 계좌로 매월 같은 방식으로 이체</td></tr>
          <tr><th>월 지급액</th><td>직접 기재: ____________________ 원</td></tr>
          <tr><th>지급 기간</th><td>직접 기재: ________년 ____월부터 ________년 ____월까지</td></tr>
        </tbody>
      </table>
      <p>
        증여자는 위 조건에 따라 수증자에게 정기적으로 현금을 증여하고, 수증자 또는 법정대리인은 이를 확인합니다.
        각 이체내역은 홈택스 신고 및 사후 확인자료로 보관합니다.
      </p>
      <div class="signature-line">
        <span>증여자: ${escapeHtml(input.donorName) || blank()} (서명)</span>
        <span>법정대리인: ${escapeHtml(input.guardianName || input.donorName) || blank()} (서명)</span>
      </div>
    </section>
  `;
}

function renderCashConfirmation(input) {
  return `
    <section class="print-page">
      <h2>현금 증여 확인서 초안</h2>
      <table class="doc-table">
        <tbody>
          <tr><th>증여자</th><td>${personLine(input.donorName, input.donorId)}</td></tr>
          <tr><th>수증자</th><td>${personLine(input.recipientName, input.recipientId)}</td></tr>
          <tr><th>법정대리인</th><td>${escapeHtml(input.guardianName || input.donorName) || blank()}</td></tr>
          <tr><th>증여일</th><td>${formatKoreanDate(input.giftDate) || blank()}</td></tr>
          <tr><th>증여금액</th><td>직접 기재: ____________________ 원</td></tr>
          <tr><th>이체 계좌</th><td>수증자 명의 계좌 정보를 직접 기재</td></tr>
        </tbody>
      </table>
      <p>
        증여자는 위 현금을 수증자에게 증여하고, 수증자 또는 법정대리인은 이를 확인합니다.
        실제 이체확인증과 함께 보관합니다.
      </p>
      <div class="signature-line">
        <span>증여자: ${escapeHtml(input.donorName) || blank()} (서명)</span>
        <span>법정대리인: ${escapeHtml(input.guardianName || input.donorName) || blank()} (서명)</span>
      </div>
    </section>
  `;
}

function getDeductionLawCopy(input) {
  if (input.relationshipType === "parent_minor_child" || input.relationshipType === "grandparent_minor_grandchild") {
    return "상속세 및 증여세법 제53조 제2호: 직계존속에게 증여받는 경우 5천만원을 공제하되, 수증자가 미성년자이면 2천만원을 공제합니다.";
  }
  if (input.relationshipType === "parent_adult_child" || input.relationshipType === "grandparent_adult_grandchild") {
    return "상속세 및 증여세법 제53조 제2호: 직계존속에게 증여받는 경우 5천만원을 공제합니다.";
  }
  if (input.relationshipType === "adult_child_parent") {
    return "상속세 및 증여세법 제53조 제3호: 직계비속에게 증여받는 경우 5천만원을 공제합니다.";
  }
  return "상속세 및 증여세법 제53조: 증여자와 수증자의 관계별 증여재산공제 한도를 정합니다.";
}

function personLine(name, residentId) {
  const safeName = escapeHtml(name) || blank();
  const id = escapeHtml(residentId) || blank();
  return `${safeName} / ${id}`;
}

function blank() {
  return '<span class="blank-line"></span>';
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
