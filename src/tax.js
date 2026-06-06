/**
 * @typedef {Object} GiftInput
 * @property {string} donorName
 * @property {string} donorId
 * @property {string} donorAddress
 * @property {string} donorPhone
 * @property {string} recipientName
 * @property {string} recipientId
 * @property {string} recipientAddress
 * @property {string} guardianName
 * @property {string} taxOffice
 * @property {string} giftDate
 * @property {string} firstPaymentDate
 * @property {number} monthlyAmount
 * @property {number} totalMonths
 * @property {number} priorSameDonorGiftValue
 * @property {number} priorDeductionUsed
 * @property {number} priorGiftTaxPaid
 * @property {string} recipientHasAccount
 * @property {boolean} accountReady
 * @property {string} relationshipType
 */

/**
 * @typedef {Object} GiftScheduleRow
 * @property {number} paymentYear
 * @property {number} yearOffset
 * @property {string} periodStartDate
 * @property {string} periodEndDate
 * @property {number} months
 * @property {number} periodPayment
 * @property {number} discountFactor
 * @property {number} presentValue
 */

/**
 * @typedef {Object} ValuationResult
 * @property {GiftScheduleRow[]} schedule
 * @property {number} presentValue
 * @property {number} presentValueRounded
 * @property {number} capValue
 * @property {number} assessedValue
 * @property {boolean} capApplied
 * @property {number} totalPayments
 * @property {string} paymentEndDate
 */

/**
 * @typedef {Object} TaxResult
 * @property {number} currentGiftValue
 * @property {number} aggregatedPriorGiftValue
 * @property {number} taxableGiftValue
 * @property {number} availableDeduction
 * @property {number} deductionApplied
 * @property {number} taxBase
 * @property {number} taxBeforeMinimumRule
 * @property {number} calculatedTax
 * @property {number} priorTaxCredit
 * @property {number} filingCredit
 * @property {number} payableTax
 * @property {number} generationSkippingTax
 * @property {number} generationSkippingRate
 * @property {string} relationshipLabel
 * @property {number} rate
 * @property {number} progressiveDeduction
 * @property {boolean} minimumRuleApplied
 * @property {boolean} filingCreditApplied
 * @property {string} filingDeadline
 */

export const LAW_BASIS_DATE = "2026-06-06";
export const ANNUAL_DISCOUNT_RATE = 0.03;
export const MINOR_CHILD_DEDUCTION = 20_000_000;
export const LINEAL_RELATIVE_DEDUCTION = 50_000_000;
export const PRIOR_GIFT_AGGREGATION_THRESHOLD = 10_000_000;
export const TAXABLE_MINIMUM = 500_000;
export const FILING_CREDIT_RATE = 0.03;
export const HIGH_VALUE_MINOR_GENERATION_SKIP_THRESHOLD = 2_000_000_000;

export const RELATIONSHIP_TYPES = {
  parent_minor_child: {
    label: "부모 -> 미성년 자녀",
    deduction: MINOR_CHILD_DEDUCTION,
    generationSkipping: false,
    minorRecipient: true
  },
  parent_adult_child: {
    label: "부모 -> 성년 자녀",
    deduction: LINEAL_RELATIVE_DEDUCTION,
    generationSkipping: false,
    minorRecipient: false
  },
  adult_child_parent: {
    label: "성년 자녀 -> 부모",
    deduction: LINEAL_RELATIVE_DEDUCTION,
    generationSkipping: false,
    minorRecipient: false
  },
  grandparent_minor_grandchild: {
    label: "조부모 -> 미성년 손자녀",
    deduction: MINOR_CHILD_DEDUCTION,
    generationSkipping: true,
    minorRecipient: true
  },
  grandparent_adult_grandchild: {
    label: "조부모 -> 성년 손자녀",
    deduction: LINEAL_RELATIVE_DEDUCTION,
    generationSkipping: true,
    minorRecipient: false
  }
};

export const TAX_BRACKETS = [
  { limit: 100_000_000, rate: 0.1, deduction: 0 },
  { limit: 500_000_000, rate: 0.2, deduction: 10_000_000 },
  { limit: 1_000_000_000, rate: 0.3, deduction: 60_000_000 },
  { limit: 3_000_000_000, rate: 0.4, deduction: 160_000_000 },
  { limit: Infinity, rate: 0.5, deduction: 460_000_000 }
];

