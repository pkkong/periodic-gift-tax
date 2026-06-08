import {
  calculateGiftTax,
  calculateValuation,
  formatDate,
  formatKoreanDate,
  formatWon,
  getSafeAssessmentLimit,
  normalizeInput,
  validateGiftInput
} from "./tax.js?v=30";
import { renderDocumentPack } from "./documents.js?v=30";

const STORAGE_KEY = "periodic-gift-tax-input-v1";
const RESIDENT_ID_MASK = "••••••";
const DEFAULT_PERIODIC_MONTHS = 120;
const form = document.querySelector("#giftForm");
const storageStatus = document.querySelector("#storageStatus");
const resultCards = document.querySelector("#resultCards");
const resultBasis = document.querySelector("#resultBasis");
const resultStatus = document.querySelector("#resultStatus");
const resultStatusLabel = document.querySelector("#resultStatusLabel");
const resultTaxAmount = document.querySelector("#resultTaxAmount");
const resultLead = document.querySelector("#resultLead");
const resultNextSteps = document.querySelector("#resultNextSteps");
const resultFilingMeta = document.querySelector("#resultFilingMeta");
const resultDocsSummary = document.querySelector("#resultDocsSummary");
const preparedSummary = document.querySelector("#preparedSummary");
const preparedList = document.querySelector("#preparedList");
const neededSummary = document.querySelector("#neededSummary");
const neededList = document.querySelector("#neededList");
const hometaxAssetGuide = document.querySelector("#hometaxAssetGuide");
const scheduleRows = document.querySelector("#scheduleRows");
const validationList = document.querySelector("#validationList");
const deadlineSummary = document.querySelector("#deadlineSummary");
const documentPreview = document.querySelector("#documentPreview");
const toast = document.querySelector("#toast");
const importFile = document.querySelector("#importFile");
const ruleOverlay = document.querySelector("#ruleOverlay");
const dataOverlay = document.querySelector("#dataOverlay");
const ruleButton = document.querySelector("#ruleButton");
const topbar = document.querySelector(".topbar");
const stepElements = Array.from(document.querySelectorAll(".wizard-step"));
const progressiveFields = Array.from(document.querySelectorAll("[data-reveal-after]"));
const fieldConfirmButtons = Array.from(document.querySelectorAll("[data-confirm-field]"));
const wizardProgress = document.querySelector(".wizard-progress");
const wizardNav = document.querySelector(".wizard-nav");
const utilityActions = document.querySelector(".utility-actions");
const stepCount = document.querySelector("#stepCount");
const stepTitle = document.querySelector("#stepTitle");
const progressBar = document.querySelector("#progressBar");
const backButton = document.querySelector("#backButton");
const nextButton = document.querySelector("#nextButton");
const amountGuard = document.querySelector("#amountGuard");
const accountCta = document.querySelector("#accountCta");
const accountCreateButton = document.querySelector("#accountCreateButton");
const introStartButton = document.querySelector("#introStartButton");
const safeTitle = document.querySelector("#safeTitle");
const safeLimitText = document.querySelector("#safeLimitText");
const safeBreakdown = document.querySelector("#safeBreakdown");
const safeNote = document.querySelector("#safeNote");
const modeHint = document.querySelector("#modeHint");
const amountTitle = document.querySelector("#amountTitle");
const amountHint = document.querySelector("#amountHint");
const priorGiftFields = document.querySelector("#priorGiftFields");
const priorGiftHint = document.querySelector("#priorGiftHint");

const STEPS = [
  { key: "intro", title: "시작" },
  { key: "donor", title: "증여자 정보" },
  { key: "recipient", title: "수증자 정보" },
  { key: "account", title: "수증자 계좌가 있나요?" },
  { key: "history", title: "이전 증여" },
  { key: "safe", title: "무세금 범위" },
  { key: "giftMode", title: "증여 방식" },
  { key: "amount", title: "얼마를 증여할까요?" },
  { key: "result", title: "신고 준비 결과" }
];

const defaultInput = normalizeInput({
  giftDate: formatDate(new Date()),
  firstPaymentDate: formatDate(new Date()),
  giftMode: "periodic",
  lumpSumAmount: 0,
  monthlyAmount: 0,
  totalMonths: 120,
  recipientHasAccount: "yes",
  accountReady: false,
  relationshipType: "parent_minor_child"
});

let toastTimer = 0;
let currentStepIndex = 0;
let guardianNameEdited = false;
let amountTaxOverrideApproved = false;
let lastEnterActionAt = 0;
let lastEnterActionTarget = null;
let lastFocusedFieldControl = null;
const confirmedFields = new Set();
const confirmedValues = new Map();
const taxSensitiveFields = new Set([
  "relationshipType",
  "giftDate",
  "firstPaymentDate",
  "lumpSumAmount",
  "monthlyAmount",
  "totalMonths",
  "priorSameDonorGiftValue",
  "priorDeductionUsed",
  "priorGiftTaxPaid"
]);
const flowDependencies = {
  donorName: ["donorAddress", "donorPhone", "donorId", "relationshipType"],
  donorAddress: ["donorPhone", "donorId", "relationshipType"],
  donorPhone: ["donorId", "relationshipType"],
  donorId: ["relationshipType"],
  recipientName: ["recipientAddress", "guardianName", "recipientId"],
  recipientAddress: ["guardianName", "recipientId"],
  guardianName: ["recipientId"],
  giftDate: ["firstPaymentDate", "lumpSumAmount", "monthlyAmount", "totalMonths", "amountComplete", "taxOffice"],
  firstPaymentDate: ["monthlyAmount", "totalMonths", "amountComplete", "taxOffice"],
  lumpSumAmount: ["amountComplete", "taxOffice"],
  monthlyAmount: ["totalMonths", "amountComplete", "taxOffice"],
  totalMonths: ["amountComplete", "taxOffice"]
};

bootstrap();

function bootstrap() {
  fillForm(defaultInput);
  bindEvents();
  recalculate();
  updateModeUi();
  updatePriorGiftUi();
  bindViewportInset();
  renderStep();
  cleanupBrowserCache();
}

