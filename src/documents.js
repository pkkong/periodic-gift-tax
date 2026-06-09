import {
  ANNUAL_DISCOUNT_RATE,
  LAW_BASIS_DATE,
  PRIOR_GIFT_AGGREGATION_THRESHOLD,
  TAXABLE_MINIMUM,
  formatKoreanDate,
  formatWon
} from "./tax.js?v=37";

/**
 * @typedef {Object} DocumentContext
 * @property {import("./tax.js").GiftInput} input
 * @property {import("./tax.js").ValuationResult} valuation
 * @property {import("./tax.js").TaxResult} tax
 * @property {string[]} errors
 * @property {string[]} warnings
 */

export function renderDocumentPack(context) {
  const { input, valuation, tax, errors, warnings } = context;
  const hasIssues = errors.length || warnings.length;

  return `
    <article class="print-pack" aria-label="증여세 신고 서류팩">
      ${renderCover(input, tax, hasIssues)}
      ${input.giftMode === "lump_sum" ? renderCashStatement(input, valuation) : renderValuationStatement(input, valuation)}
      ${renderGiftTaxDraft(input, valuation, tax)}
      ${renderPropertyStatement(input, valuation, tax)}
      ${input.giftMode === "lump_sum" ? renderCashAgreement(input, valuation) : renderAgreement(input, valuation)}
    </article>
  `;
}

function renderCover(input, tax, hasIssues) {
  return `
    <section class="print-page">
      <h2>${input.giftMode === "lump_sum" ? "현금 증여 신고 서류팩" : "유기정기금 증여 신고 서류팩"}</h2>
      <table class="doc-table">
        <tbody>
          <tr><th>증여자</th><td>${escapeHtml(input.donorName) || blank()}</td></tr>
          <tr><th>수증자</th><td>${escapeHtml(input.recipientName) || blank()}</td></tr>
          <tr><th>증여일</th><td>${formatKoreanDate(input.giftDate) || blank()}</td></tr>
          <tr><th>신고기한</th><td>${formatKoreanDate(tax.filingDeadline) || blank()}</td></tr>
          <tr><th>관할세무서</th><td>${escapeHtml(input.taxOffice) || blank()}</td></tr>
          <tr><th>작성 기준</th><td>${LAW_BASIS_DATE}</td></tr>
          <tr><th>검토 상태</th><td>${hasIssues ? "입력값 확인 필요" : "입력값 기준 작성"}</td></tr>
        </tbody>
      </table>
      <p class="doc-footnote">
        이 서류팩은 홈택스 신고 보조용 초안입니다. 실제 제출 전 홈택스 화면의 최신 서식, 관할 세무서 안내,
        가족관계 및 10년 내 증여 내역을 확인해야 합니다.
      </p>
    </section>
  `;
}

function renderValuationStatement(input, valuation) {
  const rows = valuation.schedule
    .map(
      (row) => `
        <tr>
          <td>${row.paymentYear}년</td>
          <td>${formatKoreanDate(row.periodStartDate)} ~ ${formatKoreanDate(row.periodEndDate)}</td>
          <td>${row.months}개월</td>
          <td>${formatWon(row.periodPayment)}</td>
          <td>${formatDiscount(row)}</td>
          <td>${formatWon(row.presentValue)}</td>
        </tr>
      `
    )
    .join("");

  return `
    <section class="print-page valuation-page">
      <h2>유기정기금 평가명세서</h2>
      <table class="doc-table valuation-summary">
        <tbody>
          <tr><th>평가대상 권리</th><td>매월 고정액을 받을 유기정기금 권리</td></tr>
          <tr><th>월 납입액</th><td>${formatWon(input.monthlyAmount)}</td></tr>
          <tr><th>납입기간</th><td>${input.totalMonths.toLocaleString("ko-KR")}개월 (${formatKoreanDate(input.firstPaymentDate)} ~ ${formatKoreanDate(valuation.paymentEndDate)})</td></tr>
          <tr><th>총 약정 납입액</th><td>${formatWon(valuation.totalPayments)}</td></tr>
          <tr><th>적용 이자율</th><td>${(ANNUAL_DISCOUNT_RATE * 100).toFixed(1)}%</td></tr>
          <tr><th>현재가치 합계</th><td>${formatWon(valuation.presentValueRounded)}</td></tr>
          <tr><th>20배 상한</th><td>${formatWon(valuation.capValue)}</td></tr>
          <tr><th>증여재산 평가액</th><td><strong>${formatWon(valuation.assessedValue)}</strong>${valuation.capApplied ? " (상한 적용)" : ""}</td></tr>
        </tbody>
      </table>
      <table class="doc-table valuation-schedule">
        <thead>
          <tr>
            <th>수령연도</th>
            <th>수령기간</th>
            <th>개월</th>
            <th>수령액</th>
            <th>경과연수</th>
            <th>현재가치</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="doc-footnote">
        산식: 수령연도별 수령금액 / (1 + ${(ANNUAL_DISCOUNT_RATE * 100).toFixed(1)}%)^평가기준일부터의 경과연수.
        1년 미만 경과기간에 지급받는 금액은 경과연수 0년으로 보아 할인하지 않습니다.
        현재가치 합계와 1년분 정기금액의 20배 중 작은 금액을 평가액으로 기재합니다.
      </p>
    </section>
  `;
}

