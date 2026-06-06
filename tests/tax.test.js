import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateFilingDeadline,
  calculateGiftTax,
  calculateValuation,
  getSafeAssessmentLimit,
  validateGiftInput
} from "../src/tax.js";

const fixedToday = new Date("2026-06-06T00:00:00+09:00");

describe("유기정기금 평가", () => {
  it("월 200,000원씩 120개월 평가액을 계산한다", () => {
    const valuation = calculateValuation({
      giftDate: "2026-06-01",
      firstPaymentDate: "2026-06-01",
      monthlyAmount: 200_000,
      totalMonths: 120
    });

    assert.equal(valuation.assessedValue, 20_224_034);
    assert.equal(valuation.capApplied, false);
    assert.equal(valuation.schedule[0].paymentYear, 2026);
    assert.equal(valuation.schedule[0].months, 7);
    assert.equal(valuation.schedule.at(-1).paymentYear, 2036);
    assert.equal(valuation.schedule.at(-1).months, 5);
  });

  it("월 250,000원씩 120개월 평가액을 계산한다", () => {
    const valuation = calculateValuation({
      giftDate: "2026-06-01",
      firstPaymentDate: "2026-06-01",
      monthlyAmount: 250_000,
      totalMonths: 120
    });

    assert.equal(valuation.assessedValue, 25_280_042);
  });

  it("장기 계약은 1년분 정기금액의 20배 상한을 적용한다", () => {
    const valuation = calculateValuation({
      giftDate: "2026-06-01",
      firstPaymentDate: "2026-06-01",
      monthlyAmount: 100_000,
      totalMonths: 600
    });

    assert.equal(valuation.assessedValue, 24_000_000);
    assert.equal(valuation.capApplied, true);
  });

  it("수령액을 달력상 각 연도별로 묶는다", () => {
    const valuation = calculateValuation({
      giftDate: "2026-06-01",
      firstPaymentDate: "2026-06-01",
      monthlyAmount: 100_000,
      totalMonths: 14
    });

    assert.equal(valuation.schedule.length, 2);
    assert.equal(valuation.schedule[0].paymentYear, 2026);
    assert.equal(valuation.schedule[0].months, 7);
    assert.equal(valuation.schedule[1].paymentYear, 2027);
    assert.equal(valuation.schedule[1].months, 7);
  });
});

describe("증여세 계산", () => {
  it("미성년 자녀 공제와 과세최저한을 반영한다", () => {
    const valuation = { assessedValue: 20_400_000 };
    const tax = calculateGiftTax(
      {
        giftDate: "2026-06-01",
        firstPaymentDate: "2026-06-01",
        monthlyAmount: 1,
        totalMonths: 1
      },
      valuation,
      fixedToday
    );

    assert.equal(tax.deductionApplied, 20_000_000);
    assert.equal(tax.taxBase, 400_000);
    assert.equal(tax.minimumRuleApplied, true);
    assert.equal(tax.payableTax, 0);
  });

  it("누진세율, 기납부세액공제, 신고세액공제를 계산한다", () => {
    const valuation = { assessedValue: 600_000_000 };
    const tax = calculateGiftTax(
      {
        giftDate: "2026-06-01",
        firstPaymentDate: "2026-06-01",
        monthlyAmount: 1,
        totalMonths: 1,
        priorGiftTaxPaid: 10_000_000
      },
      valuation,
      fixedToday
    );

    assert.equal(tax.taxBase, 580_000_000);
    assert.equal(tax.rate, 0.3);
    assert.equal(tax.progressiveDeduction, 60_000_000);
    assert.equal(tax.calculatedTax, 114_000_000);
    assert.equal(tax.priorTaxCredit, 10_000_000);
    assert.equal(tax.filingCredit, 3_120_000);
    assert.equal(tax.payableTax, 100_880_000);
  });

  it("최근 10년 동일인 증여가산은 1천만원 이상만 반영한다", () => {
    const smallPrior = calculateGiftTax(
      {
        giftDate: "2026-06-01",
        firstPaymentDate: "2026-06-01",
        monthlyAmount: 1,
        totalMonths: 1,
        priorSameDonorGiftValue: 9_999_999
      },
      { assessedValue: 30_000_000 },
      fixedToday
    );
    const aggregatedPrior = calculateGiftTax(
      {
        giftDate: "2026-06-01",
        firstPaymentDate: "2026-06-01",
        monthlyAmount: 1,
        totalMonths: 1,
        priorSameDonorGiftValue: 10_000_000
      },
      { assessedValue: 30_000_000 },
      fixedToday
    );

    assert.equal(smallPrior.aggregatedPriorGiftValue, 0);
    assert.equal(aggregatedPrior.aggregatedPriorGiftValue, 10_000_000);
  });

  it("성년 자녀가 부모에게 증여하면 직계존속 공제 5천만원을 적용한다", () => {
    const tax = calculateGiftTax(
      {
        relationshipType: "adult_child_parent",
        giftDate: "2026-06-01",
        firstPaymentDate: "2026-06-01",
        monthlyAmount: 1,
        totalMonths: 1
      },
      { assessedValue: 50_400_000 },
      fixedToday
    );

    assert.equal(tax.availableDeduction, 50_000_000);
    assert.equal(tax.taxBase, 400_000);
    assert.equal(tax.payableTax, 0);
  });

  it("조부모가 손자녀에게 증여하면 세대생략 할증세액을 반영한다", () => {
    const tax = calculateGiftTax(
      {
        relationshipType: "grandparent_adult_grandchild",
        giftDate: "2026-06-01",
        firstPaymentDate: "2026-06-01",
        monthlyAmount: 1,
        totalMonths: 1
      },
      { assessedValue: 100_000_000 },
      fixedToday
    );

    assert.equal(tax.taxBase, 50_000_000);
    assert.equal(tax.calculatedTax, 5_000_000);
    assert.equal(tax.generationSkippingTax, 1_500_000);
    assert.equal(tax.payableTax, 6_305_000);
  });

  it("관계별 안전 기준 금액을 계산한다", () => {
    assert.equal(getSafeAssessmentLimit({ relationshipType: "parent_minor_child" }), 20_500_000);
    assert.equal(getSafeAssessmentLimit({ relationshipType: "adult_child_parent" }), 50_500_000);
  });
});

describe("신고기한과 검증", () => {
  it("증여월 말일부터 3개월 뒤 날짜를 신고기한으로 계산한다", () => {
    assert.equal(calculateFilingDeadline("2026-03-15"), "2026-06-30");
  });

  it("신고기한이 주말이면 다음 월요일로 보정한다", () => {
    assert.equal(calculateFilingDeadline("2026-07-10"), "2026-11-02");
  });

  it("필수 입력 누락을 검증한다", () => {
    const validation = validateGiftInput({
      giftDate: "2026-06-01",
      firstPaymentDate: "2026-06-01",
      monthlyAmount: 200_000,
      totalMonths: 120
    });

    assert.equal(validation.errors.includes("증여자 성명을 입력하세요."), true);
    assert.equal(validation.errors.includes("수증자 성명을 입력하세요."), true);
  });
});
