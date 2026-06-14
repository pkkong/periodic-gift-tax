/* eslint-disable react-refresh/only-export-components */
import { openPDFViewer, saveBase64Data } from "@apps-in-toss/web-framework";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

// Keep the Apps in Toss calculation engine identical to the public webapp.
import { calculateGiftTax, calculateValuation, getSafeAssessmentLimit, validateGiftInput } from "../../src/tax.js";

import "./index.css";

const PDF_FILE_NAME = "우리-아기-증여-신고-준비.pdf";

type GiftMode = "lump_sum" | "periodic";
type RelationshipType =
  | "parent_minor_child"
  | "parent_adult_child"
  | "adult_child_parent"
  | "grandparent_minor_grandchild"
  | "grandparent_adult_grandchild";

type PriorGiftState = "no" | "yes";

type FormState = {
  donorName: string;
  recipientName: string;
  relationshipType: RelationshipType;
  giftMode: GiftMode;
  giftDate: string;
  firstPaymentDate: string;
  lumpSumAmount: string;
  monthlyAmount: string;
  totalMonths: string;
  priorGiftState: PriorGiftState;
  priorSameDonorGiftValue: string;
  priorDeductionUsed: string;
  priorGiftTaxPaid: string;
};

type ValuationResult = {
  presentValue: number;
  presentValueRounded: number;
  capValue: number;
  assessedValue: number;
  totalPayments: number;
  paymentEndDate: string;
  capApplied: boolean;
  schedule: Array<{
    paymentYear: number;
    yearOffset: number;
    periodStartDate: string;
    periodEndDate: string;
    months: number;
    periodPayment: number;
    discountFactor: number;
    presentValue: number;
  }>;
};

type TaxResult = {
  availableDeduction: number;
  deductionApplied: number;
  taxBase: number;
  calculatedTax: number;
  priorTaxCredit: number;
  filingCredit: number;
  payableTax: number;
  generationSkippingTax: number;
  generationSkippingRate: number;
  relationshipLabel: string;
  rate: number;
  progressiveDeduction: number;
  minimumRuleApplied: boolean;
  filingCreditApplied: boolean;
  filingDeadline: string;
};

type CalculationResult = {
  input: Record<string, unknown>;
  valuation: ValuationResult;
  tax: TaxResult;
  safeLimit: number;
  errors: string[];
  warnings: string[];
};

const relationships: Array<{ value: RelationshipType; label: string; helper: string }> = [
  { value: "parent_minor_child", label: "부모가 미성년 자녀에게", helper: "10년 합산 공제 2천만원 기준" },
  { value: "parent_adult_child", label: "부모가 성년 자녀에게", helper: "10년 합산 공제 5천만원 기준" },
  { value: "adult_child_parent", label: "성년 자녀가 부모에게", helper: "10년 합산 공제 5천만원 기준" },
  { value: "grandparent_minor_grandchild", label: "조부모가 미성년 손자녀에게", helper: "2천만원 공제와 세대생략 할증 확인" },
  { value: "grandparent_adult_grandchild", label: "조부모가 성년 손자녀에게", helper: "5천만원 공제와 세대생략 할증 확인" },
];

const today = formatDate(new Date());

const initialForm: FormState = {
  donorName: "",
  recipientName: "",
  relationshipType: "parent_minor_child",
  giftMode: "periodic",
  giftDate: today,
  firstPaymentDate: today,
  lumpSumAmount: "20000000",
  monthlyAmount: "100000",
  totalMonths: "120",
  priorGiftState: "no",
  priorSameDonorGiftValue: "0",
  priorDeductionUsed: "0",
  priorGiftTaxPaid: "0",
};

const hometaxSteps = [
  "증여세 정기신고 메뉴로 이동",
  "증여자와 수증자 기본 정보 입력",
  "현금 또는 정기금 평가액 입력",
  "증여재산공제와 기납부세액 대조",
  "이체확인증과 가족관계 증빙 첨부",
  "제출 전 세무서 또는 전문가와 최종 확인",
];