function bindEvents() {
  form.addEventListener("input", handleFormValueChange);
  form.addEventListener("change", handleFormValueChange);
  form.addEventListener("beforeinput", handleFormLineBreak);
  form.addEventListener("keydown", handleFormEnterKey);
  form.addEventListener("keydown", handleResidentIdDeleteKey);
  form.addEventListener("keyup", handleFormEnterKey);
  form.addEventListener("submit", handleFormSubmit);
  form.addEventListener("focusin", trackFocusedFieldControl);
  form.addEventListener("focusout", handleFieldFocusOut);

  introStartButton.addEventListener("click", () => {
    currentStepIndex = 1;
    renderStep();
    scrollToTop();
  });
  fieldConfirmButtons.forEach((button) => {
    button.addEventListener("click", () => confirmField(button.dataset.confirmField));
  });
  form.elements.sameAddressAsDonor.addEventListener("change", handleSameAddressChange);
  document.querySelector("#printButton").addEventListener("click", printDocuments);
  document.querySelector("#printButtonDocuments").addEventListener("click", printDocuments);
  document.querySelector("#hometaxButton").addEventListener("click", openHometax);
  backButton.addEventListener("click", previousStep);
  nextButton.addEventListener("click", nextStep);
  amountGuard.addEventListener("click", handleAmountGuardClick);
  ruleButton.addEventListener("click", () => openOverlay(ruleOverlay));
  document.querySelector("#dataButton").addEventListener("click", () => openOverlay(dataOverlay));
  accountCreateButton.addEventListener("click", markAccountReady);
  Array.from(form.elements.recipientHasAccount).forEach((radio) => {
    radio.addEventListener("change", () => {
      if (form.elements.recipientHasAccount.value === "yes") {
        form.elements.accountReady.checked = true;
      }
    });
  });
  Array.from(form.elements.giftMode).forEach((radio) => {
    radio.addEventListener("change", () => {
      amountTaxOverrideApproved = false;
      resetAmountConfirmations();
      setRecommendedAmountDefaults();
      updateModeUi();
      recalculate();
    });
  });
  Array.from(form.elements.priorGiftStatus).forEach((radio) => {
    radio.addEventListener("change", () => {
      updatePriorGiftUi();
      recalculate();
    });
  });
  document.querySelector("#saveButton").addEventListener("click", saveLocal);
  document.querySelector("#loadButton").addEventListener("click", loadLocal);
  document.querySelector("#exportButton").addEventListener("click", exportJson);
  document.querySelector("#importButton").addEventListener("click", () => importFile.click());
  document.querySelector("#clearButton").addEventListener("click", clearAll);
  importFile.addEventListener("change", importJson);

  document.querySelectorAll("[data-close-overlay]").forEach((button) => {
    button.addEventListener("click", () => closeOverlay(document.querySelector(`#${button.dataset.closeOverlay}`)));
  });

  [ruleOverlay, dataOverlay].forEach((overlay) => {
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeOverlay(overlay);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeOverlay(ruleOverlay);
      closeOverlay(dataOverlay);
    }
  });
}

function bindViewportInset() {
  syncViewportInset();
  window.addEventListener("resize", syncViewportInset);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", syncViewportInset);
    window.visualViewport.addEventListener("scroll", syncViewportInset);
  }
}

function syncViewportInset() {
  const viewport = window.visualViewport;
  const bottomInset = viewport
    ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
    : 0;
  document.documentElement.style.setProperty("--visual-viewport-bottom", `${Math.round(bottomInset)}px`);
}

function handleFormValueChange(event) {
  markManualRecipientEdit(event);
  formatStructuredInput(event);
  resetTaxOverrideIfNeeded(event);
  syncFirstPaymentDate();
  handleConfirmedValueChanges();
  syncRecipientDefaults();
  updateModeUi();
  if (currentStep().key === "giftMode" || currentStep().key === "amount") {
    setRecommendedAmountDefaults();
  }
  updateProgressiveFields();
  recalculate();
  if (event.type === "change") {
    scheduleAutoConfirmField(event.target);
  }
}

function handleFormEnterKey(event) {
  if (event.key !== "Enter") return;
  if (event.type === "keyup" && Date.now() - lastEnterActionAt < 700) {
    event.preventDefault();
    return;
  }
  handleFormEnterEvent(event);
}

function handleFormLineBreak(event) {
  if (event.inputType !== "insertLineBreak") return;
  handleFormEnterEvent(event);
}

function handleFormSubmit(event) {
  handleFormEnterEvent(event);
}

function handleFormEnterEvent(event) {
  const target = event.target;
  event.preventDefault();
  const activeTarget = target instanceof HTMLInputElement || target instanceof HTMLSelectElement
    ? target
    : document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLSelectElement
      ? document.activeElement
      : lastFocusedFieldControl;
  const now = Date.now();
  if (activeTarget === lastEnterActionTarget && now - lastEnterActionAt < 350) return;
  lastEnterActionAt = now;
  lastEnterActionTarget = activeTarget;
  handleFormEnterTarget(activeTarget);
}

function trackFocusedFieldControl(event) {
  const target = event.target;
  if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement) {
    lastFocusedFieldControl = target;
  }
}

function handleFieldFocusOut(event) {
  const target = event.target;
  scheduleAutoConfirmField(target);
}

function scheduleAutoConfirmField(target) {
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;
  if (target instanceof HTMLInputElement && ["checkbox", "file", "radio"].includes(target.type)) return;
  const field = target.closest("[data-field]");
  const fieldName = field?.dataset.field;
  if (!fieldName || field.hidden || confirmedFields.has(fieldName)) return;

  window.setTimeout(() => {
    if (field.hidden || confirmedFields.has(fieldName) || !isFieldReadyForAutoConfirm(fieldName)) return;
    const confirmed = confirmField(fieldName);
    if (confirmed && shouldAdvanceAfterEnterConfirm(fieldName)) {
      nextStep();
    }
  }, 0);
}

function handleFormEnterTarget(target) {
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return false;
  const field = target.closest("[data-field]");
  const fieldName = field?.dataset.field;
  if (fieldName && !field.hidden && !confirmedFields.has(fieldName)) {
    const confirmed = confirmField(fieldName);
    if (confirmed && shouldAdvanceAfterEnterConfirm(fieldName)) {
      nextStep();
    }
    return confirmed;
  }

  if (canAdvanceCurrentStep()) {
    nextStep();
    return true;
  }

  const confirmButton = field?.querySelector("[data-confirm-field]");
  if (confirmButton instanceof HTMLButtonElement) {
    confirmButton.click();
    return true;
  }
  return false;
}

function shouldAdvanceAfterEnterConfirm(fieldName) {
  const step = currentStep().key;
  if (!canAdvanceCurrentStep()) return false;
  if (step === "donor") return fieldName === "relationshipType";
  if (step === "recipient") return fieldName === "recipientId";
  if (step === "amount") return fieldName === "totalMonths" || fieldName === "lumpSumAmount";
  return false;
}

function syncFirstPaymentDate() {
  const giftDate = form.elements.giftDate.value;
  const firstPaymentDate = form.elements.firstPaymentDate.value;
  if (giftDate && !firstPaymentDate) {
    form.elements.firstPaymentDate.value = giftDate;
  }
}

