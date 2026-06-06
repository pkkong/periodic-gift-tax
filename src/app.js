import {
  calculateGiftTax,
  calculateValuation,
  formatDate,
  formatKoreanDate,
  formatWon,
  getSafeAssessmentLimit,
  normalizeInput,
  validateGiftInput
} from "./tax.js?v=5";
import { renderDocumentPack } from "./documents.js?v=5";

const STORAGE_KEY = "periodic-gift-tax-input-v1";
const form = document.querySelector("#giftForm");
const storageStatus = document.querySelector("#storageStatus");
const resultCards = document.querySelector("#resultCards");
const scheduleRows = document.querySelector("#scheduleRows");
const validationList = document.querySelector("#validationList");
const deadlineSummary = document.querySelector("#deadlineSummary");
const documentPreview = document.querySelector("#documentPreview");
const toast = document.querySelector("#toast");
const importFile = document.querySelector("#importFile");
const ruleOverlay = document.querySelector("#ruleOverlay");
const dataOverlay = document.querySelector("#dataOverlay");
const stepElements = Array.from(document.querySelectorAll(".wizard-step"));
const stepCount = document.querySelector("#stepCount");
const stepTitle = document.querySelector("#stepTitle");
const progressBar = document.querySelector("#progressBar");
const backButton = document.querySelector("#backButton");
const nextButton = document.querySelector("#nextButton");
const amountGuard = document.querySelector("#amountGuard");
const accountCta = document.querySelector("#accountCta");
const accountCreateButton = document.querySelector("#accountCreateButton");

const STEPS = [
  { key: "donor", title: "증여자 정보" },
  { key: "recipient", title: "수증자 정보" },
  { key: "account", title: "수증자 계좌가 있나요?" },
  { key: "amount", title: "얼마를 증여할까요?" },
  { key: "result", title: "신고 준비 결과" }
];

const defaultInput = normalizeInput({
  giftDate: formatDate(new Date()),
  firstPaymentDate: formatDate(new Date()),
  monthlyAmount: 200_000,
  totalMonths: 120,
  recipientHasAccount: "yes",
  accountReady: false,
  relationshipType: "parent_minor_child"
});

let toastTimer = 0;
let currentStepIndex = 0;

bootstrap();

function bootstrap() {
  fillForm(defaultInput);
  bindEvents();
  recalculate();
  updateAccountCta();
  renderStep();
  cleanupBrowserCache();
}