function App() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isPdfBusy, setIsPdfBusy] = useState(false);
  const [toast, setToast] = useState("");

  const result = useMemo(() => calculateCurrent(form), [form]);
  const hasTax = result.tax.payableTax > 0;
  const canShowPdf = result.errors.length === 0;

  const update = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "giftDate" && !current.firstPaymentDate) {
        next.firstPaymentDate = String(value);
      }
      if (key === "priorGiftState" && value === "no") {
        next.priorSameDonorGiftValue = "0";
        next.priorDeductionUsed = "0";
        next.priorGiftTaxPaid = "0";
      }
      return next;
    });
  };

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => {
      setToast((current) => (current === message ? "" : current));
    }, 2600);
  };

  const runPdfAction = async (action: "preview" | "save") => {
    if (isPdfBusy) return;
    if (!canShowPdf) {
      showToast("필수 값을 먼저 확인해주세요.");
      return;
    }

    setIsPdfBusy(true);
    setIsPreviewVisible(true);
    showToast("PDF를 만들고 있어요.");

    window.setTimeout(async () => {
      try {
        const data = await createPdfBase64();
        if (action === "preview") {
          await openPdfOrDownload(data);
          showToast("PDF 미리보기를 열었어요.");
        } else {
          await savePdfOrDownload(data);
          showToast("PDF 저장을 열었어요.");
        }
      } catch (error) {
        console.error(error);
        showToast("PDF 저장이 안 열렸어요. 미리보기를 확인해주세요.");
      } finally {
        setIsPdfBusy(false);
      }
    }, 0);
  };

  return (
    <main className="app">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">증여세 시뮬레이션</p>
          <h1>아이에게 보낼 금액, 세금과 신고기한을 먼저 확인해요</h1>
          <p>현금 증여와 매월 정기 증여를 같은 계산 기준으로 비교하고 신고 준비 PDF까지 저장해요.</p>
        </div>
        <BabyMascot />
      </section>

      <section className={`result-banner ${hasTax ? "has-tax" : ""}`}>
        <span>{hasTax ? "세금이 나올 수 있어요" : "예상 납부세액 0원"}</span>
        <strong>{result.errors.length ? "입력값 확인 필요" : formatWon(result.tax.payableTax)}</strong>
        <p>
          신고기한 {result.tax.filingDeadline ? formatKoreanDate(result.tax.filingDeadline) : "확인 필요"} · 평가액{" "}
          {formatWon(result.valuation.assessedValue)}
        </p>
      </section>

      <section className="panel" aria-labelledby="basic-title">
        <SectionHeading index="01" title="기본 정보" id="basic-title" />
        <div className="field-grid">
          <TextField label="보내는 분" value={form.donorName} onChange={(value) => update("donorName", value)} />
          <TextField label="받는 분" value={form.recipientName} onChange={(value) => update("recipientName", value)} />
        </div>
        <div className="choice-list" role="radiogroup" aria-label="증여 관계">
          {relationships.map((relationship) => (
            <ChoiceCard
              key={relationship.value}
              active={form.relationshipType === relationship.value}
              title={relationship.label}
              helper={relationship.helper}
              onClick={() => update("relationshipType", relationship.value)}
            />
          ))}
        </div>
      </section>

      <section className="panel" aria-labelledby="amount-title">
        <SectionHeading index="02" title="증여 방식과 금액" id="amount-title" />
        <div className="segmented" role="radiogroup" aria-label="증여 방식">
          <SegmentButton active={form.giftMode === "periodic"} onClick={() => update("giftMode", "periodic")}>
            매월 보내기
          </SegmentButton>
          <SegmentButton active={form.giftMode === "lump_sum"} onClick={() => update("giftMode", "lump_sum")}>
            한번에 보내기
          </SegmentButton>
        </div>
        <div className="field-grid">
          <TextField type="date" label="증여일" value={form.giftDate} onChange={(value) => update("giftDate", value)} />
          {form.giftMode === "periodic" ? (
            <TextField
              type="date"
              label="첫 이체일"
              value={form.firstPaymentDate}
              onChange={(value) => update("firstPaymentDate", value)}
            />
          ) : null}
        </div>
        {form.giftMode === "periodic" ? (
          <div className="field-grid">
            <MoneyField label="월 납입액" value={form.monthlyAmount} onChange={(value) => update("monthlyAmount", value)} />
            <MoneyField label="총 납입개월" value={form.totalMonths} onChange={(value) => update("totalMonths", value)} suffix="개월" />
          </div>
        ) : (
          <MoneyField label="증여금액" value={form.lumpSumAmount} onChange={(value) => update("lumpSumAmount", value)} />
        )}
      </section>

      <section className="panel" aria-labelledby="history-title">
        <SectionHeading index="03" title="최근 10년 증여 이력" id="history-title" />
        <div className="segmented" role="radiogroup" aria-label="같은 사람에게 받은 증여 이력">
          <SegmentButton active={form.priorGiftState === "no"} onClick={() => update("priorGiftState", "no")}>
            없어요
          </SegmentButton>
          <SegmentButton active={form.priorGiftState === "yes"} onClick={() => update("priorGiftState", "yes")}>
            있어요
          </SegmentButton>
        </div>
        {form.priorGiftState === "yes" ? (
          <div className="field-grid">
            <MoneyField
              label="이전 증여가액"
              value={form.priorSameDonorGiftValue}
              onChange={(value) => update("priorSameDonorGiftValue", value)}
            />
            <MoneyField label="이미 쓴 공제" value={form.priorDeductionUsed} onChange={(value) => update("priorDeductionUsed", value)} />
            <MoneyField
              label="이미 낸 증여세"
              value={form.priorGiftTaxPaid}
              onChange={(value) => update("priorGiftTaxPaid", value)}
            />
          </div>
        ) : null}
      </section>

      <section className="panel" aria-labelledby="result-title">
        <SectionHeading index="04" title="계산 결과" id="result-title" />
        <MetricGrid result={result} />
        <IssueList errors={result.errors} warnings={result.warnings} />
      </section>

      <section className="panel" aria-labelledby="hometax-title">
        <SectionHeading index="05" title="홈택스 신고 준비" id="hometax-title" />
        <ol className="timeline">
          {hometaxSteps.map((step, index) => (
            <li key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{step}</p>
            </li>
          ))}
        </ol>
        <div className="button-row">
          <button className="secondary" type="button" onClick={() => setIsPreviewVisible((value) => !value)}>
            PDF 미리보기
          </button>
          <button className="primary" type="button" disabled={isPdfBusy || !canShowPdf} onClick={() => void runPdfAction("save")}>
            PDF 저장
          </button>
        </div>
        <button className="text-action" type="button" disabled={isPdfBusy || !canShowPdf} onClick={() => void runPdfAction("preview")}>
          PDF로 열기
        </button>
      </section>

      <section className="notice">
        <strong>참고용 계산이에요</strong>
        <p>자동 신고, 세무 대리, 확정 세액 보증, 홈택스 로그인/제출, 서버 저장은 제공하지 않아요.</p>
      </section>

      <div className={`document-preview ${isPreviewVisible ? "is-visible" : ""}`} id="documentPreview">
        <PrintPack form={form} result={result} />
      </div>

      <div className={`toast ${toast ? "is-visible" : ""}`} role="status">
        {toast}
      </div>
    </main>
  );
}