export function normalizeInput(raw = {}) {
  const today = formatDate(new Date());
  return {
    donorName: stringValue(raw.donorName),
    donorId: stringValue(raw.donorId),
    donorAddress: stringValue(raw.donorAddress),
    donorPhone: stringValue(raw.donorPhone),
    recipientName: stringValue(raw.recipientName),
    recipientId: stringValue(raw.recipientId),
    recipientAddress: stringValue(raw.recipientAddress),
    guardianName: stringValue(raw.guardianName),
    taxOffice: stringValue(raw.taxOffice),
    giftDate: stringValue(raw.giftDate) || today,
    firstPaymentDate: stringValue(raw.firstPaymentDate) || stringValue(raw.giftDate) || today,
    monthlyAmount: positiveInteger(raw.monthlyAmount),
    totalMonths: positiveInteger(raw.totalMonths),
    priorSameDonorGiftValue: nonNegativeInteger(raw.priorSameDonorGiftValue),
    priorDeductionUsed: nonNegativeInteger(raw.priorDeductionUsed),
    priorGiftTaxPaid: nonNegativeInteger(raw.priorGiftTaxPaid),
    recipientHasAccount: stringValue(raw.recipientHasAccount) || "yes",
    accountReady: raw.accountReady === true || stringValue(raw.accountReady) === "true" || stringValue(raw.accountReady) === "on",
    relationshipType: RELATIONSHIP_TYPES[stringValue(raw.relationshipType)] ? stringValue(raw.relationshipType) : "parent_minor_child"
  };
}

export function validateGiftInput(input) {
  const normalized = normalizeInput(input);
  const errors = [];
  const warnings = [];

  if (!normalized.donorName) errors.push("증여자 성명을 입력하세요.");
  if (!normalized.recipientName) errors.push("수증자 성명을 입력하세요.");
  if (!isValidDateString(normalized.giftDate)) errors.push("증여일을 올바르게 입력하세요.");
  if (!isValidDateString(normalized.firstPaymentDate)) errors.push("첫 이체일을 올바르게 입력하세요.");
  if (
    isValidDateString(normalized.giftDate) &&
    isValidDateString(normalized.firstPaymentDate) &&
    compareDateStrings(normalized.firstPaymentDate, normalized.giftDate) < 0
  ) {
    errors.push("첫 이체일은 증여일과 같거나 이후여야 합니다.");
  }
  if (normalized.monthlyAmount <= 0) errors.push("월 납입액은 1원 이상이어야 합니다.");
  if (normalized.totalMonths <= 0) errors.push("총 납입개월은 1개월 이상이어야 합니다.");
  if (normalized.totalMonths > 600) warnings.push("총 납입기간이 50년을 초과합니다. 약정 기간을 다시 확인하세요.");
  if (normalized.priorDeductionUsed > MINOR_CHILD_DEDUCTION) warnings.push("이미 사용한 공제액이 미성년 자녀 공제한도 2천만원을 초과합니다.");
  if (normalized.priorSameDonorGiftValue > 0 && normalized.priorSameDonorGiftValue < PRIOR_GIFT_AGGREGATION_THRESHOLD) {
    warnings.push("최근 10년 동일인 증여가산액이 1천만원 미만이면 합산 대상에서 제외됩니다.");
  }

  return { input: normalized, errors, warnings };
}