function syncRecipientDefaults() {
  const sameAddress = form.elements.sameAddressAsDonor?.checked;
  if (sameAddress && form.elements.donorAddress.value) {
    form.elements.recipientAddress.value = form.elements.donorAddress.value;
  }
  updateRecipientAddressState();
  if (!guardianNameEdited && form.elements.donorName.value) {
    form.elements.guardianName.value = form.elements.donorName.value;
  }
}

function markManualRecipientEdit(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  if (target.name === "guardianName") {
    guardianNameEdited = true;
  }
}

function formatStructuredInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  if (target.name === "donorPhone") {
    target.value = formatPhoneDisplay(target.value);
  }
  if (target.name === "donorId" || target.name === "recipientId") {
    const digits = getResidentIdDigits(target.value);
    const cursorDigits = Number(target.dataset.residentCursorDigits || digits.length);
    delete target.dataset.residentCursorDigits;
    target.value = formatResidentIdDisplay(digits);
    setResidentIdCursor(target, cursorDigits);
  }
}

function formatPhoneDisplay(value) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("02")) {
    const localDigits = digits.slice(0, 10);
    if (localDigits.length <= 2) return localDigits;
    if (localDigits.length <= 6) return `${localDigits.slice(0, 2)}-${localDigits.slice(2)}`;
    return `${localDigits.slice(0, 2)}-${localDigits.slice(2, -4)}-${localDigits.slice(-4)}`;
  }

  const mobileDigits = digits.slice(0, 11);
  if (mobileDigits.length <= 3) return mobileDigits;
  if (mobileDigits.length <= 7) return `${mobileDigits.slice(0, 3)}-${mobileDigits.slice(3)}`;
  return `${mobileDigits.slice(0, 3)}-${mobileDigits.slice(3, 7)}-${mobileDigits.slice(7)}`;
}

function formatResidentIdDisplay(value) {
  const digits = getResidentIdDigits(value);
  if (digits.length <= 6) return digits;
  return `${digits.slice(0, 6)}-${digits.slice(6)}${RESIDENT_ID_MASK}`;
}

function getResidentIdDigits(value) {
  return String(value ?? "").replace(/\D/g, "").slice(0, 7);
}

function handleResidentIdDeleteKey(event) {
  if (event.key !== "Backspace" && event.key !== "Delete") return;
  const target = event.target;
  if (!(target instanceof HTMLInputElement) || !isResidentIdField(target)) return;

  const digits = getResidentIdDigits(target.value);
  const selectionStart = target.selectionStart ?? target.value.length;
  const selectionEnd = target.selectionEnd ?? selectionStart;
  const digitStart = countResidentDigitsBefore(target.value, selectionStart);
  const digitEnd = countResidentDigitsBefore(target.value, selectionEnd);
  let nextDigits = digits;
  let nextCursorDigits = digitStart;

  if (digitStart !== digitEnd) {
    nextDigits = digits.slice(0, digitStart) + digits.slice(digitEnd);
  } else if (event.key === "Backspace" && digitStart > 0) {
    nextDigits = digits.slice(0, digitStart - 1) + digits.slice(digitStart);
    nextCursorDigits = digitStart - 1;
  } else if (event.key === "Delete" && digitStart < digits.length) {
    nextDigits = digits.slice(0, digitStart) + digits.slice(digitStart + 1);
  } else {
    return;
  }

  event.preventDefault();
  target.value = formatResidentIdDisplay(nextDigits);
  target.dataset.residentCursorDigits = String(nextCursorDigits);
  setResidentIdCursor(target, nextCursorDigits);
  target.dispatchEvent(new Event("input", { bubbles: true }));
}

function isResidentIdField(element) {
  return element.name === "donorId" || element.name === "recipientId";
}

function countResidentDigitsBefore(value, index) {
  return getResidentIdDigits(String(value).slice(0, index)).length;
}

function setResidentIdCursor(element, digitCount) {
  const cursor = digitCount <= 6 ? digitCount : 8;
  requestAnimationFrame(() => {
    try {
      element.setSelectionRange(cursor, cursor);
    } catch {
      // Some embedded browsers can reject selection changes on unfocused inputs.
    }
  });
}

function resetTaxOverrideIfNeeded(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;
  if (taxSensitiveFields.has(target.name)) {
    amountTaxOverrideApproved = false;
  }
}

function handleSameAddressChange() {
  if (form.elements.sameAddressAsDonor.checked && form.elements.donorAddress.value) {
    form.elements.recipientAddress.value = form.elements.donorAddress.value;
  }
  clearConfirmedField("recipientAddress");
  updateRecipientAddressState();
  updateProgressiveFields();
  recalculate();
}

function updateRecipientAddressState() {
  const sameAddress = form.elements.sameAddressAsDonor?.checked;
  const addressInput = form.elements.recipientAddress;
  if (addressInput instanceof HTMLInputElement) {
    addressInput.readOnly = Boolean(sameAddress);
  }
  document.querySelector('[data-field="recipientAddress"]')?.classList.toggle("is-same-address", Boolean(sameAddress));
}

function updateModeUi() {
  const input = readForm();
  document.body.dataset.giftMode = input.giftMode;
  form.elements.firstPaymentDate.required = input.giftMode === "periodic";
  form.elements.monthlyAmount.required = input.giftMode === "periodic";
  form.elements.totalMonths.required = input.giftMode === "periodic";
  form.elements.lumpSumAmount.required = input.giftMode === "lump_sum";
  updateProgressiveFields();
}

function setRecommendedAmountDefaults() {
  const input = readForm();
  const safeLimit = getSafeAssessmentLimit(input);
  if (input.giftMode === "periodic") {
    setRecommendedNumericValue(form.elements.totalMonths, DEFAULT_PERIODIC_MONTHS, "totalMonths");
    const monthlyInput = readForm();
    const recommendedMonthly = calculateRecommendedMonthly(monthlyInput, safeLimit);
    setRecommendedNumericValue(form.elements.monthlyAmount, recommendedMonthly, "monthlyAmount");
    return;
  }

  setRecommendedNumericValue(form.elements.lumpSumAmount, calculateRecommendedLumpSum(safeLimit), "lumpSumAmount");
}

function setRecommendedNumericValue(element, value, fieldName) {
  if (!(element instanceof HTMLInputElement)) return;
  const recommendedValue = String(Math.max(0, Math.floor(Number(value) || 0)));
  if (recommendedValue === "0") return;

  const previousRecommendedValue = element.dataset.recommendedValue ?? "";
  const currentValue = element.value.trim();
  if (currentValue && currentValue !== previousRecommendedValue) return;

  if (currentValue !== recommendedValue) {
    element.value = recommendedValue;
    clearConfirmedField(fieldName);
  }
  element.dataset.recommendedValue = recommendedValue;
}