function SectionHeading({ id, index, title }: { id: string; index: string; title: string }) {
  return (
    <div className="section-heading">
      <span>{index}</span>
      <h2 id={id}>{title}</h2>
    </div>
  );
}

function TextField({
  label,
  onChange,
  type = "text",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  type?: "date" | "text";
  value: string;
}) {
  return (
    <label className="text-field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function MoneyField({
  label,
  onChange,
  suffix = "원",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  suffix?: string;
  value: string;
}) {
  return (
    <label className="text-field money-field">
      <span>{label}</span>
      <div>
        <input inputMode="numeric" value={formatInputNumber(value)} onChange={(event) => onChange(stripNumber(event.target.value))} />
        <em>{suffix}</em>
      </div>
    </label>
  );
}

function SegmentButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button className={active ? "is-active" : ""} type="button" aria-pressed={active} onClick={onClick}>
      {children}
    </button>
  );
}

function ChoiceCard({
  active,
  helper,
  onClick,
  title,
}: {
  active: boolean;
  helper: string;
  onClick: () => void;
  title: string;
}) {
  return (
    <button className={active ? "choice-card is-active" : "choice-card"} type="button" aria-pressed={active} onClick={onClick}>
      <span>{title}</span>
      <small>{helper}</small>
    </button>
  );
}