export function calculateValuation(rawInput) {
  const input = normalizeInput(rawInput);
  const schedule = [];
  let presentValue = 0;
  const paymentEndDate = input.totalMonths > 0 && isValidDateString(input.firstPaymentDate)
    ? addMonths(input.firstPaymentDate, input.totalMonths - 1)
    : "";

  if (input.totalMonths > 0 && isValidDateString(input.firstPaymentDate) && isValidDateString(input.giftDate)) {
    const yearlyPayments = new Map();

    for (let monthIndex = 0; monthIndex < input.totalMonths; monthIndex += 1) {
      const paymentDate = addMonths(input.firstPaymentDate, monthIndex);
      const yearOffset = getValuationYearOffset(input.giftDate, paymentDate);
      const paymentYear = splitDate(paymentDate).year;
      const current = yearlyPayments.get(paymentYear) ?? {
        paymentYear,
        yearOffset,
        periodStartDate: paymentDate,
        periodEndDate: paymentDate,
        months: 0,
        periodPayment: 0
      };
      current.months += 1;
      current.periodPayment += input.monthlyAmount;
      current.periodStartDate = compareDateStrings(paymentDate, current.periodStartDate) < 0 ? paymentDate : current.periodStartDate;
      current.periodEndDate = compareDateStrings(paymentDate, current.periodEndDate) > 0 ? paymentDate : current.periodEndDate;
      yearlyPayments.set(paymentYear, current);
    }

    for (const row of Array.from(yearlyPayments.values()).sort((left, right) => left.paymentYear - right.paymentYear)) {
      const discountFactor = Math.pow(1 + ANNUAL_DISCOUNT_RATE, row.yearOffset);
      const rowPresentValue = row.periodPayment / discountFactor;
      presentValue += rowPresentValue;

      schedule.push({
        paymentYear: row.paymentYear,
        yearOffset: row.yearOffset,
        periodStartDate: row.periodStartDate,
        periodEndDate: row.periodEndDate,
        months: row.months,
        periodPayment: row.periodPayment,
        discountFactor,
        presentValue: rowPresentValue
      });
    }
  }

  const presentValueRounded = Math.floor(presentValue);
  const capValue = input.monthlyAmount * 12 * 20;
  const assessedValue = Math.min(presentValueRounded, capValue);
  return {
    schedule,
    presentValue,
    presentValueRounded,
    capValue,
    assessedValue,
    capApplied: assessedValue < presentValueRounded,
    totalPayments: input.monthlyAmount * input.totalMonths,
    paymentEndDate
  };
}

export function calculateGiftTax(rawInput, valuation = calculateValuation(rawInput), today = new Date()) {
  const input = normalizeInput(rawInput);
  const relationship = getRelationshipConfig(input.relationshipType);
  const aggregatedPriorGiftValue =
    input.priorSameDonorGiftValue >= PRIOR_GIFT_AGGREGATION_THRESHOLD
      ? input.priorSameDonorGiftValue
      : 0;
  const taxableGiftValue = valuation.assessedValue + aggregatedPriorGiftValue;
  const availableDeduction = Math.max(0, relationship.deduction - input.priorDeductionUsed);
  const deductionApplied = Math.min(taxableGiftValue, availableDeduction);
  const taxBase = Math.max(0, taxableGiftValue - deductionApplied);
  const bracket = findBracket(taxBase);
  const taxBeforeMinimumRule = Math.max(0, Math.floor(taxBase * bracket.rate - bracket.deduction));
  const minimumRuleApplied = taxBase < TAXABLE_MINIMUM;
  const calculatedTax = minimumRuleApplied ? 0 : taxBeforeMinimumRule;
  const generationSkippingRate = getGenerationSkippingRate(relationship, taxableGiftValue);
  const generationSkippingTax = Math.floor(calculatedTax * generationSkippingRate);
  const taxWithSurcharge = calculatedTax + generationSkippingTax;
  const priorTaxCredit = Math.min(input.priorGiftTaxPaid, taxWithSurcharge);
  const taxAfterPriorCredit = Math.max(0, taxWithSurcharge - priorTaxCredit);
  const filingDeadline = calculateFilingDeadline(input.giftDate);
  const filingCreditApplied = filingDeadline ? compareDateStrings(formatDate(today), filingDeadline) <= 0 : true;
  const filingCredit = filingCreditApplied ? Math.floor(taxAfterPriorCredit * FILING_CREDIT_RATE) : 0;
  const payableTax = Math.max(0, taxAfterPriorCredit - filingCredit);

  return {
    currentGiftValue: valuation.assessedValue,
    aggregatedPriorGiftValue,
    taxableGiftValue,
    availableDeduction,
    deductionApplied,
    taxBase,
    taxBeforeMinimumRule,
    calculatedTax,
    priorTaxCredit,
    filingCredit,
    payableTax,
    generationSkippingTax,
    generationSkippingRate,
    relationshipLabel: relationship.label,
    rate: bracket.rate,
    progressiveDeduction: bracket.deduction,
    minimumRuleApplied,
    filingCreditApplied,
    filingDeadline
  };
}