function calculateRecommendedMonthly(input, safeLimit) {
  const totalMonths = Math.max(1, input.totalMonths || DEFAULT_PERIODIC_MONTHS);
  const baseInput = { ...input, giftMode: "periodic", totalMonths };
  let low = 0;
  let high = Math.max(1, Math.ceil(safeLimit / totalMonths));
  while (calculateValuation({ ...baseInput, monthlyAmount: high }).assessedValue <= safeLimit) {
    high *= 2;
  }
  while (low + 1 < high) {
    const mid = Math.floor((low + high) / 2);
    if (calculateValuation({ ...baseInput, monthlyAmount: mid }).assessedValue <= safeLimit) {
      low = mid;
    } else {
      high = mid;
    }
  }
  const rounded = Math.floor(low / 1000) * 1000;
  return rounded > 0 ? rounded : low;
}

function calculateRecommendedLumpSum(safeLimit) {
  return Math.max(0, Math.floor(safeLimit));
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function recalculate() {
  const input = readForm();
  const validation = validateGiftInput(input);
  const valuation = calculateValuation(validation.input);
  const tax = calculateGiftTax(validation.input, valuation);
  renderSafeBriefing(validation.input, tax);
  renderModeHints(validation.input);
  renderResults(validation.input, valuation, tax, validation.errors, validation.warnings);
  renderDocuments(validation.input, valuation, tax, validation.errors, validation.warnings);
  renderAmountGuard(valuation);
}

function renderSafeBriefing(input, tax) {
  const safeLimit = getSafeAssessmentLimit(input);
  safeTitle.textContent = `${tax.relationshipLabel} 기준으로 확인해볼게요`;
  safeLimitText.textContent = `10년 동안 ${formatLimit(safeLimit)}까지는 세금 없이 보낼 수 있어요.`;
  safeBreakdown.innerHTML = `
    <div><span>기본 공제</span><strong>${formatWon(tax.availableDeduction)}</strong></div>
    <div><span>과세표준 50만원 미만</span><strong>부과 제외</strong></div>
  `;
  safeNote.textContent = tax.generationSkippingRate > 0
    ? "조부모가 손자녀에게 보내면 세대생략 할증이 붙을 수 있어요."
    : "최근 10년 안에 같은 분에게 받은 증여가 있으면 기준이 낮아질 수 있어요.";
}

function renderModeHints(input) {
  const safeLimit = getSafeAssessmentLimit(input);
  const recommendedMonthly = calculateRecommendedMonthly(input, safeLimit);
  const recommendedLumpSum = calculateRecommendedLumpSum(safeLimit);
  modeHint.textContent = input.giftMode === "lump_sum"
    ? `추천 금액은 ${formatWon(recommendedLumpSum)}이에요.`
    : `10년 동안 매월 약 ${formatWon(recommendedMonthly)}까지 맞출 수 있어요.`;
  amountTitle.textContent = input.giftMode === "lump_sum" ? "한 번에 얼마를 보낼까요?" : "매월 얼마를 보낼까요?";
  amountHint.textContent = input.giftMode === "lump_sum"
    ? `추천 금액 ${formatWon(recommendedLumpSum)}을 넣어뒀어요. 바꿔도 돼요.`
    : `추천 월 납입액 ${formatWon(recommendedMonthly)}을 넣어뒀어요. 바꿔도 돼요.`;
}

function renderResults(input, valuation, tax, errors, warnings) {
  renderResultBasis(input);
  const safeLimit = getSafeAssessmentLimit(input);
  const hasErrors = errors.length > 0;
  const hasTax = tax.payableTax > 0;

  resultStatus.classList.toggle("has-tax", hasTax);
  resultStatus.classList.toggle("has-error", hasErrors);
  resultStatusLabel.textContent = hasErrors ? "입력 확인 필요" : hasTax ? "낼 세금이 있어요" : "낼 세금이 없어요";
  resultTaxAmount.textContent = hasErrors ? "다시 확인해주세요" : hasTax ? `예상 세금 ${formatWon(tax.payableTax)}` : "예상 세금 0원";
  resultLead.textContent = hasErrors
    ? "빠진 정보를 채우고 다시 확인해주세요."
    : hasTax
      ? "세금이 나오는 조건이에요. 그래도 신고 준비를 계속할 수 있어요."
      : "지금 조건으로는 예상 납부세액이 0원이에요.";
  deadlineSummary.textContent = tax.filingDeadline
    ? `신고는 ${formatKoreanDate(tax.filingDeadline)}까지`
    : "신고기한 산정 전";

  const metrics = [
    {
      label: "평가액",
      value: formatWon(valuation.assessedValue),
      sub: valuation.capApplied ? "20배 상한 적용" : "현재가치 합계 적용"
    },
    {
      label: "세금 없는 기준",
      value: formatWon(safeLimit),
      sub: `사용 가능 공제 ${formatWon(tax.availableDeduction)}`
    },
    {
      label: "과세표준",
      value: formatWon(tax.taxBase),
      sub: tax.minimumRuleApplied ? "과세최저한 적용" : `${(tax.rate * 100).toFixed(0)}% 세율`
    },
    {
      label: "납부할 세액",
      value: formatWon(tax.payableTax),
      sub: tax.generationSkippingTax > 0
        ? `할증 포함, 신고공제 ${formatWon(tax.filingCredit)}`
        : tax.filingCreditApplied ? `신고세액공제 ${formatWon(tax.filingCredit)}` : "신고기한 경과"
    }
  ];

  resultCards.innerHTML = metrics
    .map(
      (metric) => `
        <article class="metric">
          <div class="label">${metric.label}</div>
          <div class="value">${metric.value}</div>
          <div class="sub">${metric.sub}</div>
        </article>
      `
    )
    .join("");

  resultNextSteps.innerHTML = [
    input.recipientHasAccount === "yes" || input.accountReady
      ? "받는 분 명의 계좌로 돈을 보내고 이체내역을 보관하세요."
      : "받는 분 명의 계좌를 먼저 준비해주세요.",
    input.giftMode === "periodic"
      ? `매월 ${formatWon(input.monthlyAmount)}씩 ${input.totalMonths.toLocaleString("ko-KR")}개월 보내는 약정서를 준비하세요.`
      : `${formatWon(input.lumpSumAmount)}을 보낸 내역을 준비하세요.`,
    `${formatKoreanDate(tax.filingDeadline)}까지 홈택스에 신고하세요.`,
    "가족관계증명서와 이체내역을 함께 준비하세요."
  ]
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");

  renderHometaxGuide(input, valuation, tax);

  resultFilingMeta.innerHTML = [
    ["증여 관계", tax.relationshipLabel],
    ["평가 방식", input.giftMode === "periodic" ? "유기정기금 현재가치 평가" : "현금 일시증여 평가"],
    ["신고 기준일", "2026.06.06 확인 기준"],
    ["세대생략 할증", tax.generationSkippingRate > 0 ? `${(tax.generationSkippingRate * 100).toFixed(0)}% 반영` : "해당 없음"]
  ]
    .map(([label, value]) => `<article><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`)
    .join("");

  resultDocsSummary.textContent = input.giftMode === "periodic"
    ? "평가명세서, 신고서 초안, 약정서를 저장해요."
    : "증여 명세서, 신고서 초안, 현금 증여 확인서를 저장해요.";

  scheduleRows.innerHTML = valuation.schedule
    .map(
      (row) => `
        <tr>
          <td>${row.paymentYear}년</td>
          <td>${formatKoreanDate(row.periodStartDate)} ~ ${formatKoreanDate(row.periodEndDate)}</td>
          <td>${row.months.toLocaleString("ko-KR")}</td>
          <td>${formatWon(row.periodPayment)}</td>
          <td>${formatDiscount(row)}</td>
          <td>${formatWon(row.presentValue)}</td>
        </tr>
      `
    )
    .join("");

  renderValidation(input, errors, warnings, tax);
}

function renderHometaxGuide(input, valuation, tax) {
  const isPeriodic = input.giftMode === "periodic";
  const preparedItems = [
    "증여세 과세표준신고 및 자진납부계산서 초안",
    "증여재산 및 평가명세서 초안",
    isPeriodic ? "유기정기금 평가명세서" : "현금 증여 명세서",
    isPeriodic ? "유기정기금 증여약정서" : "현금 증여 확인서",
    `증여재산 평가액 ${formatWon(valuation.assessedValue)}`,
    `신고기한 ${formatKoreanDate(tax.filingDeadline)}`
  ];
  const neededItems = [
    "가족관계증명서 또는 기본증명서",
    "증여자와 수증자의 전체 주민등록번호",
    "수증자 명의 계좌 이체내역",
    "수증자 주소와 관할세무서 확인",
    "최근 10년 동일인 증여 신고·결정 내역 확인"
  ];

  if (isPeriodic) {
    neededItems.push("첫 이체내역 또는 실제 이체계획");
  } else {
    neededItems.push("현금 이체일과 증여일 일치 여부 확인");
  }
  if (input.recipientHasAccount !== "yes" && !input.accountReady) {
    neededItems.unshift("수증자 명의 계좌 개설");
  }
  if (input.priorSameDonorGiftValue > 0) {
    preparedItems.push("입력한 10년 내 동일인 증여가산액 반영");
    neededItems.push("이전 증여 신고서 또는 홈택스 결정정보 대조");
  }
  if (tax.generationSkippingRate > 0) {
    preparedItems.push(`세대생략 할증 ${Math.round(tax.generationSkippingRate * 100)}% 반영`);
    neededItems.push("손자녀 증여 관계를 확인할 가족관계 자료");
  }
  if (tax.payableTax > 0) {
    preparedItems.push(`예상 납부세액 ${formatWon(tax.payableTax)}`);
    neededItems.push("납부 수단과 납부 가능 시간 확인");
  }

  preparedSummary.textContent = isPeriodic
    ? "정기증여 계산값과 유기정기금 서류 초안을 만들어줘요."
    : "현금 일시증여 신고서 초안과 확인서를 만들어줘요.";
  neededSummary.textContent = "공공기관 발급자료와 실제 송금 증빙은 사용자가 직접 준비해야 해요.";
  preparedList.innerHTML = preparedItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  neededList.innerHTML = neededItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("");

  const assetDetail = isPeriodic
    ? `증여재산은 유기정기금 수급권으로 보고 평가액 ${formatWon(valuation.assessedValue)}을 입력하세요. 재산 내용에는 매월 ${formatWon(input.monthlyAmount)}씩 ${input.totalMonths.toLocaleString("ko-KR")}개월 지급받을 권리라고 적는 식으로 정리하면 됩니다.`
    : `증여재산은 현금으로 보고 증여금액 ${formatWon(valuation.assessedValue)}을 입력하세요. 증여일은 실제 이체일과 맞춰 확인하세요.`;
  hometaxAssetGuide.textContent = `${assetDetail} 증여재산공제는 ${formatWon(tax.deductionApplied)}, 과세표준은 ${formatWon(tax.taxBase)} 기준으로 대조하세요.`;
}

function renderResultBasis(input) {
  const items = input.giftMode === "lump_sum"
    ? ["현금", "일시증여", "홈택스 신고 준비", "2026.06.06 기준"]
    : ["현금", "매월 고정액", "유기정기금", "2026.06.06 기준"];
  if (input.priorSameDonorGiftValue > 0 || input.priorDeductionUsed > 0 || input.priorGiftTaxPaid > 0) {
    items.push("이전 증여 반영");
  }
  resultBasis.innerHTML = items.map((item) => `<span>${escapeHtml(item)}</span>`).join("");
}

function renderValidation(input, errors, warnings, tax) {
  const notices = [];
  if (input.priorSameDonorGiftValue > 0) {
    notices.push({
      type: "warning",
      text: "10년 내 동일인 증여 내역은 실제 신고 이력과 가족관계 기준으로 다시 확인해야 합니다."
    });
  }
  if (tax.generationSkippingTax > 0) {
    notices.push({
      type: "warning",
      text: `수증자가 증여자의 자녀가 아닌 직계비속이라 세대생략 할증세액 ${formatWon(tax.generationSkippingTax)}을 반영했습니다.`
    });
  }
  errors.forEach((text) => notices.push({ type: "error", text }));
  warnings.forEach((text) => notices.push({ type: "warning", text }));

  if (!notices.length) {
    validationList.innerHTML = "";
    return;
  }

  validationList.innerHTML = notices
    .map((notice) => `<div class="notice ${notice.type === "info" ? "" : notice.type}">${escapeHtml(notice.text)}</div>`)
    .join("");
}

function formatDiscount(row) {
  if (row.yearOffset === 0) return "0년 (할인 없음)";
  return `${row.yearOffset}년 (${row.discountFactor.toFixed(6)})`;
}

function renderDocuments(input, valuation, tax, errors, warnings) {
  documentPreview.innerHTML = renderDocumentPack({ input, valuation, tax, errors, warnings });
}

function readForm() {
  const data = new FormData(form);
  const input = {};
  for (const [key, value] of data.entries()) {
    input[key] = value;
  }
  return normalizeInput(input);
}

function fillForm(input) {
  const normalized = normalizeInput(input);
  guardianNameEdited = Boolean(normalized.guardianName && normalized.guardianName !== normalized.donorName);
  normalized.donorPhone = formatPhoneDisplay(normalized.donorPhone);
  normalized.donorId = formatResidentIdDisplay(normalized.donorId);
  normalized.recipientId = formatResidentIdDisplay(normalized.recipientId);
  for (const [key, value] of Object.entries(normalized)) {
    const element = form.elements[key];
    if (!element) continue;
    if (element instanceof HTMLInputElement && element.type === "checkbox") {
      element.checked = Boolean(value);
    } else if (element instanceof HTMLInputElement && element.type === "number" && Number(value) <= 0) {
      element.value = "";
    } else {
      element.value = value;
    }
  }
  const hasPriorGift =
    normalized.priorSameDonorGiftValue > 0 ||
    normalized.priorDeductionUsed > 0 ||
    normalized.priorGiftTaxPaid > 0;
  if (form.elements.priorGiftStatus) {
    form.elements.priorGiftStatus.value = hasPriorGift ? "yes" : "no";
  }
  updatePriorGiftUi({ keepValues: true });
  updateProgressiveFields();
  updateRecipientAddressState();
}

function printDocuments() {
  currentStepIndex = STEPS.length - 1;
  renderStep();
  requestAnimationFrame(() => window.print());
}

function openHometax() {
  window.open("https://www.hometax.go.kr/", "_blank", "noopener");
  showToast("홈택스를 열었어요. 자동 신고는 준비중입니다.");
}

function nextStep() {
  if (currentStep().key === "result") {
    printDocuments();
    return;
  }
  if (!validateCurrentStep()) return;
  hideToast();
  currentStepIndex = Math.min(STEPS.length - 1, currentStepIndex + 1);
  renderStep();
  scrollToTop();
}

function handleAmountGuardClick(event) {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest("[data-continue-tax]");
  if (!button) return;
  amountTaxOverrideApproved = true;
  hideToast();
  nextStep();
}

function previousStep() {
  hideToast();
  currentStepIndex = Math.max(0, currentStepIndex - 1);
  renderStep();
  scrollToTop();
}

function renderStep() {
  const step = currentStep();
  stepElements.forEach((element) => {
    element.classList.toggle("is-active", element.dataset.step === step.key);
  });
  const progressTotal = STEPS.length - 1;
  const progressIndex = Math.max(1, currentStepIndex);
  const isIntro = step.key === "intro";
  const isResult = step.key === "result";
  topbar.hidden = step.key !== "result";
  wizardProgress.hidden = true;
  utilityActions.hidden = isIntro;
  ruleButton.hidden = step.key !== "result";
  wizardNav.classList.toggle("is-intro", isIntro);
  wizardNav.hidden = isIntro || isResult;
  stepCount.textContent = `${progressIndex} / ${progressTotal}`;
  stepTitle.textContent = step.title;
  progressBar.style.width = `${(progressIndex / progressTotal) * 100}%`;
  backButton.hidden = isIntro;
  backButton.disabled = isIntro;
  nextButton.textContent = getNextButtonText(step.key);
  if (step.key === "recipient") syncRecipientDefaults();
  if (step.key === "safe") renderSafeBriefing(readForm(), calculateGiftTax(readForm()));
  if (step.key === "giftMode" || step.key === "amount") {
    setRecommendedAmountDefaults();
    updateModeUi();
  }
  updateProgressiveFields();
}

function getNextButtonText(stepKey) {
  if (stepKey === "account") return "이전 증여 확인";
  if (stepKey === "history") return "증여 가능 범위 보기";
  if (stepKey === "safe") return "증여 방식 고르기";
  if (stepKey === "giftMode") return "조건 입력하기";
  if (stepKey === "amount") return "결과 보기";
  if (stepKey === "result") return "PDF 저장";
  return "다음";
}

function currentStep() {
  return STEPS[currentStepIndex];
}

function validateCurrentStep() {
  const step = currentStep().key;
  if (step === "donor") {
    if (!isDonorComplete()) return requireConfirmedFields(["donorName", "donorAddress", "donorPhone", "donorId"], "증여자 정보를 순서대로 확인하세요.");
  }
  if (step === "recipient") {
    if (!isRecipientComplete()) return requireConfirmedFields(["recipientName", "recipientAddress", "guardianName", "recipientId"], "받는 분 정보를 순서대로 확인하세요.");
  }
  if (step === "account" && form.elements.recipientHasAccount.value === "no" && !form.elements.accountReady.checked) {
    showToast("받는 분 명의 계좌를 준비한 뒤 진행하세요.");
    return false;
  }
  if (step === "history" && !validatePriorGiftStep()) return false;
  if (step === "amount") {
    const validation = validateGiftInput(readForm());
    if (!isAmountComplete()) {
      showToast("증여 조건을 순서대로 확인하세요.");
      return false;
    }
    const valuation = calculateValuation(validation.input);
    const safeLimit = getSafeAssessmentLimit(validation.input);
    if (valuation.assessedValue > safeLimit && !amountTaxOverrideApproved) {
      renderAmountGuard(valuation);
      showToast("세금이 나올 수 있어요. 계속할지 선택해주세요.");
      return false;
    }
  }
  return true;
}

function canAdvanceCurrentStep() {
  const step = currentStep().key;
  if (step === "intro") return true;
  if (step === "donor") return isDonorComplete();
  if (step === "recipient") return isRecipientComplete();
  if (step === "account") return form.elements.recipientHasAccount.value === "yes" || form.elements.accountReady.checked;
  if (step === "history") return isPriorGiftStepComplete();
  if (step === "amount") return isAmountComplete() && (!isAmountOverSafeLimit() || amountTaxOverrideApproved);
  return true;
}

function isAmountOverSafeLimit() {
  if (!isAmountComplete()) return false;
  const input = readForm();
  const validation = validateGiftInput(input);
  if (validation.errors.length) return false;
  const valuation = calculateValuation(validation.input);
  return valuation.assessedValue > getSafeAssessmentLimit(validation.input);
}

function isDonorComplete() {
  return ["donorName", "donorAddress", "donorPhone", "donorId", "relationshipType"].every((field) =>
    confirmedFields.has(field)
  );
}

function isRecipientComplete() {
  return ["recipientName", "recipientAddress", "guardianName", "recipientId"].every((field) => confirmedFields.has(field));
}

function isAmountComplete() {
  const input = readForm();
  if (input.giftMode === "lump_sum") return confirmedFields.has("giftDate") && confirmedFields.has("lumpSumAmount");
  return ["giftDate", "firstPaymentDate", "monthlyAmount", "totalMonths"].every((field) => confirmedFields.has(field));
}

function isPriorGiftStepComplete() {
  if (form.elements.priorGiftStatus.value !== "yes") return true;
  return ["priorSameDonorGiftValue", "priorDeductionUsed", "priorGiftTaxPaid"].every((field) => Number(form.elements[field].value || 0) >= 0);
}

function validatePriorGiftStep() {
  if (isPriorGiftStepComplete()) return true;
  showToast("이전 증여 금액은 0원 이상으로 입력하세요.");
  return false;
}

function updatePriorGiftUi(options = {}) {
  const hasPriorGift = form.elements.priorGiftStatus?.value === "yes";
  priorGiftFields.hidden = !hasPriorGift;
  priorGiftHint.textContent = hasPriorGift
    ? "모르면 0으로 두고 넘어가도 돼요. 실제 신고 전에는 증여 이력을 다시 확인하세요."
    : "없다면 다음 단계에서 기본 공제 기준으로 보여드려요.";
  if (!hasPriorGift && !options.keepValues) {
    form.elements.priorSameDonorGiftValue.value = "0";
    form.elements.priorDeductionUsed.value = "0";
    form.elements.priorGiftTaxPaid.value = "0";
  }
  updateWizardNavState();
}

function requireConfirmedFields(fields, message) {
  const missing = fields.find((field) => !confirmedFields.has(field));
  showToast(message);
  focusField(missing);
  return false;
}

function updateProgressiveFields() {
  const input = readForm();
  if (input.giftMode === "lump_sum") {
    confirmedFields.delete("firstPaymentDate");
    confirmedFields.delete("monthlyAmount");
    confirmedFields.delete("totalMonths");
  } else {
    confirmedFields.delete("lumpSumAmount");
  }

  progressiveFields.forEach((field) => {
    const dependency = field.dataset.revealAfter;
    const modeHidden =
      (field.classList.contains("lump-only") && input.giftMode !== "lump_sum") ||
      (field.classList.contains("periodic-only") && input.giftMode !== "periodic");
    if (dependency === "amountComplete") {
      field.hidden = modeHidden || !isAmountComplete();
    } else {
      field.hidden = modeHidden || !confirmedFields.has(dependency);
    }
  });
  fieldConfirmButtons.forEach((button) => {
    const field = button.dataset.confirmField;
    button.classList.toggle("is-confirmed", confirmedFields.has(field));
    button.textContent = confirmedFields.has(field) ? "✓" : "→";
  });
  updateWizardNavState();
}

function confirmField(fieldName) {
  if (!validateField(fieldName)) return false;
  if (fieldName === "recipientAddress" && form.elements.sameAddressAsDonor.checked) {
    form.elements.recipientAddress.value = form.elements.donorAddress.value;
  }
  confirmedFields.add(fieldName);
  confirmedValues.set(fieldName, getFieldValue(fieldName));
  if (fieldName === "lumpSumAmount" || fieldName === "totalMonths") {
    confirmedFields.add("amountComplete");
  }
  syncRecipientDefaults();
  updateProgressiveFields();
  confirmDefaultRelationshipAfterId(fieldName);
  recalculate();
  focusNextField(fieldName);
  return true;
}

function confirmDefaultRelationshipAfterId(fieldName) {
  if (fieldName !== "donorId" || confirmedFields.has("relationshipType")) return;
  const field = document.querySelector('[data-field="relationshipType"]');
  const element = form.elements.relationshipType;
  if (!field || field.hidden || !(element instanceof HTMLSelectElement) || !element.value) return;
  confirmedFields.add("relationshipType");
  confirmedValues.set("relationshipType", getFieldValue("relationshipType"));
  updateProgressiveFields();
}

function isFieldReadyForAutoConfirm(fieldName) {
  const element = form.elements[fieldName];
  if (!(element instanceof HTMLInputElement || element instanceof HTMLSelectElement)) return false;
  if (fieldName === "donorName" || fieldName === "recipientName" || fieldName === "guardianName") {
    return isPlausibleName(element.value);
  }
  if (fieldName === "donorAddress" || fieldName === "recipientAddress") {
    return element.value.trim().length >= 5;
  }
  if (fieldName === "donorPhone") {
    return isValidPhoneInput(element.value);
  }
  if (fieldName === "donorId" || fieldName === "recipientId") {
    return isValidResidentIdInput(element.value);
  }
  if (fieldName === "relationshipType") {
    return Boolean(element.value);
  }
  if (fieldName === "giftDate" || fieldName === "firstPaymentDate") {
    if (!element.value) return false;
    const validation = validateGiftInput(readForm());
    return !validation.errors.some((error) => error.includes("증여일") || error.includes("첫 이체일"));
  }
  if (fieldName === "lumpSumAmount" || fieldName === "monthlyAmount" || fieldName === "totalMonths") {
    return Number(element.value) > 0;
  }
  if (fieldName === "taxOffice") {
    return element.value.trim().length >= 2;
  }
  return false;
}

function validateField(fieldName) {
  const element = form.elements[fieldName];
  if (fieldName === "donorName" || fieldName === "recipientName" || fieldName === "guardianName") {
    if (!isPlausibleName(element.value)) {
      showToast("성명을 두 글자 이상 정확히 입력하세요.");
      element.focus();
      return false;
    }
  }
  if (fieldName === "donorAddress" || fieldName === "recipientAddress") {
    if (element.value.trim().length < 5) {
      showToast("주소를 조금 더 구체적으로 입력하세요.");
      element.focus();
      return false;
    }
  }
  if (fieldName === "donorPhone") {
    if (!isValidPhoneInput(element.value)) {
      showToast("연락처를 다시 확인하세요.");
      element.focus();
      return false;
    }
  }
  if (fieldName === "donorId" || fieldName === "recipientId") {
    if (!isValidResidentIdInput(element.value)) {
      showToast("주민등록번호는 앞 7자리만 입력하세요.");
      element.focus();
      return false;
    }
  }
  if (fieldName === "relationshipType" && !element.value) {
    showToast("증여 관계를 선택하세요.");
    element.focus();
    return false;
  }
  if (fieldName === "giftDate" || fieldName === "firstPaymentDate") {
    const validation = validateGiftInput(readForm());
    if (validation.errors.some((error) => error.includes("증여일") || error.includes("첫 이체일"))) {
      showToast(validation.errors.find((error) => error.includes("증여일") || error.includes("첫 이체일")));
      element.focus();
      return false;
    }
  }
  if (fieldName === "lumpSumAmount" || fieldName === "monthlyAmount" || fieldName === "totalMonths") {
    if (Number(element.value) <= 0) {
      showToast("1 이상의 금액이나 기간을 입력하세요.");
      element.focus();
      return false;
    }
  }
  if (fieldName === "taxOffice" && element.value.trim().length > 0 && element.value.trim().length < 2) {
    showToast("관할세무서를 다시 확인하세요.");
    element.focus();
    return false;
  }
  hideToast();
  return true;
}

function handleConfirmedValueChanges() {
  for (const fieldName of Array.from(confirmedFields)) {
    if (fieldName === "amountComplete") continue;
    const previous = confirmedValues.get(fieldName);
    const current = getFieldValue(fieldName);
    if (previous !== undefined && previous !== current) {
      clearConfirmedField(fieldName);
    }
  }
}

function clearConfirmedField(fieldName) {
  confirmedFields.delete(fieldName);
  confirmedValues.delete(fieldName);
  for (const child of flowDependencies[fieldName] ?? []) {
    clearConfirmedField(child);
  }
}

function resetAmountConfirmations() {
  amountTaxOverrideApproved = false;
  ["giftDate", "firstPaymentDate", "lumpSumAmount", "monthlyAmount", "totalMonths", "amountComplete", "taxOffice"].forEach((field) => {
    confirmedFields.delete(field);
    confirmedValues.delete(field);
  });
}

function getFieldValue(fieldName) {
  const element = form.elements[fieldName];
  if (!element) return "";
  if (element instanceof RadioNodeList) return element.value.trim();
  if (element instanceof HTMLInputElement && element.type === "checkbox") return element.checked ? "checked" : "";
  return String(element.value ?? "").trim();
}

function focusNextField(fieldName) {
  const visibleFields = progressiveFields.filter((field) => !field.hidden);
  const current = document.querySelector(`[data-field="${fieldName}"]`);
  const index = visibleFields.indexOf(current);
  const nextField = visibleFields[index + 1];
  const nextInput = nextField?.querySelector("input, select");
  if (nextInput) {
    requestAnimationFrame(() => nextInput.focus());
  }
}

function focusField(fieldName) {
  const element = form.elements[fieldName];
  if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement) element.focus();
}

