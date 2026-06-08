import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateGiftTax, calculateValuation } from "../src/tax.js";
import { renderDocumentPack } from "../src/documents.js";

function buildDocumentPack(overrides = {}) {
  const input = {
    donorName: "공평근",
    donorId: "900101-1",
    donorAddress: "서울특별시 강남구 테헤란로 1",
    donorPhone: "010-1234-5678",
    recipientName: "공아기",
    recipientId: "240101-3",
    recipientAddress: "서울특별시 강남구 테헤란로 1",
    guardianName: "공평근",
    taxOffice: "용산세무서",
    giftDate: "2026-06-01",
    firstPaymentDate: "2026-06-01",
    giftMode: "periodic",
    lumpSumAmount: 0,
    monthlyAmount: 200_000,
    totalMonths: 120,
    priorSameDonorGiftValue: 0,
    priorDeductionUsed: 0,
    priorGiftTaxPaid: 0,
    recipientHasAccount: "yes",
    accountReady: true,
    relationshipType: "parent_minor_child",
    ...overrides
  };
  const valuation = calculateValuation(input);
  const tax = calculateGiftTax(input, valuation);
  return renderDocumentPack({ input, valuation, tax, errors: [], warnings: [] });
}

describe("문서 출력", () => {
  it("현금 일시증여 평가명세서에는 유기정기금 현재가치 평가라고 쓰지 않는다", () => {
    const html = buildDocumentPack({
      giftMode: "lump_sum",
      lumpSumAmount: 20_500_000,
      monthlyAmount: 0,
      totalMonths: 0
    });

    assert.match(html, /<tr><th>평가방법<\/th><td>현금 일시증여 평가<\/td><\/tr>/);
    assert.doesNotMatch(html, /<tr><th>평가방법<\/th><td>유기정기금 현재가치 평가<\/td><\/tr>/);
  });

  it("정기증여 평가명세서에는 유기정기금 현재가치 평가라고 쓴다", () => {
    const html = buildDocumentPack();

    assert.match(html, /<tr><th>평가방법<\/th><td>유기정기금 현재가치 평가<\/td><\/tr>/);
  });
});
