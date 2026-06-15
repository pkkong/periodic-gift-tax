/* eslint-disable react-refresh/only-export-components */
import { openPDFViewer, saveBase64Data } from "@apps-in-toss/web-framework";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";

const PDF_FILE_NAME = "우리-아기-증여-준비-체크리스트.pdf";
const GUIDE_BASE_DATE = "2026.06.15";
const MINOR_DEDUCTION_LABEL = "2,000만원";
const MINOR_SAFE_LIMIT_LABEL = "2,050만원 미만";
const ADULT_DEDUCTION_LABEL = "5,000만원";
const ADULT_SAFE_LIMIT_LABEL = "5,050만원 미만";
const PERIODIC_MINOR_EXAMPLE = "월 19만 6천원대";

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
  priorGiftState: PriorGiftState;
};

type GuideSummary = {
  relationshipLabel: string;
  deductionLabel: string;
  safeLimitLabel: string;
  modeTitle: string;
  modeDescription: string;
  modeBullets: string[];
  cautionBullets: string[];
};

const relationships: Array<{ value: RelationshipType; label: string; helper: string }> = [
  { value: "parent_minor_child", label: "부모가 미성년 자녀에게", helper: "10년 합산 공제 2천만원 기준" },
  { value: "parent_adult_child", label: "부모가 성년 자녀에게", helper: "10년 합산 공제 5천만원 기준" },
  { value: "adult_child_parent", label: "성년 자녀가 부모에게", helper: "10년 합산 공제 5천만원 기준" },
  { value: "grandparent_minor_grandchild", label: "조부모가 미성년 손자녀에게", helper: "2천만원 공제와 세대생략 할증 확인" },
  { value: "grandparent_adult_grandchild", label: "조부모가 성년 손자녀에게", helper: "5천만원 공제와 세대생략 할증 확인" },
];

const initialForm: FormState = {
  donorName: "",
  recipientName: "",
  relationshipType: "parent_minor_child",
  giftMode: "periodic",
  priorGiftState: "no",
};

const hometaxSteps = [
  "증여세 정기신고 메뉴로 이동",
  "증여자와 수증자 기본 정보 입력",
  "현금 증여 금액과 공제 항목 확인",
  "이체확인증과 가족관계 증빙 첨부",
  "제출 전 세무서 또는 전문가와 최종 확인",
];

function App() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isPdfBusy, setIsPdfBusy] = useState(false);
  const [toast, setToast] = useState("");

  const guide = useMemo(() => getGuideSummary(form), [form]);

  const update = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => {
      setToast((current) => (current === message ? "" : current));
    }, 2600);
  };

  const runPdfAction = async (action: "preview" | "save") => {
    if (isPdfBusy) return;

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
          <p className="eyebrow">증여 준비 안내</p>
          <h1>아이에게 보내기 전, 기준과 준비 순서를 확인해요</h1>
          <p>미성년 자녀 공제 기준, 한 번에 보내기와 나누어 보내기, 홈택스 준비 순서를 정리해요.</p>
        </div>
        <BabyMascot />
      </section>

      <section className="result-banner">
        <span>처음 증여 기준 안내</span>
        <strong>{guide.safeLimitLabel}</strong>
        <p>
          {guide.deductionLabel} 공제와 과세표준 50만원 미만 기준을 함께 볼 때 납부세액이 생기지 않을 수 있는
          범위예요.
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
        <SectionHeading index="02" title="증여 방식" id="amount-title" />
        <div className="segmented" role="radiogroup" aria-label="증여 방식">
          <SegmentButton active={form.giftMode === "periodic"} onClick={() => update("giftMode", "periodic")}>
            매월 보내기
          </SegmentButton>
          <SegmentButton active={form.giftMode === "lump_sum"} onClick={() => update("giftMode", "lump_sum")}>
            한번에 보내기
          </SegmentButton>
        </div>
        <GuideCard title={guide.modeTitle} description={guide.modeDescription} bullets={guide.modeBullets} />
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
          <GuideCard
            tone="warning"
            title="같은 사람에게 받은 증여가 있으면 달라져요"
            description="최근 10년 안에 같은 증여자에게 받은 금액은 합산 확인이 필요해요."
            bullets={[
              "이 경우 2,050만원 미만 안내가 그대로 맞지 않을 수 있어요.",
              "이전 신고 내역, 이체 기록, 공제 사용 여부를 홈택스에서 확인해 주세요.",
            ]}
          />
        ) : (
          <GuideCard
            title="처음 증여라면 기준이 단순해요"
            description={`${guide.deductionLabel} 공제와 과세표준 50만원 미만 기준을 먼저 확인하면 돼요.`}
            bullets={["송금 기록과 가족관계 증빙은 따로 보관해 주세요.", "신고 여부는 홈택스에서 최종 확인해 주세요."]}
          />
        )}
      </section>

      <section className="panel" aria-labelledby="result-title">
        <SectionHeading index="04" title="준비 요약" id="result-title" />
        <GuideSummaryCard form={form} guide={guide} />
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
          <button className="primary" type="button" disabled={isPdfBusy} onClick={() => void runPdfAction("save")}>
            PDF 저장
          </button>
        </div>
        <button className="text-action" type="button" disabled={isPdfBusy} onClick={() => void runPdfAction("preview")}>
          PDF로 열기
        </button>
      </section>

      <section className="notice">
        <strong>참고용 안내예요</strong>
        <p>자동 신고, 세무 대리, 확정 세액 안내, 홈택스 로그인/제출, 서버 저장은 제공하지 않아요.</p>
      </section>

      <div className={`document-preview ${isPreviewVisible ? "is-visible" : ""}`} id="documentPreview">
        <PrintPack form={form} guide={guide} />
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
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="text-field">
      <span>{label}</span>
      <input type="text" value={value} onChange={(event) => onChange(event.target.value)} />
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