export function getRelationshipConfig(relationshipType) {
  return RELATIONSHIP_TYPES[relationshipType] ?? RELATIONSHIP_TYPES.parent_minor_child;
}

export function getSafeAssessmentLimit(rawInput) {
  const input = normalizeInput(rawInput);
  const relationship = getRelationshipConfig(input.relationshipType);
  return Math.max(0, relationship.deduction - input.priorDeductionUsed) + TAXABLE_MINIMUM;
}

function getGenerationSkippingRate(relationship, taxableGiftValue) {
  if (!relationship.generationSkipping) return 0;
  if (relationship.minorRecipient && taxableGiftValue > HIGH_VALUE_MINOR_GENERATION_SKIP_THRESHOLD) return 0.4;
  return 0.3;
}

export function calculateFilingDeadline(giftDate) {
  if (!isValidDateString(giftDate)) return "";
  const endOfGiftMonth = endOfMonth(giftDate);
  let deadline = addMonths(endOfGiftMonth, 3);
  while (isWeekend(deadline)) {
    deadline = addDays(deadline, 1);
  }
  return deadline;
}

export function findBracket(taxBase) {
  return TAX_BRACKETS.find((bracket) => taxBase <= bracket.limit) ?? TAX_BRACKETS.at(-1);
}

export function getValuationYearOffset(giftDate, paymentDate) {
  if (!isValidDateString(giftDate) || !isValidDateString(paymentDate)) return 0;
  if (compareDateStrings(paymentDate, giftDate) < 0) return 0;
  return Math.max(0, splitDate(paymentDate).year - splitDate(giftDate).year);
}

export function formatDate(date) {
  if (date instanceof Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return stringValue(date);
}

export function formatKoreanDate(dateString) {
  if (!isValidDateString(dateString)) return "";
  const { year, month, day } = splitDate(dateString);
  return `${year}년 ${month}월 ${day}일`;
}

export function formatWon(value) {
  return `${Math.round(Number(value) || 0).toLocaleString("ko-KR")}원`;
}

export function addMonths(dateString, monthsToAdd) {
  if (!isValidDateString(dateString)) return "";
  const { year, month, day } = splitDate(dateString);
  const targetMonthIndex = month - 1 + monthsToAdd;
  const targetYear = year + Math.floor(targetMonthIndex / 12);
  const normalizedMonthIndex = ((targetMonthIndex % 12) + 12) % 12;
  const targetMonth = normalizedMonthIndex + 1;
  const lastDay = daysInMonth(targetYear, targetMonth);
  return joinDate(targetYear, targetMonth, Math.min(day, lastDay));
}

export function compareDateStrings(left, right) {
  if (!isValidDateString(left) || !isValidDateString(right)) return 0;
  return left.localeCompare(right);
}

export function isValidDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(stringValue(value))) return false;
  const { year, month, day } = splitDate(value);
  if (month < 1 || month > 12) return false;
  return day >= 1 && day <= daysInMonth(year, month);
}

function endOfMonth(dateString) {
  const { year, month } = splitDate(dateString);
  return joinDate(year, month, daysInMonth(year, month));
}

function addDays(dateString, daysToAdd) {
  const { year, month, day } = splitDate(dateString);
  const date = new Date(Date.UTC(year, month - 1, day + daysToAdd));
  return joinDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

function isWeekend(dateString) {
  const { year, month, day } = splitDate(dateString);
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = date.getUTCDay();
  return weekday === 0 || weekday === 6;
}

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function splitDate(dateString) {
  const [year, month, day] = stringValue(dateString).split("-").map(Number);
  return { year, month, day };
}

function joinDate(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function stringValue(value) {
  return value == null ? "" : String(value).trim();
}

function positiveInteger(value) {
  return Math.max(0, Math.floor(Number(value) || 0));
}

function nonNegativeInteger(value) {
  return Math.max(0, Math.floor(Number(value) || 0));
}