function renderCashStatement(input, valuation) {
  return `
    <section class="print-page">
      <h2>현금 증여 명세서</h2>
      <table class="doc-table">
        <tbody>
          <tr><th>증여재산</th><td>현금</td></tr>
          <tr><th>증여일</th><td>${formatKoreanDate(input.giftDate) || blank()}</td></tr>
          <tr><th>증여금액</th><td>${formatWon(input.lumpSumAmount)}</td></tr>
          <tr><th>증여재산 평가액</th><td><strong>${formatWon(valuation.assessedValue)}</strong></td></tr>
        </tbody>
      </table>
      <p class="doc-footnote">
        현금 일시증여는 현재가치 할인 대상 유기정기금이 아니므로 증여일의 현금 증여금액을 평가액으로 정리합니다.
      </p>
    </section>
  `;
}

function formatDiscount(row) {
  if (row.yearOffset === 0) return "0년 (할인 없음)";
  return `${row.yearOffset}년 (${row.discountFactor.toFixed(6)})`;
}

function renderGiftTaxDraft(input, valuation, tax) {
  return `
    <section class="print-page">
      <h2>증여세 과세표준신고 및 자진납부계산서 초안</h2>
      <table class="doc-table">
        <tbody>
          <tr><th>증여자 성명/주민등록번호</th><td>${personLine(input.donorName, input.donorId)}</td></tr>
          <tr><th>증여자 주소/연락처</th><td>${escapeHtml(input.donorAddress) || blank()} / ${escapeHtml(input.donorPhone) || blank()}</td></tr>
          <tr><th>수증자 성명/주민등록번호</th><td>${personLine(input.recipientName, input.recipientId)}</td></tr>
          <tr><th>수증자 주소</th><td>${escapeHtml(input.recipientAddress) || blank()}</td></tr>
          <tr><th>관계</th><td>${escapeHtml(tax.relationshipLabel)}</td></tr>
          <tr><th>증여일</th><td>${formatKoreanDate(input.giftDate) || blank()}</td></tr>
          <tr><th>증여재산가액</th><td>${formatWon(valuation.assessedValue)}</td></tr>
          <tr><th>동일인 증여가산액</th><td>${formatWon(tax.aggregatedPriorGiftValue)}</td></tr>
          <tr><th>증여세 과세가액</th><td>${formatWon(tax.taxableGiftValue)}</td></tr>
          <tr><th>증여재산공제</th><td>${formatWon(tax.deductionApplied)} / 사용 가능 ${formatWon(tax.availableDeduction)}</td></tr>
          <tr><th>과세표준</th><td>${formatWon(tax.taxBase)}</td></tr>
          <tr><th>세율 및 누진공제</th><td>${(tax.rate * 100).toFixed(0)}%, ${formatWon(tax.progressiveDeduction)}</td></tr>
          <tr><th>산출세액</th><td>${formatWon(tax.calculatedTax)}${tax.minimumRuleApplied ? ` (과세표준 ${formatWon(TAXABLE_MINIMUM)} 미만)` : ""}</td></tr>
          <tr><th>세대생략 할증세액</th><td>${formatWon(tax.generationSkippingTax)}${tax.generationSkippingRate > 0 ? ` (${(tax.generationSkippingRate * 100).toFixed(0)}%)` : ""}</td></tr>
          <tr><th>기납부세액공제</th><td>${formatWon(tax.priorTaxCredit)}</td></tr>
          <tr><th>신고세액공제</th><td>${formatWon(tax.filingCredit)}${tax.filingCreditApplied ? "" : " (신고기한 경과)"}</td></tr>
          <tr><th>납부할 세액</th><td><strong>${formatWon(tax.payableTax)}</strong></td></tr>
        </tbody>
      </table>
      <p class="doc-footnote">
        최근 10년 내 동일인 증여가산은 입력액이 ${formatWon(PRIOR_GIFT_AGGREGATION_THRESHOLD)} 이상인 경우 반영했습니다.
      </p>
    </section>
  `;
}