function GuideCard({
  bullets,
  description,
  title,
  tone = "default",
}: {
  bullets: string[];
  description: string;
  title: string;
  tone?: "default" | "warning";
}) {
  return (
    <div className={tone === "warning" ? "guide-card is-warning" : "guide-card"}>
      <strong>{title}</strong>
      <p>{description}</p>
      <ul>
        {bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
    </div>
  );
}

function GuideSummaryCard({ form, guide }: { form: FormState; guide: GuideSummary }) {
  const rows = [
    ["증여 관계", guide.relationshipLabel],
    ["선택한 방식", form.giftMode === "periodic" ? "매월 보내기" : "한번에 보내기"],
    ["공제 기준", guide.deductionLabel],
    ["안내 범위", guide.safeLimitLabel],
  ];

  return (
    <div className="summary-card">
      <dl>
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <GuideCard title="확인할 일" description="송금 전후로 아래 항목을 챙기면 홈택스 준비가 쉬워져요." bullets={guide.cautionBullets} />
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

function PrintPack({ form, guide }: { form: FormState; guide: GuideSummary }) {
  return (
    <div className="print-pack">
      <section className="print-page">
        <header>
          <p>우리 아기 증여 도우미</p>
          <h2>아이 증여 준비 체크리스트</h2>
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
            <dd>{guide.relationshipLabel}</dd>
          </div>
          <div>
            <dt>증여 방식</dt>
            <dd>{form.giftMode === "periodic" ? "매월 보내기" : "한번에 보내기"}</dd>
          </div>
          <div>
            <dt>공제 기준</dt>
            <dd>{guide.deductionLabel}</dd>
          </div>
          <div>
            <dt>안내 범위</dt>
            <dd>{guide.safeLimitLabel}</dd>
          </div>
        </dl>
        <h3>기준 안내</h3>
        <ul>
          <li>{guide.deductionLabel} 공제와 과세표준 50만원 미만 기준을 함께 확인해요.</li>
          <li>{guide.modeDescription}</li>
          {guide.modeBullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
        <h3>송금 전 체크리스트</h3>
        <ul>
          {guide.cautionBullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
        <h3>홈택스 입력 순서</h3>
        <ol>
          {hometaxSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <footer>이 문서는 신고 준비를 돕는 참고용 안내입니다. 세무 대리, 자동 신고, 확정 세액 안내가 아닙니다.</footer>
      </section>
    </div>
  );
}

function getGuideSummary(form: FormState): GuideSummary {
  const relationship = relationships.find((item) => item.value === form.relationshipType) ?? relationships[0];
  const isMinor = form.relationshipType.includes("minor");
  const isGrandparent = form.relationshipType.includes("grandparent");
  const deductionLabel = isMinor ? MINOR_DEDUCTION_LABEL : ADULT_DEDUCTION_LABEL;
  const safeLimitLabel = isMinor ? MINOR_SAFE_LIMIT_LABEL : ADULT_SAFE_LIMIT_LABEL;
  const familyCaution = isGrandparent
    ? "조부모가 증여하는 경우 세대생략 등 추가 확인이 필요할 수 있어요."
    : "부모가 자녀에게 보내는 현금 증여 기준으로 먼저 확인해요.";
  const modeDescription =
    form.giftMode === "periodic"
      ? `${GUIDE_BASE_DATE} 기준, 오늘부터 10년 동안 매월 보낸다면 ${PERIODIC_MINOR_EXAMPLE}가 ${MINOR_SAFE_LIMIT_LABEL} 범위의 대표 예시예요.`
      : `처음 증여라면 ${deductionLabel} 이하가 가장 단순하고, 과세표준 50만원 미만 기준까지 함께 보면 ${safeLimitLabel}을 확인할 수 있어요.`;
  const modeBullets =
    form.giftMode === "periodic"
      ? [
          "사용자가 금액을 넣어 계산하는 기능은 제공하지 않아요.",
          "대표 예시는 미성년 자녀에게 처음 증여하는 경우를 기준으로 봐주세요.",
          "실제 신고 전에는 이체일, 과거 증여, 증빙을 홈택스에서 확인해야 해요.",
        ]
      : [
          `${deductionLabel} 공제 기준을 넘기지 않는 방식이 가장 이해하기 쉬워요.`,
          `${safeLimitLabel} 안내는 최근 10년 같은 증여자에게 받은 증여가 없다는 전제가 필요해요.`,
          "송금 후 이체확인증과 가족관계 증빙을 보관해 주세요.",
        ];

  return {
    relationshipLabel: relationship.label,
    deductionLabel,
    safeLimitLabel,
    modeTitle: form.giftMode === "periodic" ? "매월 보내기 대표 예시" : "한번에 보내기 기준",
    modeDescription,
    modeBullets,
    cautionBullets: [
      familyCaution,
      "최근 10년 같은 사람에게 받은 증여가 있으면 기준이 달라질 수 있어요.",
      "이 앱은 자동 신고, 세무 대리, 확정 세액 안내를 제공하지 않아요.",
    ],
  };
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
