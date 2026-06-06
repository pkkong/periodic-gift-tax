import {
  calculateGiftTax,
  calculateValuation,
  formatDate,
  formatKoreanDate,
  formatWon,
  getSafeAssessmentLimit,
  normalizeInput,
  validateGiftInput
} from "./tax.js?v=11";
import { renderDocumentPack } from "./documents.js?v=11";

const STORAGE_KEY = "periodic-gift-tax-input-v1";
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

const STEPS = [
  { key: "intro", title: "시작" },
  { key: "donor", title: "증여자 정보" },
  { key: "recipient", title: "수증자 정보" },
  { key: "account", title: "수증자 계좌가 있나요?" },
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
const confirmedFields = new Set();
const confirmedValues = new Map();
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
  renderStep();
  cleanupBrowserCache();
}

function bindEvents() {
  form.addEventListener("input", () => {
    syncFirstPaymentDate();
    handleConfirmedValueChanges();
    syncRecipientDefaults();
    updateModeUi();
    updateProgressiveFields();
    recalculate();
  });
  form.addEventListener("keydown", handleFormEnterKey);

  introStartButton.addEventListener("click", () => {
    currentStepIndex = 1;
    renderStep();
    scrollToTop();
  });
  fieldConfirmButtons.forEach((button) => {
    button.addEventListener("click", () => confirmField(button.dataset.confirmField));
  });
  document.querySelector("#printButton").addEventListener("click", printDocuments);
  document.querySelector("#printButtonDocuments").addEventListener("click", printDocuments);
  backButton.addEventListener("click", previousStep);
  nextButton.addEventListener("click", nextStep);
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
      resetAmountConfirmations();
      setRecommendedAmountDefaults();
      updateModeUi();
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

function handleFormEnterKey(event) {
  if (event.key !== "Enter") return;
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;
  event.preventDefault();

  const field = target.closest("[data-field]");
  const fieldName = field?.dataset.field;
  if (fieldName && !field.hidden && !confirmedFields.has(fieldName)) {
    confirmField(fieldName);
    if (shouldAdvanceAfterEnterConfirm(fieldName)) {
      nextStep();
    }
    return;
  }

  if (canAdvanceCurrentStep()) {
    nextStep();
    return;
  }

  const confirmButton = field?.querySelector("[data-confirm-field]");
  if (confirmButton instanceof HTMLButtonElement) {
    confirmButton.click();
  }
}

function shouldAdvanceAfterEnterConfirm(fieldName) {
  const step = currentStep().key;
  if (!canAdvanceCurrentStep()) return false;
  if (step === "donor") return fieldName === "donorId";
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
  if (!form.elements.guardianName.value && form.elements.donorName.value) {
    form.elements.guardianName.value = form.elements.donorName.value;
  }
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
  if (input.giftMode === "periodic" && !form.elements.totalMonths.value) {
    form.elements.totalMonths.value = "120";
  }
}

function calculateRecommendedMonthly(input, safeLimit) {
  const baseInput = { ...input, giftMode: "periodic", totalMonths: 120 };
  let low = 0;
  let high = Math.max(1, Math.ceil(safeLimit / 120));
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
  return Math.floor(low / 1000) * 1000;
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
  safeTitle.textContent = `${tax.relationshipLabel} 기준으로 먼저 볼게요`;
  safeLimitText.textContent = `10년간 ${formatLimit(safeLimit)}은 증여세 없이 설계할 수 있어요.`;
  safeBreakdown.innerHTML = `
    <div><span>증여재산공제</span><strong>${formatWon(tax.availableDeduction)}</strong></div>
    <div><span>과세표준 50만원 미만</span><strong>부과 제외</strong></div>
  `;
  safeNote.textContent = tax.generationSkippingRate > 0
    ? "조부모가 손자녀에게 증여하는 경우 세대생략 할증이 붙을 수 있어 한도를 넘기지 않는 설계가 더 중요합니다."
    : "최근 10년 내 같은 증여자로부터 받은 증여가 있으면 이 범위가 줄어들 수 있습니다.";
}

function renderModeHints(input) {
  const safeLimit = getSafeAssessmentLimit(input);
  const recommendedMonthly = calculateRecommendedMonthly(input, safeLimit);
  modeHint.textContent = input.giftMode === "lump_sum"
    ? `${formatLimit(safeLimit)} 현금 일시증여를 기준으로 계산합니다.`
    : `10년 정기증여라면 현재 조건에서 매월 약 ${formatWon(recommendedMonthly)}까지 설계할 수 있습니다.`;
  amountTitle.textContent = input.giftMode === "lump_sum" ? "한번에 증여할 조건을 입력하세요" : "정기증여 조건을 입력하세요";
  amountHint.textContent = input.giftMode === "lump_sum"
    ? `이번 증여금액이 ${formatLimit(safeLimit)}을 넘으면 증여세가 나올 수 있습니다.`
    : `10년 기준 추천 월 납입액은 약 ${formatWon(recommendedMonthly)}입니다.`;
}

function renderResults(input, valuation, tax, errors, warnings) {
  renderResultBasis(input);
  const safeLimit = getSafeAssessmentLimit(input);
  const hasErrors = errors.length > 0;
  const hasTax = tax.payableTax > 0;

  resultStatus.classList.toggle("has-tax", hasTax);
  resultStatus.classList.toggle("has-error", hasErrors);
  resultStatusLabel.textContent = hasErrors ? "입력 확인 필요" : hasTax ? "납부세액 발생" : "증여세 0원 예상";
  resultTaxAmount.textContent = hasErrors ? "계산값 확인 필요" : hasTax ? `납부세액 ${formatWon(tax.payableTax)}` : "납부세액 0원";
  resultLead.textContent = hasErrors
    ? "필수 입력값을 보완한 뒤 홈택스 신고 준비팩을 저장하세요."
    : `${tax.relationshipLabel} 기준 평가액 ${formatWon(valuation.assessedValue)}, 과세표준 ${formatWon(tax.taxBase)}으로 계산했습니다.`;
  deadlineSummary.textContent = tax.filingDeadline
    ? `신고기한 ${formatKoreanDate(tax.filingDeadline)}`
    : "신고기한 산정 전";

  const metrics = [
    {
      label: "평가액",
      value: formatWon(valuation.assessedValue),
      sub: valuation.capApplied ? "20배 상한 적용" : "현재가치 합계 적용"
    },
    {
      label: "무세금 안전 기준",
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
      ? "수증자 명의 계좌로 증여금을 이체하고 이체내역을 보관하세요."
      : "수증자 명의 계좌를 먼저 준비한 뒤 증여금을 이체하세요.",
    input.giftMode === "periodic"
      ? `약정서에 매월 ${formatWon(input.monthlyAmount)}씩 ${input.totalMonths.toLocaleString("ko-KR")}개월 지급 조건을 기재하세요.`
      : `현금 증여 확인서에 ${formatWon(input.lumpSumAmount)} 증여 사실을 기재하세요.`,
    `${formatKoreanDate(tax.filingDeadline)}까지 홈택스 증여세 신고 화면에 계산값을 옮겨 적으세요.`,
    "가족관계증명서, 이체계획 또는 이체내역, PDF 서류팩을 첨부자료로 준비하세요."
  ]
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");

  resultFilingMeta.innerHTML = [
    ["증여 관계", tax.relationshipLabel],
    ["평가 방식", input.giftMode === "periodic" ? "유기정기금 현재가치 평가" : "현금 일시증여 평가"],
    ["신고 기준일", "2026.06.06 확인 기준"],
    ["세대생략 할증", tax.generationSkippingRate > 0 ? `${(tax.generationSkippingRate * 100).toFixed(0)}% 반영` : "해당 없음"]
  ]
    .map(([label, value]) => `<article><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`)
    .join("");

  resultDocsSummary.textContent = input.giftMode === "periodic"
    ? "유기정기금 평가명세서, 증여세 신고서 초안, 증여약정서, 홈택스 체크리스트를 인쇄합니다."
    : "현금 증여 명세서, 증여세 신고서 초안, 현금 증여 확인서, 홈택스 체크리스트를 인쇄합니다.";

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

function renderResultBasis(input) {
  const items = input.giftMode === "lump_sum"
    ? ["현금", "일시증여", "홈택스 신고 준비", "2026.06.06 기준"]
    : ["현금", "매월 고정액", "유기정기금", "2026.06.06 기준"];
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
  updateProgressiveFields();
}

function printDocuments() {
  currentStepIndex = STEPS.length - 1;
  renderStep();
  requestAnimationFrame(() => window.print());
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
  nextButton.disabled = !canAdvanceCurrentStep();
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
  if (stepKey === "account") return "증여 가능 범위 보기";
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
    if (!isRecipientComplete()) return requireConfirmedFields(["recipientName", "recipientAddress", "guardianName", "recipientId"], "수증자 정보를 순서대로 확인하세요.");
  }
  if (step === "account" && form.elements.recipientHasAccount.value === "no" && !form.elements.accountReady.checked) {
    showToast("수증자 명의 계좌를 준비한 뒤 진행하세요.");
    return false;
  }
  if (step === "amount") {
    const validation = validateGiftInput(readForm());
    if (!isAmountComplete()) {
      showToast("증여 조건을 순서대로 확인하세요.");
      return false;
    }
    const valuation = calculateValuation(validation.input);
    const safeLimit = getSafeAssessmentLimit(validation.input);
    if (valuation.assessedValue > safeLimit) {
      renderAmountGuard(valuation);
      showToast(`평가액이 ${formatLimit(safeLimit)}을 넘어 증여세가 나올 수 있습니다.`);
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
  if (step === "amount") return isAmountComplete();
  return true;
}

function isDonorComplete() {
  return ["donorName", "donorAddress", "donorPhone", "donorId"].every((field) => confirmedFields.has(field));
}

function isRecipientComplete() {
  return ["recipientName", "recipientAddress", "guardianName", "recipientId"].every((field) => confirmedFields.has(field));
}

function isAmountComplete() {
  const input = readForm();
  if (input.giftMode === "lump_sum") return confirmedFields.has("giftDate") && confirmedFields.has("lumpSumAmount");
  return ["giftDate", "firstPaymentDate", "monthlyAmount", "totalMonths"].every((field) => confirmedFields.has(field));
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
  nextButton.disabled = !canAdvanceCurrentStep();
}

function confirmField(fieldName) {
  if (!validateField(fieldName)) return;
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
  recalculate();
  focusNextField(fieldName);
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
      showToast("주민등록번호는 생년월일 6자리와 뒤 첫 자리 또는 전체 번호로 입력하세요.");
      element.focus();
      return false;
    }
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
  return /^\d{6}[1-8]$/.test(digits) || /^\d{6}[1-8]\d{6}$/.test(digits);
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
  showToast("계좌 준비 완료로 표시했습니다.");
}

function renderAmountGuard(valuation) {
  const input = readForm();
  const safeLimit = getSafeAssessmentLimit(input);
  if (valuation.assessedValue <= safeLimit) {
    amountGuard.hidden = true;
    amountGuard.innerHTML = "";
    return;
  }
  amountGuard.hidden = false;
  amountGuard.innerHTML = `
    <strong>증여세가 나올 수 있습니다.</strong>
    <p>현재 평가액은 ${formatWon(valuation.assessedValue)}입니다. 이 관계의 안전 기준 ${formatLimit(safeLimit)}을 넘으면 공제와 과세최저한을 지나 세금이 발생할 수 있어 결과 단계로 진행하지 않습니다.</p>
  `;
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