function renderPropertyStatement(input, valuation, tax) {
  const valuationMethod = input.giftMode === "lump_sum"
    ? "현금 일시증여 평가"
    : "유기정기금 현재가치 평가";

  return `
    <section class="print-page">
      <h2>증여재산 및 평가명세서 초안</h2>
      <table class="doc-table">
        <tbody>
          <tr><th>재산 종류</th><td>${input.giftMode === "lump_sum" ? "현금" : "그 밖의 재산권 - 유기정기금 수급권"}</td></tr>
          <tr><th>소재지/내용</th><td>${input.giftMode === "lump_sum" ? `${formatWon(input.lumpSumAmount)} 현금 증여` : `매월 ${formatWon(input.monthlyAmount)}씩 ${input.totalMonths.toLocaleString("ko-KR")}개월 지급받을 권리`}</td></tr>
          <tr><th>취득 원인</th><td>증여</td></tr>
          <tr><th>평가기준일</th><td>${formatKoreanDate(input.giftDate) || blank()}</td></tr>
          <tr><th>평가방법</th><td>${valuationMethod}</td></tr>
          <tr><th>평가액</th><td>${formatWon(valuation.assessedValue)}</td></tr>
          <tr><th>공제 후 과세표준</th><td>${formatWon(tax.taxBase)}</td></tr>
        </tbody>
      </table>
      <p class="doc-footnote">
        홈택스 입력 시 재산구분과 세부 항목명은 화면에 표시되는 최신 항목명에 맞춰 선택합니다.
      </p>
    </section>
  `;
}

function renderAgreement(input, valuation) {
  return `
    <section class="print-page">
      <h2>유기정기금 증여약정서</h2>
      <table class="doc-table">
        <tbody>
          <tr><th>증여자</th><td>${personLine(input.donorName, input.donorId)}</td></tr>
          <tr><th>수증자</th><td>${personLine(input.recipientName, input.recipientId)}</td></tr>
          <tr><th>법정대리인</th><td>${escapeHtml(input.guardianName || input.donorName) || blank()}</td></tr>
          <tr><th>약정일</th><td>${formatKoreanDate(input.giftDate) || blank()}</td></tr>
          <tr><th>지급 조건</th><td>${formatKoreanDate(input.firstPaymentDate)}부터 ${formatKoreanDate(valuation.paymentEndDate)}까지 매월 ${formatWon(input.monthlyAmount)} 지급</td></tr>
          <tr><th>총 지급액</th><td>${formatWon(valuation.totalPayments)}</td></tr>
          <tr><th>평가액</th><td>${formatWon(valuation.assessedValue)}</td></tr>
        </tbody>
      </table>
      <p>
        증여자는 위 조건에 따라 수증자에게 유기정기금 수급권을 증여하고, 수증자는 이를 수락한다.
        각 지급은 수증자 명의 계좌로 이체하며, 이체 내역은 증여세 신고 및 사후 소명자료로 보관한다.
      </p>
      <div class="signature-line">
        <span>증여자: ${escapeHtml(input.donorName) || blank()} (서명)</span>
        <span>법정대리인: ${escapeHtml(input.guardianName || input.donorName) || blank()} (서명)</span>
      </div>
    </section>
  `;
}

function renderCashAgreement(input, valuation) {
  return `
    <section class="print-page">
      <h2>현금 증여 확인서</h2>
      <table class="doc-table">
        <tbody>
          <tr><th>증여자</th><td>${personLine(input.donorName, input.donorId)}</td></tr>
          <tr><th>수증자</th><td>${personLine(input.recipientName, input.recipientId)}</td></tr>
          <tr><th>법정대리인</th><td>${escapeHtml(input.guardianName || input.donorName) || blank()}</td></tr>
          <tr><th>증여일</th><td>${formatKoreanDate(input.giftDate) || blank()}</td></tr>
          <tr><th>증여금액</th><td>${formatWon(valuation.assessedValue)}</td></tr>
        </tbody>
      </table>
      <p>
        증여자는 위 현금을 수증자에게 증여하고, 수증자는 이를 수락한다. 이체 내역은 증여세 신고 및 사후 소명자료로 보관한다.
      </p>
      <div class="signature-line">
        <span>증여자: ${escapeHtml(input.donorName) || blank()} (서명)</span>
        <span>법정대리인: ${escapeHtml(input.guardianName || input.donorName) || blank()} (서명)</span>
      </div>
    </section>
  `;
}

function personLine(name, id) {
  return `${escapeHtml(name) || blank()} / ${escapeHtml(id) || blank()}`;
}

function blank() {
  return "________________";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