function isPlausibleName(value) {
  const name = value.trim();
  return name.length >= 2 && /^[가-힣a-zA-Z\s.·-]+$/.test(name);
}

function isValidResidentIdInput(value) {
  const digits = value.replace(/\D/g, "");
  return /^\d{6}[1-8]$/.test(digits);
}

function isValidPhoneInput(value) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 12;
}

function updateAccountCta() {
  form.elements.accountReady.checked = form.elements.accountReady.checked || form.elements.recipientHasAccount.value === "yes";
}

function markAccountReady() {
  form.elements.accountReady.checked = true;
  form.elements.recipientHasAccount.value = "yes";
  updateProgressiveFields();
  showToast("계좌 준비 완료로 표시했어요.");
}

function renderAmountGuard(valuation) {
  const input = readForm();
  const safeLimit = getSafeAssessmentLimit(input);
  if (!isAmountComplete() || valuation.assessedValue <= safeLimit) {
    amountGuard.hidden = true;
    amountGuard.innerHTML = "";
    return;
  }
  amountGuard.hidden = false;
  amountGuard.classList.toggle("is-approved", amountTaxOverrideApproved);
  amountGuard.innerHTML = `
    <strong>${amountTaxOverrideApproved ? "확인했어요" : "세금이 나올 수 있어요"}</strong>
    <p>현재 평가액은 ${formatWon(valuation.assessedValue)}이에요. 이 관계의 기준 ${formatLimit(safeLimit)}을 넘었어요.</p>
    ${amountTaxOverrideApproved ? "<p>결과 화면에서 예상 세금과 준비물을 볼게요.</p>" : '<button class="guard-action" type="button" data-continue-tax>이대로 결과 보기</button>'}
  `;
  updateWizardNavState();
}

