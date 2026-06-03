"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createProductDraft, updateProductDraft, submitProductForReview } from "@/lib/actions/product";
import { createClient } from "@/lib/supabase/client";

// ── Props ────────────────────────────────────────────────────────────────────

export interface EditProductData {
  id: string;
  name: string;
  tagline: string;
  description: string;
  url: string;
  categories: string[];
  tags: string;
  thumbnail_url: string | null;
  video_url: string | null;
  gallery_images: string[];
  is_open_source: boolean;
  repo_url: string | null;
  maker_type: "maker" | "hunter";
  status: string;
  extra_links: Array<{ type: string; url: string; label: string | null }>;
  team_members: Array<{ name: string; role: string; profile_id: string | null }>;
  shoutouts: Array<{ name: string; url: string | null; reason: string }>;
  investor_info: {
    founder_reason: string | null;
    idea_reason: string | null;
    competitors_text: string | null;
    revenue_info: string | null;
    other_info: string | null;
  } | null;
}

interface SubmitFormProps {
  username: string | null;
  editProduct?: EditProductData | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const NAV_STEPS = [
  { id: 0, label: "기본 정보",    icon: "✏️" },
  { id: 1, label: "링크",         icon: "🔗" },
  { id: 2, label: "카테고리",     icon: "🏷️" },
  { id: 3, label: "미디어",       icon: "🖼️" },
  { id: 4, label: "역할 & 팀",    icon: "👥" },
  { id: 5, label: "추천 도구",    icon: "📣" },
  { id: 6, label: "투자자 연결",  icon: "💼" },
];

const ALL_CATEGORIES = [
  { value: "ai-tool",           label: "AI 툴",        icon: "🤖" },
  { value: "saas",              label: "SaaS",          icon: "☁️" },
  { value: "dev-tool",          label: "개발 툴",       icon: "🛠️" },
  { value: "productivity",      label: "생산성",        icon: "⚡" },
  { value: "design",            label: "디자인",        icon: "🎨" },
  { value: "marketing",         label: "마케팅",        icon: "📈" },
  { value: "mobile-app",        label: "모바일 앱",     icon: "📱" },
  { value: "browser-extension", label: "브라우저 확장", icon: "🧩" },
  { value: "desktop-app",       label: "데스크탑 앱",   icon: "🖥️" },
  { value: "game",              label: "게임",          icon: "🎮" },
  { value: "api",               label: "API / 백엔드",  icon: "⚙️" },
  { value: "education",         label: "교육",          icon: "📚" },
  { value: "finance",           label: "금융 / 핀테크", icon: "💰" },
  { value: "health",            label: "헬스 / 웰니스", icon: "❤️" },
  { value: "social",            label: "소셜",          icon: "💬" },
  { value: "ecommerce",         label: "이커머스",      icon: "🛒" },
  { value: "media",             label: "미디어",        icon: "📺" },
  { value: "other",             label: "기타",          icon: "📦" },
];

const EXTRA_LINK_TYPES = [
  { value: "app-store",   label: "App Store (iOS)" },
  { value: "google-play", label: "Google Play" },
  { value: "steam",       label: "Steam" },
  { value: "github",      label: "GitHub" },
  { value: "bitbucket",   label: "Bitbucket" },
  { value: "gitlab",      label: "GitLab" },
  { value: "other",       label: "기타" },
];

// ── Types ─────────────────────────────────────────────────────────────────────

type LinkItem = { id: string; type: string; url: string; label: string };
type TeamMember = { id: string; name: string; role: string; profile_id?: string };
type ProfileResult = { id: string; username: string | null; display_name: string | null; avatar_url: string | null };
type Shoutout = { id: string; name: string; url: string; reason: string };

type FormData = {
  name: string; tagline: string; description: string; tags: string;
  url: string; extra_links: LinkItem[]; is_open_source: boolean; repo_url: string; repo_type: string;
  categories: string[];
  thumbnail_url: string; video_url: string; gallery_images: string[];
  maker_type: "maker" | "hunter"; team_members: TeamMember[];
  shoutouts: Shoutout[];
  investor_founder_reason: string; investor_idea_reason: string;
  investor_competitors: string; investor_revenue: string; investor_other: string;
};

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

// ── Main Component ────────────────────────────────────────────────────────────

export default function SubmitForm({ username, editProduct }: SubmitFormProps) {
  const isEditMode = !!editProduct;
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(() => {
    if (editProduct) {
      return {
        name: editProduct.name,
        tagline: editProduct.tagline,
        description: editProduct.description,
        tags: editProduct.tags,
        url: editProduct.url,
        extra_links: editProduct.extra_links.map((l) => ({
          id: crypto.randomUUID(),
          type: l.type,
          url: l.url,
          label: l.label ?? "",
        })),
        is_open_source: editProduct.is_open_source,
        repo_url: editProduct.repo_url ?? "",
        repo_type: "github",
        categories: editProduct.categories,
        thumbnail_url: editProduct.thumbnail_url ?? "",
        video_url: editProduct.video_url ?? "",
        gallery_images: editProduct.gallery_images,
        maker_type: editProduct.maker_type,
        team_members: editProduct.team_members.map((m) => ({
          id: crypto.randomUUID(),
          name: m.name,
          role: m.role,
          profile_id: m.profile_id ?? undefined,
        })),
        shoutouts: editProduct.shoutouts.map((s) => ({
          id: crypto.randomUUID(),
          name: s.name,
          url: s.url ?? "",
          reason: s.reason,
        })),
        investor_founder_reason: editProduct.investor_info?.founder_reason ?? "",
        investor_idea_reason: editProduct.investor_info?.idea_reason ?? "",
        investor_competitors: editProduct.investor_info?.competitors_text ?? "",
        investor_revenue: editProduct.investor_info?.revenue_info ?? "",
        investor_other: editProduct.investor_info?.other_info ?? "",
      };
    }
    return {
      name: "", tagline: "", description: "", tags: "",
      url: "", extra_links: [], is_open_source: false, repo_url: "", repo_type: "github",
      categories: [],
      thumbnail_url: "", video_url: "", gallery_images: [],
      maker_type: "maker", team_members: [],
      shoutouts: [],
      investor_founder_reason: "", investor_idea_reason: "",
      investor_competitors: "", investor_revenue: "", investor_other: "",
    };
  });
  const [draftId, setDraftId] = useState<string | null>(editProduct?.id ?? null);
  const [submitted, setSubmitted] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isGalleryUploading, setIsGalleryUploading] = useState(false);
  const [galleryUploadError, setGalleryUploadError] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [searchResults, setSearchResults] = useState<ProfileResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMount = useRef(true);