function MetricGrid({ result }: { result: CalculationResult }) {
  const metrics = [
    ["증여재산 평가액", formatWon(result.valuation.assessedValue)],
    ["세금 없는 기준", formatWon(result.safeLimit)],
    ["사용 가능 공제", formatWon(result.tax.availableDeduction)],
    ["과세표준", formatWon(result.tax.taxBase)],
    ["예상 산출세액", formatWon(result.tax.calculatedTax)],
    ["신고세액공제", formatWon(result.tax.filingCredit)],
    ["예상 납부세액", formatWon(result.tax.payableTax)],
    ["신고기한", result.tax.filingDeadline ? formatKoreanDate(result.tax.filingDeadline) : "확인 필요"],
  ];

  return (
    <div className="metric-grid">
      {metrics.map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

function IssueList({ errors, warnings }: { errors: string[]; warnings: string[] }) {
  if (errors.length === 0 && warnings.length === 0) return null;
  return (
    <div className="issue-list">
      {errors.map((error) => (
        <p className="error" key={error}>
          {error}
        </p>
      ))}
      {warnings.map((warning) => (
        <p key={warning}>{warning}</p>
      ))}
    </div>
  );
}

function BabyMascot() {
  return (
    <div className="mascot" aria-hidden="true">
      <svg viewBox="0 0 120 120" focusable="false">
        <rect width="120" height="120" rx="34" fill="#e8f3ff" />
        <path d="M28 78c0-20 15-33 32-33s32 13 32 33v7c0 14-13 23-32 23s-32-9-32-23v-7Z" fill="#b9dcff" />
        <path d="M39 80c13 9 29 9 42 0" fill="none" stroke="#7ab8ff" strokeWidth="5" strokeLinecap="round" />
        <path d="M31 43c-8 1-11 7-8 13 3 7 10 8 15 3" fill="#ffd9bd" />
        <path d="M89 43c8 1 11 7 8 13-3 7-10 8-15 3" fill="#ffd9bd" />
        <path d="M60 15c20 0 34 14 34 34S80 84 60 84 26 69 26 49 40 15 60 15Z" fill="#ffe7d0" />
        <path d="M52 18c11-3 19 3 12 11 9 0 15 8 5 15" fill="none" stroke="#7b4b2a" strokeWidth="5" strokeLinecap="round" />
        <circle cx="45" cy="58" r="7" fill="#ffb6ad" opacity=".65" />
        <circle cx="75" cy="58" r="7" fill="#ffb6ad" opacity=".65" />
        <circle cx="49" cy="47" r="4" fill="#25313d" />
        <circle cx="71" cy="47" r="4" fill="#25313d" />
        <path d="M51 65c6 7 14 7 20 0" fill="none" stroke="#25313d" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function PrintPack({ form, result }: { form: FormState; result: CalculationResult }) {
  return (
    <div className="print-pack">
      <section className="print-page">
        <header>
          <p>우리 아기 증여 도우미</p>
          <h2>증여세 신고 준비 요약</h2>
        </header>
        <dl>
          <div>
            <dt>보내는 분</dt>
            <dd>{form.donorName || "미입력"}</dd>
          </div>
          <div>
            <dt>받는 분</dt>
            <dd>{form.recipientName || "미입력"}</dd>
          </div>
          <div>
            <dt>증여 관계</dt>
            <dd>{result.tax.relationshipLabel}</dd>
          </div>
          <div>
            <dt>증여 방식</dt>
            <dd>{form.giftMode === "periodic" ? "매월 정기 증여" : "일시 현금 증여"}</dd>
          </div>
          <div>
            <dt>평가액</dt>
            <dd>{formatWon(result.valuation.assessedValue)}</dd>
          </div>
          <div>
            <dt>예상 납부세액</dt>
            <dd>{formatWon(result.tax.payableTax)}</dd>
          </div>
          <div>
            <dt>신고기한</dt>
            <dd>{result.tax.filingDeadline ? formatKoreanDate(result.tax.filingDeadline) : "확인 필요"}</dd>
          </div>
        </dl>
        <h3>계산 기준</h3>
        <ul>
          <li>사용 가능 공제: {formatWon(result.tax.availableDeduction)}</li>
          <li>공제 후 과세표준: {formatWon(result.tax.taxBase)}</li>
          <li>세율과 누진공제: {(result.tax.rate * 100).toFixed(0)}%, {formatWon(result.tax.progressiveDeduction)}</li>
          <li>세대생략 할증세액: {formatWon(result.tax.generationSkippingTax)}</li>
          <li>기납부세액공제: {formatWon(result.tax.priorTaxCredit)}</li>
          <li>신고세액공제: {formatWon(result.tax.filingCredit)}</li>
        </ul>
        <h3>홈택스 입력 순서</h3>
        <ol>
          {hometaxSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <footer>이 문서는 사용자가 입력한 값으로 만든 참고용 자료입니다. 세무 대리나 확정 세액 보증이 아닙니다.</footer>
      </section>
    </div>
  );
}

function calculateCurrent(form: FormState): CalculationResult {
  const rawInput = {
    donorName: form.donorName || "증여자",
    donorId: "",
    donorAddress: "",
    donorPhone: "",
    recipientName: form.recipientName || "수증자",
    recipientId: "",
    recipientAddress: "",
    guardianName: "",
    taxOffice: "",
    giftDate: form.giftDate,
    firstPaymentDate: form.firstPaymentDate || form.giftDate,
    giftMode: form.giftMode,
    lumpSumAmount: parseNumber(form.lumpSumAmount),
    monthlyAmount: parseNumber(form.monthlyAmount),
    totalMonths: parseNumber(form.totalMonths),
    priorSameDonorGiftValue: form.priorGiftState === "yes" ? parseNumber(form.priorSameDonorGiftValue) : 0,
    priorDeductionUsed: form.priorGiftState === "yes" ? parseNumber(form.priorDeductionUsed) : 0,
    priorGiftTaxPaid: form.priorGiftState === "yes" ? parseNumber(form.priorGiftTaxPaid) : 0,
    recipientHasAccount: "yes",
    accountReady: true,
    relationshipType: form.relationshipType,
  };
  const validation = validateGiftInput(rawInput);
  const valuation = calculateValuation(validation.input) as ValuationResult;
  const tax = calculateGiftTax(validation.input, valuation) as TaxResult;
  const safeLimit = getSafeAssessmentLimit(validation.input) as number;
  return { input: validation.input, valuation, tax, safeLimit, errors: validation.errors, warnings: validation.warnings };
}

function parseNumber(value: string) {
  const parsed = Number(stripNumber(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function stripNumber(value: string) {
  return value.replace(/[^\d]/g, "");
}

function formatInputNumber(value: string) {
  const stripped = stripNumber(value);
  return stripped ? Number(stripped).toLocaleString("ko-KR") : "";
}

function formatWon(value: number) {
  return `${Math.round(value || 0).toLocaleString("ko-KR")}원`;
}

function formatKoreanDate(dateInput: string) {
  if (!dateInput) return "";
  const [year, month, day] = dateInput.split("-").map(Number);
  if (!year || !month || !day) return dateInput;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(year, month - 1, day));
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function createPdfBase64() {
  const preview = document.querySelector<HTMLElement>("#documentPreview");
  if (!preview?.innerHTML.trim()) {
    throw new Error("Document preview is empty");
  }

  await document.fonts?.ready;

  const renderRoot = document.createElement("div");
  renderRoot.className = "pdf-render-root";
  renderRoot.innerHTML = preview.innerHTML;
  document.body.append(renderRoot);

  try {
    const page = renderRoot.querySelector<HTMLElement>(".print-page");
    if (!page) throw new Error("Document page is missing");

    const canvas = await html2canvas(page, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
    });

    const pdf = new jsPDF({ format: "a4", orientation: "portrait", unit: "mm" });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imageHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, pdfWidth, imageHeight, undefined, "FAST");
    return pdf.output("datauristring").split(",")[1] ?? "";
  } finally {
    renderRoot.remove();
  }
}

async function savePdfOrDownload(data: string) {
  try {
    await saveBase64Data({
      data,
      fileName: PDF_FILE_NAME,
      mimeType: "application/pdf",
    });
  } catch {
    downloadPdf(data);
  }
}

async function openPdfOrDownload(data: string) {
  try {
    await openPDFViewer({
      data,
      filename: PDF_FILE_NAME,
    });
  } catch {
    downloadPdf(data);
  }
}

function downloadPdf(data: string) {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = PDF_FILE_NAME;
  link.click();
  URL.revokeObjectURL(url);
}

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