function updateWizardNavState() {
  const stepKey = currentStep().key;
  const canAdvance = canAdvanceCurrentStep();
  nextButton.disabled = !canAdvance;
  nextButton.setAttribute("aria-disabled", String(!canAdvance));
  wizardNav.classList.toggle("is-pending", !canAdvance && stepKey !== "intro" && stepKey !== "result");
}

function formatLimit(value) {
  if (value % 10_000 === 9_999) return `약 ${Math.ceil(value / 10_000).toLocaleString("ko-KR")}만원 미만`;
  if (value % 10_000 === 0) return `${(value / 10_000).toLocaleString("ko-KR")}만원`;
  return formatWon(value);
}

function saveLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(readForm()));
  storageStatus.textContent = "임시저장됨";
  showToast("이 브라우저에 임시저장했습니다.");
}

function loadLocal() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    showToast("저장된 입력값이 없습니다.");
    return;
  }
  try {
    fillForm(JSON.parse(saved));
    recalculate();
    updateAccountCta();
    updateProgressiveFields();
    renderStep();
    storageStatus.textContent = "저장본 불러옴";
    showToast("이 브라우저에 저장된 입력값을 불러왔습니다.");
  } catch {
    showToast("저장본을 읽을 수 없습니다.");
  }
}

function exportJson() {
  const blob = new Blob([JSON.stringify(readForm(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `periodic-gift-tax-${formatDate(new Date())}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  closeOverlay(dataOverlay);
  showToast("입력값 백업 파일을 저장했습니다.");
}

function importJson(event) {
  const [file] = event.target.files;
  event.target.value = "";
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      fillForm(JSON.parse(String(reader.result)));
      recalculate();
      updateAccountCta();
      updateProgressiveFields();
      renderStep();
      storageStatus.textContent = "백업 불러옴";
      closeOverlay(dataOverlay);
      showToast("백업 파일의 입력값을 불러왔습니다.");
    } catch {
      showToast("백업 파일을 읽을 수 없습니다.");
    }
  });
  reader.readAsText(file);
}

function clearAll() {
  localStorage.removeItem(STORAGE_KEY);
  amountTaxOverrideApproved = false;
  fillForm(defaultInput);
  storageStatus.textContent = "저장 안 됨";
  recalculate();
  updateAccountCta();
  currentStepIndex = 0;
  renderStep();
  showToast("입력값과 임시저장을 초기화했습니다.");
}

function openOverlay(overlay) {
  overlay.hidden = false;
  document.body.classList.add("modal-open");
}

function closeOverlay(overlay) {
  overlay.hidden = true;
  if (ruleOverlay.hidden && dataOverlay.hidden) {
    document.body.classList.remove("modal-open");
  }
}

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2400);
}

function hideToast() {
  clearTimeout(toastTimer);
  toast.textContent = "";
  toast.classList.remove("is-visible");
}

function cleanupBrowserCache() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    }).catch(() => {});
  }
  if ("caches" in window) {
    caches.keys().then((keys) => {
      keys.filter((key) => key.startsWith("periodic-gift-tax")).forEach((key) => caches.delete(key));
    }).catch(() => {});
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