function bindEvents() {
  form.addEventListener("input", () => {
    syncFirstPaymentDate();
    recalculate();
    updateAccountCta();
  });

  document.querySelector("#printButton").addEventListener("click", printDocuments);
  document.querySelector("#printButtonDocuments").addEventListener("click", printDocuments);
  backButton.addEventListener("click", previousStep);
  nextButton.addEventListener("click", nextStep);
  document.querySelector("#ruleButton").addEventListener("click", () => openOverlay(ruleOverlay));
  document.querySelector("#dataButton").addEventListener("click", () => openOverlay(dataOverlay));
  accountCreateButton.addEventListener("click", markAccountReady);
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

function syncFirstPaymentDate() {
  const giftDate = form.elements.giftDate.value;
  const firstPaymentDate = form.elements.firstPaymentDate.value;
  if (giftDate && !firstPaymentDate) {
    form.elements.firstPaymentDate.value = giftDate;
  }
}

function recalculate() {
  const input = readForm();
  const validation = validateGiftInput(input);
  const valuation = calculateValuation(validation.input);
  const tax = calculateGiftTax(validation.input, valuation);
  renderResults(validation.input, valuation, tax, validation.errors, validation.warnings);
  renderDocuments(validation.input, valuation, tax, validation.errors, validation.warnings);
  renderAmountGuard(valuation);
}

function renderResults(input, valuation, tax, errors, warnings) {
  deadlineSummary.textContent = tax.filingDeadline
    ? `신고기한 ${formatKoreanDate(tax.filingDeadline)}`
    : "신고기한 산정 전";

  const metrics = [
    {
      label: "증여 관계",
      value: tax.relationshipLabel,
      sub: tax.generationSkippingTax > 0 ? `세대생략 할증 ${formatWon(tax.generationSkippingTax)}` : "일반 관계"
    },
    {
      label: "증여재산 평가액",
      value: formatWon(valuation.assessedValue),
      sub: valuation.capApplied ? "20배 상한 적용" : "현재가치 합계 적용"
    },
    {
      label: "증여재산공제",
      value: formatWon(tax.deductionApplied),
      sub: `잔여 공제 ${formatWon(tax.availableDeduction)}`
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

  scheduleRows.innerHTML = valuation.schedule
    .map(
      (row) => `
        <tr>
          <td>${row.yearOffset}년차</td>
          <td>${formatKoreanDate(row.periodStartDate)} ~ ${formatKoreanDate(row.periodEndDate)}</td>
          <td>${row.months.toLocaleString("ko-KR")}</td>
          <td>${formatWon(row.periodPayment)}</td>
          <td>${row.yearOffset}년 (${row.discountFactor.toFixed(6)})</td>
          <td>${formatWon(row.presentValue)}</td>
        </tr>
      `
    )
    .join("");

  renderValidation(input, errors, warnings, tax);
}

function renderValidation(input, errors, warnings, tax) {
  const notices = [];
  notices.push({
    type: "info",
    text: "상증세법 시행령 제62조, 시행규칙 제19조의2, 국세청 증여세 신고 안내를 2026-06-06 기준으로 반영했습니다."
  });
  notices.push({
    type: "info",
    text: `신고세액공제는 ${formatKoreanDate(tax.filingDeadline)}까지 신고하는 경우로 계산했습니다.`
  });
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

  validationList.innerHTML = notices
    .map((notice) => `<div class="notice ${notice.type === "info" ? "" : notice.type}">${escapeHtml(notice.text)}</div>`)
    .join("");
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
    } else {
      element.value = value;
    }
  }
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
}

function previousStep() {
  hideToast();
  currentStepIndex = Math.max(0, currentStepIndex - 1);
  renderStep();
}

function renderStep() {
  const step = currentStep();
  stepElements.forEach((element) => {
    element.classList.toggle("is-active", element.dataset.step === step.key);
  });
  stepCount.textContent = `${currentStepIndex + 1} / ${STEPS.length}`;
  stepTitle.textContent = step.title;
  progressBar.style.width = `${((currentStepIndex + 1) / STEPS.length) * 100}%`;
  backButton.disabled = currentStepIndex === 0;
  nextButton.textContent = step.key === "amount" ? "결과 보기" : step.key === "result" ? "PDF 저장" : "다음";
}

function currentStep() {
  return STEPS[currentStepIndex];
}

function validateCurrentStep() {
  const step = currentStep().key;
  if (step === "donor" && !form.elements.donorName.value.trim()) {
    showToast("증여자 성명을 입력하세요.");
    form.elements.donorName.focus();
    return false;
  }
  if (step === "recipient" && !form.elements.recipientName.value.trim()) {
    showToast("수증자 성명을 입력하세요.");
    form.elements.recipientName.focus();
    return false;
  }
  if (step === "account" && form.elements.recipientHasAccount.value === "no" && !form.elements.accountReady.checked) {
    showToast("수증자 명의 계좌를 준비한 뒤 진행하세요.");
    accountCta.scrollIntoView({ block: "nearest" });
    return false;
  }
  if (step === "amount") {
    const validation = validateGiftInput(readForm());
    if (validation.input.monthlyAmount <= 0 || validation.input.totalMonths <= 0) {
      showToast("월 납입액과 총 납입개월을 입력하세요.");
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

function updateAccountCta() {
  accountCta.hidden = form.elements.recipientHasAccount.value !== "no";
}

function markAccountReady() {
  form.elements.accountReady.checked = true;
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