  const isStepComplete = (s: number): boolean => {
    switch (s) {
      case 0: return !!form.name.trim() && !!form.tagline.trim() && form.description.trim().length >= 20;
      case 1: return !!form.url.trim();
      case 2: return form.categories.length > 0;
      case 3: return !!form.thumbnail_url || !!form.video_url || form.gallery_images.length > 0;
      case 4: return form.team_members.length > 0;
      case 5: return form.shoutouts.filter((sh) => sh.name.trim() && sh.reason.trim().length >= 20).length > 0;
      case 6: return [form.investor_founder_reason, form.investor_idea_reason, form.investor_competitors, form.investor_revenue, form.investor_other].some((v) => v.trim().length > 0);
      default: return false;
    }
  };

  const canSubmit = [0, 1, 2].every(isStepComplete) && !isSubmitting;

  // ── Auto-save helpers ───────────────────────────────────────────────────────

  const getDraftInput = useCallback((f: FormData) => ({
    name: f.name,
    tagline: f.tagline,
    description: f.description,
    url: f.url,
    category: f.categories[0] ?? "other",
    categories: f.categories,
    tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean),
    thumbnail_url: f.thumbnail_url || undefined,
    video_url: f.video_url || undefined,
    gallery_images: f.gallery_images,
    is_open_source: f.is_open_source,
    repo_url: f.is_open_source ? f.repo_url : undefined,
    maker_type: f.maker_type,
  }), []);

  const triggerAutoSave = useCallback((newForm: FormData, existingDraftId: string | null) => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      setIsSavingDraft(true);
      if (!existingDraftId) {
        // 이름이 있을 때만 첫 draft 생성
        if (!newForm.name.trim()) { setIsSavingDraft(false); return; }
        const result = await createProductDraft(getDraftInput(newForm));
        if (result.productId) {
          setDraftId(result.productId);
          setLastSaved(new Date());
        }
      } else {
        await updateProductDraft(existingDraftId, getDraftInput(newForm));
        setLastSaved(new Date());
      }
      setIsSavingDraft(false);
    }, 2000);
  }, [getDraftInput]);

  // form 변경 시 자동저장 트리거
  useEffect(() => {
    // 수정 모드에서 첫 렌더링 시는 자동저장 스킵 (기존 데이터를 다시 저장하는 것 방지)
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (isEditMode) return;
    }
    triggerAutoSave(form, draftId);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const set = (key: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const toggleCategory = (val: string) =>
    setForm((f) => {
      if (f.categories.includes(val)) return { ...f, categories: f.categories.filter((c) => c !== val) };
      if (f.categories.length >= 3) return f;
      return { ...f, categories: [...f.categories, val] };
    });

  const addLink = () =>
    setForm((f) => ({ ...f, extra_links: [...f.extra_links, { id: crypto.randomUUID(), type: "app-store", url: "", label: "" }] }));
  const removeLink = (id: string) =>
    setForm((f) => ({ ...f, extra_links: f.extra_links.filter((l) => l.id !== id) }));
  const updateLink = (id: string, field: keyof Omit<LinkItem, "id">, value: string) =>
    setForm((f) => ({ ...f, extra_links: f.extra_links.map((l) => (l.id === id ? { ...l, [field]: value } : l)) }));

  const addTeamMember = () =>
    setForm((f) => ({ ...f, team_members: [...f.team_members, { id: crypto.randomUUID(), name: "", role: "공동 창업자" }] }));
  const removeTeamMember = (id: string) =>
    setForm((f) => ({ ...f, team_members: f.team_members.filter((m) => m.id !== id) }));
  const updateTeamMember = (id: string, field: keyof Omit<TeamMember, "id">, value: string) =>
    setForm((f) => ({ ...f, team_members: f.team_members.map((m) => (m.id === id ? { ...m, [field]: value } : m)) }));

  const searchProfiles = async (query: string) => {
    setIsSearching(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(6);
    setSearchResults((data ?? []) as ProfileResult[]);
    setIsSearching(false);
    setShowSearchDropdown(true);
  };

  const handleMemberSearchChange = (val: string) => {
    setMemberSearch(val);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (val.trim().length < 2) { setSearchResults([]); setShowSearchDropdown(false); return; }
    searchTimerRef.current = setTimeout(() => { void searchProfiles(val); }, 300);
  };

  const addTeamMemberFromProfile = (profile: ProfileResult) => {
    setForm((f) => ({
      ...f,
      team_members: [
        ...f.team_members,
        {
          id: crypto.randomUUID(),
          name: profile.display_name ?? profile.username ?? "Unknown",
          role: "팀원",
          profile_id: profile.id,
        },
      ],
    }));
    setMemberSearch("");
    setSearchResults([]);
    setShowSearchDropdown(false);
  };

  const addShoutout = () =>
    setForm((f) => ({ ...f, shoutouts: [...f.shoutouts, { id: crypto.randomUUID(), name: "", url: "", reason: "" }] }));
  const removeShoutout = (id: string) =>
    setForm((f) => ({ ...f, shoutouts: f.shoutouts.filter((s) => s.id !== id) }));
  const updateShoutout = (id: string, field: keyof Omit<Shoutout, "id">, value: string) =>
    setForm((f) => ({ ...f, shoutouts: f.shoutouts.map((s) => (s.id === id ? { ...s, [field]: value } : s)) }));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true); setUploadError(null);
    const fd = new globalThis.FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok) setUploadError(data.error ?? "업로드 실패");
      else setForm((f) => ({ ...f, thumbnail_url: data.url! }));
    } catch { setUploadError("업로드 중 오류가 발생했습니다."); }
    finally { setIsUploading(false); }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || form.gallery_images.length >= 8) return;
    setIsGalleryUploading(true); setGalleryUploadError(null);
    const fd = new globalThis.FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok) setGalleryUploadError(data.error ?? "업로드 실패");
      else setForm((f) => ({ ...f, gallery_images: [...f.gallery_images, data.url!] }));
    } catch { setGalleryUploadError("업로드 중 오류가 발생했습니다."); }
    finally { setIsGalleryUploading(false); e.target.value = ""; }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true); setServerError(null);
    const hasInvestorInfo = [
      form.investor_founder_reason, form.investor_idea_reason,
      form.investor_competitors, form.investor_revenue, form.investor_other,
    ].some((v) => v.trim().length > 0);

    // draft가 없으면 먼저 생성
    let currentDraftId = draftId;
    if (!currentDraftId) {
      const created = await createProductDraft(getDraftInput(form));
      if (created.error || !created.productId) {
        setServerError(created.error ?? "draft 생성에 실패했습니다.");
        setIsSubmitting(false);
        return;
      }
      currentDraftId = created.productId;
      setDraftId(currentDraftId);
    }

    const result = await submitProductForReview(currentDraftId, {
      name: form.name, tagline: form.tagline, description: form.description,
      url: form.url,
      category: form.categories[0] ?? "other",
      categories: form.categories,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      thumbnail_url: form.thumbnail_url || undefined,
      video_url: form.video_url || undefined,
      gallery_images: form.gallery_images,
      is_open_source: form.is_open_source,
      repo_url: form.is_open_source ? form.repo_url : undefined,
      maker_type: form.maker_type,
      extra_links: form.extra_links.filter((l) => l.url.trim()).map((l) => ({ type: l.type, url: l.url.trim(), label: l.label || undefined })),
      team_members: form.maker_type === "maker"
        ? form.team_members.filter((m) => m.name.trim()).map((m) => ({ name: m.name.trim(), role: m.role, profile_id: m.profile_id }))
        : [],
      shoutouts: form.shoutouts
        .filter((s) => s.name.trim() && s.reason.trim().length >= 20)
        .map((s) => ({ name: s.name.trim(), url: s.url.trim() || undefined, reason: s.reason.trim() })),
      investor_info: hasInvestorInfo ? {
        founder_reason: form.investor_founder_reason,
        idea_reason: form.investor_idea_reason,
        competitors_text: form.investor_competitors,
        revenue_info: form.investor_revenue,
        other_info: form.investor_other,
      } : null,
    });
    setIsSubmitting(false);
    if (result?.error) setServerError(result.error);
    else setSubmitted(true);
  };

  return (
    <div className="flex gap-8">
      {submitted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
          <div className="max-w-md rounded-3xl border border-green-100 bg-white p-10 text-center shadow-xl">
            <div className="mb-4 text-5xl">{isEditMode ? "✏️" : "🚀"}</div>
            <h2 className="mb-2 text-2xl font-black text-slate-900">
              {isEditMode ? "수정 완료!" : "검토 요청 완료!"}
            </h2>
            <p className="mb-1 text-slate-600">
              {isEditMode
                ? "수정 내용이 저장되었습니다."
                : "제품이 운영팀에 제출되었습니다."}
            </p>
            <p className="mb-6 text-sm text-slate-400">
              {isEditMode
                ? "순순 등록 제품 수정은 관리자의 재검토가 필요할 수 있습니다."
                : "보통 2-3일 이내에 검토 후 승인 또는 반려 알림을 보내드립니다."}
            </p>
            <a href={username ? `/profile/${username}` : "/"} className="inline-block rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
              내 프로필에서 확인 →
            </a>
          </div>
        </div>
      )}
      {/* ── Sidebar ── */}
      <aside className="w-52 flex-shrink-0">
        {/* Sidebar header with draft status */}
        <div className="mb-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            {form.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.thumbnail_url} alt="" className="h-10 w-10 rounded-xl object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-lg font-black text-white">
                {form.name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">{form.name || "새 제품"}</p>
              <p className="text-xs text-amber-500">
                {isSavingDraft ? "저장 중..." : lastSaved ? `${lastSaved.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} 저장됨` : isEditMode ? "수정 중" : "작성 중"}
              </p>
            </div>
          </div>
        </div>
        <nav className="space-y-0.5">
          {NAV_STEPS.map((s) => {
            const done = isStepComplete(s.id);
            const active = step === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setStep(s.id)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  active ? "bg-blue-50 font-semibold text-blue-700" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="w-5 text-center text-base leading-none">{s.icon}</span>
                <span className="flex-1 leading-tight">{s.label}</span>
                {done && <span className="text-[11px] text-green-500">✓</span>}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ── Content ── */}
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">

          {step === 0 && (
            <div className="space-y-6">
              <StepHeader title="기본 정보를 입력해주세요" desc="제품의 핵심 정보를 간결하게 표현하세요." />
              <Field label="제품 이름" required hint="짧고 기억에 남는 이름 (60자 이내)">
                <input type="text" value={form.name} onChange={set("name")} placeholder="예: DevPilot AI" maxLength={60} className={inputCls} />
              </Field>
              <Field label="한 줄 소개 (Tagline)" required hint="80자 이내로 핵심 가치를 표현하세요">
                <input type="text" value={form.tagline} onChange={set("tagline")} placeholder="예: 코드 리뷰를 10배 빠르게 만드는 AI 도구" maxLength={80} className={inputCls} />
              </Field>
              <Field label="제품 설명" required hint="어떤 문제를 해결하는지 자세히 설명하세요 (최소 20자)">
                <textarea
                  value={form.description} onChange={set("description")} rows={6}
                  placeholder={"우리 제품은…\n\n주요 기능:\n- 기능 1\n- 기능 2"}
                  className={`${inputCls} resize-y`}
                />
                <p className={`mt-1 text-right text-xs ${form.description.length < 20 ? "text-red-400" : "text-slate-400"}`}>
                  {form.description.length}자
                </p>
              </Field>
              <Field label="태그" hint="쉼표로 구분, 최대 5개 (예: ai, productivity, chrome-extension)">
                <input type="text" value={form.tags} onChange={set("tags")} placeholder="ai, saas, api" className={inputCls} />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <StepHeader title="링크를 추가하세요" desc="제품을 찾을 수 있는 주소를 입력하세요." />
              <Field label="메인 URL" required hint="제품 또는 랜딩 페이지 주소">
                <input type="url" value={form.url} onChange={set("url")} placeholder="https://your-product.com" className={inputCls} />
              </Field>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">추가 링크</label>
                  <button type="button" onClick={addLink}
                    className="flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-100">
                    + 링크 추가
                  </button>
                </div>
                {form.extra_links.length === 0 && (
                  <p className="text-xs text-slate-400">App Store, Google Play, Steam 등 추가 링크를 넣어보세요.</p>
                )}
                <div className="space-y-2">
                  {form.extra_links.map((link) => (
                    <div key={link.id} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <select value={link.type} onChange={(e) => updateLink(link.id, "type", e.target.value)}
                        className="w-36 flex-shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-700 outline-none focus:border-blue-400">
                        {EXTRA_LINK_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                      <input type="url" value={link.url} onChange={(e) => updateLink(link.id, "url", e.target.value)}
                        placeholder="https://..." className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-400" />
                      <button type="button" onClick={() => removeLink(link.id)} className="flex-shrink-0 text-slate-300 transition hover:text-red-400">✕</button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <button type="button"
                  onClick={() => setForm((f) => ({ ...f, is_open_source: !f.is_open_source }))}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition ${
                    form.is_open_source ? "border-green-200 bg-green-50 text-green-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}>
                  <div className={`flex h-5 w-5 items-center justify-center rounded border-2 transition ${
                    form.is_open_source ? "border-green-500 bg-green-500" : "border-slate-300"
                  }`}>
                    {form.is_open_source && <span className="text-xs font-bold text-white">✓</span>}
                  </div>
                  <span className="text-sm font-medium">오픈 소스 프로젝트입니다</span>
                </button>
                {form.is_open_source && (
                  <div className="mt-3 flex gap-2">
                    <select value={form.repo_type} onChange={set("repo_type")}
                      className="w-32 flex-shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400">
                      <option value="github">GitHub</option>
                      <option value="bitbucket">Bitbucket</option>
                      <option value="gitlab">GitLab</option>
                      <option value="other">기타</option>
                    </select>
                    <input type="url" value={form.repo_url} onChange={set("repo_url")} placeholder="https://github.com/..." className={`flex-1 ${inputCls}`} />
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <StepHeader title="카테고리를 선택하세요" desc={`최대 3개까지 선택할 수 있습니다. (현재 ${form.categories.length}/3)`} />
              {form.categories.length === 3 && (
                <p className="rounded-xl bg-amber-50 px-4 py-2 text-xs text-amber-600">최대 3개 선택됐습니다. 변경하려면 선택된 항목을 먼저 해제하세요.</p>
              )}
              <div className="grid grid-cols-3 gap-2">
                {ALL_CATEGORIES.map((cat) => {
                  const selected = form.categories.includes(cat.value);
                  const disabled = !selected && form.categories.length >= 3;
                  return (
                    <button key={cat.value} type="button" onClick={() => toggleCategory(cat.value)} disabled={disabled}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition ${
                        selected ? "border-blue-400 bg-blue-50 font-semibold text-blue-700"
                          : disabled ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}>
                      <span className="text-base leading-none">{cat.icon}</span>
                      <span className="flex-1 text-xs leading-tight">{cat.label}</span>
                      {selected && <span className="text-[11px] text-blue-500">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <StepHeader title="이미지와 미디어를 추가하세요" desc="제품을 시각적으로 소개하세요. (선택 사항)" />
              <Field label="썸네일 (아이콘)" hint="정사각형 권장 (512×512 이상) · jpg, png, webp, gif · 최대 5MB">
                <label className="block cursor-pointer">
                  <div className={`flex items-center gap-3 ${inputCls} cursor-pointer hover:border-blue-400`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span className="text-slate-500">{isUploading ? "업로드 중..." : form.thumbnail_url ? "다른 파일 선택" : "파일 선택"}</span>
                  </div>
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" disabled={isUploading} onChange={handleFileUpload} />
                </label>
                {uploadError && <p className="mt-1.5 text-sm text-red-500">{uploadError}</p>}
                {form.thumbnail_url && (
                  <div className="mt-3 flex items-center gap-4 rounded-xl border border-green-100 bg-green-50 p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.thumbnail_url} alt="preview" className="h-16 w-16 rounded-xl object-cover ring-1 ring-green-200" />
                    <div>
                      <p className="text-sm font-semibold text-green-700">✓ 업로드 완료</p>
                      <button type="button" onClick={() => setForm((f) => ({ ...f, thumbnail_url: "" }))} className="mt-0.5 text-xs text-red-400 hover:text-red-600">삭제</button>
                    </div>
                  </div>
                )}
              </Field>
              <Field label="소개 영상 (YouTube URL)" hint="유튜브 링크를 넣으면 갤러리 첫 번째 슬라이드에 표시됩니다">
                <input type="url" value={form.video_url} onChange={set("video_url")} placeholder="https://www.youtube.com/watch?v=..." className={inputCls} />
              </Field>
              <Field label="갤러리 이미지" hint="스크린샷 등 최대 8장 · jpg, png, webp · 최대 5MB">
                {form.gallery_images.length < 8 && (
                  <label className="block cursor-pointer">
                    <div className={`flex items-center gap-3 ${inputCls} cursor-pointer hover:border-blue-400`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-slate-500">{isGalleryUploading ? "업로드 중..." : `이미지 추가 (${form.gallery_images.length}/8)`}</span>
                    </div>
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" disabled={isGalleryUploading} onChange={handleGalleryUpload} />
                  </label>
                )}
                {galleryUploadError && <p className="mt-1.5 text-sm text-red-500">{galleryUploadError}</p>}
                {form.gallery_images.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-3">
                    {form.gallery_images.map((url, i) => (
                      <div key={i} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`gallery ${i + 1}`} className="h-24 w-36 rounded-xl object-cover ring-1 ring-slate-200" />
                        <button type="button"
                          onClick={() => setForm((f) => ({ ...f, gallery_images: f.gallery_images.filter((_, j) => j !== i) }))}
                          className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white hover:bg-red-600">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </Field>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <StepHeader title="이 제품을 직접 만드셨나요?" desc="어느 쪽이든 괜찮습니다. 등록 방식만 다릅니다." />
              <div className="space-y-3">
                <RoleOption selected={form.maker_type === "maker"} onClick={() => setForm((f) => ({ ...f, maker_type: "maker" }))}
                  title="네, 제가 만든 제품입니다" desc="창업자 / 개발자로 등록됩니다" />
                <RoleOption selected={form.maker_type === "hunter"} onClick={() => setForm((f) => ({ ...f, maker_type: "hunter" }))}
                  title="아니요, 소개하고 싶은 제품입니다" desc="큐레이터로 등록됩니다" />
              </div>
              {form.maker_type === "maker" && (
                <div>
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-slate-700">팀원 추가</p>
                    <p className="text-xs text-slate-400">사이트에서 검색하거나 직접 입력하세요. (선택)</p>
                  </div>

                  {/* Profile search */}
                  <div className="relative mb-3">
                    <input
                      type="text"
                      value={memberSearch}
                      onChange={(e) => handleMemberSearchChange(e.target.value)}
                      onFocus={() => memberSearch.trim().length >= 2 && setShowSearchDropdown(true)}
                      onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                      placeholder="이름 또는 아이디로 팀원 검색..."
                      className={inputCls}
                    />
                    {showSearchDropdown && (
                      <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                        {isSearching ? (
                          <div className="px-4 py-3 text-sm text-slate-400">검색 중...</div>
                        ) : searchResults.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-slate-400">검색 결과가 없습니다.</div>
                        ) : (
                          <ul>
                            {searchResults.map((profile) => (
                              <li key={profile.id}>
                                <button
                                  type="button"
                                  onMouseDown={() => addTeamMemberFromProfile(profile)}
                                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-blue-50"
                                >
                                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-navy-900">
                                    {profile.avatar_url ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                      <span className="text-xs font-bold text-white">
                                        {(profile.display_name ?? profile.username ?? "?")[0]?.toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900">
                                      {profile.display_name ?? profile.username}
                                    </p>
                                    {profile.username && (
                                      <p className="text-xs text-slate-400">@{profile.username}</p>
                                    )}
                                  </div>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                        <div className="border-t border-slate-100">
                          <button
                            type="button"
                            onMouseDown={() => { addTeamMember(); setShowSearchDropdown(false); setMemberSearch(""); }}
                            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-blue-600 hover:bg-blue-50"
                          >
                            <span className="font-bold">+</span> 직접 입력
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Team members list */}
                  <div className="space-y-2">
                    {form.team_members.map((m) => (
                      <div key={m.id} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
                        {m.profile_id ? (
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <span className="flex-shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">사이트 유저</span>
                            <span className="truncate text-sm font-medium text-slate-900">{m.name}</span>
                          </div>
                        ) : (
                          <input type="text" value={m.name} onChange={(e) => updateTeamMember(m.id, "name", e.target.value)}
                            placeholder="이름" className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400" />
                        )}
                        <input type="text" value={m.role} onChange={(e) => updateTeamMember(m.id, "role", e.target.value)}
                          placeholder="역할 (예: 공동 창업자)" className="w-36 flex-shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400" />
                        <button type="button" onClick={() => removeTeamMember(m.id)} className="flex-shrink-0 text-slate-300 transition hover:text-red-400">✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <StepHeader title="추천 도구를 소개해주세요"
                desc="이 제품을 만드는 데 도움이 된 서비스나 툴을 공유하세요. 해당 제품 페이지에도 노출되어 상호 홍보 효과가 있습니다." />
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">선택 사항 — 보통 3개 정도를 추가합니다.</p>
                <button type="button" onClick={addShoutout}
                  className="flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-100">
                  + 추천 도구 추가
                </button>
              </div>
              {form.shoutouts.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
                  아직 추가된 추천 도구가 없습니다.
                </div>
              )}
              <div className="space-y-4">
                {form.shoutouts.map((s) => (
                  <div key={s.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-500">추천 도구</p>
                      <button type="button" onClick={() => removeShoutout(s.id)} className="text-xs text-slate-300 transition hover:text-red-400">삭제</button>
                    </div>
                    <div className="space-y-2">
                      <input type="text" value={s.name} onChange={(e) => updateShoutout(s.id, "name", e.target.value)} placeholder="제품명" className={inputCls} />
                      <input type="url" value={s.url} onChange={(e) => updateShoutout(s.id, "url", e.target.value)} placeholder="URL (선택)" className={inputCls} />
                      <textarea value={s.reason} onChange={(e) => updateShoutout(s.id, "reason", e.target.value)}
                        placeholder="왜 이 제품을 추천하나요? (최소 20자)" rows={3} className={`${inputCls} resize-none`} />
                      {s.reason.length > 0 && s.reason.length < 20 && (
                        <p className="text-xs text-red-400">최소 20자 이상 입력해주세요 ({s.reason.length}/20)</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6">
              <StepHeader title="투자자 연결" badge="비공개 · 선택 사항"
                desc="아래 정보는 외부에 공개되지 않습니다. 투자자 매칭에만 활용되며, 매칭 시 별도로 연락드립니다." />
              <InvestorField label="왜 이 제품을 만들기에 적합한 팀인가요?">
                <textarea value={form.investor_founder_reason} onChange={set("investor_founder_reason")} rows={4} maxLength={5000}
                  placeholder="팀의 배경, 경험, 기술력 등을 소개해주세요." className={`${inputCls} resize-y`} />
                <CharCount val={form.investor_founder_reason} max={5000} />
              </InvestorField>
              <InvestorField label="왜 이 아이디어를 선택했나요?">
                <textarea value={form.investor_idea_reason} onChange={set("investor_idea_reason")} rows={4} maxLength={5000}
                  placeholder="문제 발견 계기, 시장 기회 등을 설명해주세요." className={`${inputCls} resize-y`} />
                <CharCount val={form.investor_idea_reason} max={5000} />
              </InvestorField>
              <InvestorField label="경쟁자는 누구이며, 여러분만의 인사이트는 무엇인가요?">
                <textarea value={form.investor_competitors} onChange={set("investor_competitors")} rows={4} maxLength={5000}
                  placeholder="주요 경쟁사 및 차별점을 적어주세요." className={`${inputCls} resize-y`} />
                <CharCount val={form.investor_competitors} max={5000} />
              </InvestorField>
              <InvestorField label="매출 또는 성장 지표가 있다면 알려주세요.">
                <textarea value={form.investor_revenue} onChange={set("investor_revenue")} rows={3} maxLength={5000}
                  placeholder="MRR, 사용자 수, 성장률 등 (없어도 괜찮습니다)" className={`${inputCls} resize-y`} />
                <CharCount val={form.investor_revenue} max={5000} />
              </InvestorField>
              <InvestorField label="투자자에게 전하고 싶은 다른 내용이 있나요?">
                <textarea value={form.investor_other} onChange={set("investor_other")} rows={3} maxLength={5000}
                  placeholder="자유롭게 작성해주세요." className={`${inputCls} resize-y`} />
                <CharCount val={form.investor_other} max={5000} />
              </InvestorField>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-5 flex items-center justify-between">
          <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:border-slate-400 disabled:opacity-30">
            ← 이전
          </button>
          <div className="flex items-center gap-3">
            {step < NAV_STEPS.length - 1 && (
              <button onClick={() => setStep((s) => s + 1)}
                className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">
                다음 →
              </button>
            )}
            <button onClick={handleSubmit} disabled={!canSubmit}
              className="rounded-xl bg-slate-900 px-8 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-40">
              {isSubmitting ? "제출 중…" : "검토 요청하기 🚀"}
            </button>
          </div>
        </div>
        {serverError && <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{serverError}</p>}
        {!canSubmit && !isSubmitting && (
          <p className="mt-2 text-center text-xs text-slate-400">
            기본 정보, 링크, 카테고리를 모두 입력해야 등록할 수 있습니다.
          </p>
        )}
      </div>
    </div>
  );
}

// ── Helper Components ─────────────────────────────────────────────────────────

function StepHeader({ title, desc, badge }: { title: string; desc: string; badge?: string }) {
  return (
    <div className="mb-2">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        {badge && <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">{badge}</span>}
      </div>
      <p className="mt-1 text-sm text-slate-500">{desc}</p>
    </div>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1 text-sm font-semibold text-slate-700">
        {label}{required && <span className="text-red-400">*</span>}
      </label>
      {hint && <p className="mb-1.5 text-xs text-slate-400">{hint}</p>}
      {children}
    </div>
  );
}

function InvestorField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>
      {children}
    </div>
  );
}

function CharCount({ val, max }: { val: string; max: number }) {
  return <p className="mt-1 text-right text-xs text-slate-400">{val.length} / {max}</p>;
}

function RoleOption({ selected, onClick, title, desc }: { selected: boolean; onClick: () => void; title: string; desc: string }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition ${
        selected ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"
      }`}>
      <div className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition ${
        selected ? "border-blue-500 bg-blue-500" : "border-slate-300"
      }`}>
        {selected && <span className="block h-2 w-2 rounded-full bg-white" />}
      </div>
      <div>
        <p className={`text-sm font-semibold ${selected ? "text-blue-700" : "text-slate-700"}`}>{title}</p>
        <p className="mt-0.5 text-xs text-slate-400">{desc}</p>
      </div>
    </button>
  );
}
