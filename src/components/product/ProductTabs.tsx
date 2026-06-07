"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { ProductTeamMember, ProductShoutout, Profile, Comment } from "@/types";
import MediaGallery from "./MediaGallery";
import CommentItem from "./CommentItem";
import { createReview } from "@/lib/actions/review";

// ── Local Types ────────────────────────────────────────────────────────────────

type MakerInfo = Pick<Profile, "username" | "display_name" | "avatar_url" | "headline">;

export interface ReviewWithProfile {
  id: string;
  rating: number;
  content: string;
  created_at: string;
  profile: Pick<Profile, "username" | "display_name" | "avatar_url"> | null;
}

export type CommentWithProfile = Comment & {
  profile: Pick<Profile, "username" | "display_name" | "avatar_url"> | null;
};

type TeamMemberWithProfile = ProductTeamMember & {
  profile?: Pick<Profile, "id" | "username" | "display_name" | "avatar_url"> | null;
};

type Tab = "overview" | "team" | "shoutouts" | "reviews";

export interface ProductTabsProps {
  productId: string;
  description: string;
  videoUrl: string | null;
  galleryImages: string[];
  maker: MakerInfo | null;
  makerType: "maker" | "hunter";
  isCurated?: boolean;
  makerProducts?: { id: string; slug?: string; name: string; thumbnail_url: string | null }[];
  teamMembers: TeamMemberWithProfile[];
  shoutouts: ProductShoutout[];
  reviews: ReviewWithProfile[];
  comments: CommentWithProfile[];
  userId: string | null;
  userHasReview: boolean;
}

// ── Avatar ─────────────────────────────────────────────────────────────────────

function Avatar({
  url,
  name,
  size = 40,
}: {
  url: string | null | undefined;
  name: string;
  size?: number;
}) {
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-navy-900"
      style={{ width: size, height: size }}
    >
      {url ? (
        <Image
          src={url}
          alt={name}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          unoptimized
        />
      ) : (
        <span
          className="font-bold text-white"
          style={{ fontSize: Math.max(10, size * 0.35) }}
        >
          {name[0]?.toUpperCase() ?? "?"}
        </span>
      )}
    </div>
  );
}

// ── Top-level Comment Form ─────────────────────────────────────────────────────

function CommentTopForm({ productId }: { productId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("product_id", productId);
    startTransition(async () => {
      const { createComment } = await import("@/lib/actions/comment");
      await createComment(fd);
      formRef.current?.reset();
    });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="mb-8">
      <textarea
        name="content"
        placeholder="이 제품에 대한 생각을 공유해 주세요…"
        rows={3}
        required
        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
      />
      <div className="mt-2 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "작성 중…" : "댓글 작성"}
        </button>
      </div>
    </form>
  );
}

// ── Star Rating ────────────────────────────────────────────────────────────────

function StarRating({
  value,
  onChange,
  size = "md",
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: "sm" | "md" | "lg";
}) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  const sizeClass = { sm: "text-base", md: "text-2xl", lg: "text-[2.5rem]" }[size];

  if (!onChange) {
    return (
      <div className={`flex gap-0.5 leading-none ${sizeClass}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={active >= star ? "text-amber-400" : "text-slate-200"}
          >
            ★
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex gap-1 leading-none ${sizeClass}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className={`transition-all hover:scale-110 ${active >= star ? "text-amber-400" : "text-slate-200"}`}
          aria-label={`${star}점`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ProductTabs({
  productId,
  description,
  videoUrl,
  galleryImages,
  maker,
  makerType,
  isCurated,
  makerProducts,
  teamMembers,
  shoutouts,
  reviews,
  comments,
  userId,
  userHasReview,
}: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "overview", label: "개요" },
    ...(!isCurated ? [
      { id: "team" as Tab, label: "팀", count: teamMembers.length },
      { id: "shoutouts" as Tab, label: "추천 도구", count: shoutouts.length },
    ] : []),
    { id: "reviews", label: "리뷰", count: reviews.length },
  ];

  return (
    <div>
      {/* Tab Navigation */}
      <nav className="mb-8 flex gap-1 border-b border-slate-100">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`-mb-px flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-slate-500 hover:border-slate-200 hover:text-slate-900"
            }`}
          >
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <span
                className={`min-w-[20px] rounded-full px-1.5 py-0.5 text-center text-xs font-semibold leading-none ${
                  activeTab === tab.id
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* ── 개요 ── */}
      {activeTab === "overview" && (
        <div>
          <MediaGallery videoUrl={videoUrl} galleryImages={galleryImages} />

          <section className="mb-10">
            <h2 className="mb-3 text-lg font-bold text-slate-900">소개</h2>
            <div className="whitespace-pre-wrap leading-relaxed text-slate-600">
              {description}
            </div>
          </section>

          {maker && (
            <section className="mb-10 rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {isCurated ? "큐레이터" : makerType === "maker" ? "메이커" : "큐레이터"}
              </p>
              <div className="flex items-center gap-3">
                <Avatar
                  url={maker.avatar_url}
                  name={maker.display_name ?? maker.username ?? "?"}
                  size={40}
                />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/profile/${maker.username}`}
                    className="font-semibold text-slate-900 hover:text-blue-700"
                  >
                    {maker.display_name ?? maker.username}
                  </Link>
                  {maker.headline && (
                    <p className="text-sm text-slate-500">{maker.headline}</p>
                  )}
                </div>
              </div>
              {makerProducts && makerProducts.length > 0 && (
                <div className="mt-3 border-t border-slate-200 pt-3">
                  <p className="mb-2 text-xs text-slate-400">출시한 제품</p>
                  <div className="flex flex-wrap gap-2">
                    {makerProducts.map((p) => (
                      <Link key={p.id} href={`/products/${p.slug ?? p.id}`}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 transition hover:border-blue-300 hover:text-blue-700">
                        {p.thumbnail_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.thumbnail_url} alt={p.name} className="h-4 w-4 rounded object-cover" />
                        ) : (
                          <span className="flex h-4 w-4 items-center justify-center rounded bg-slate-200 text-[9px] font-bold text-slate-500">
                            {p.name[0]?.toUpperCase()}
                          </span>
                        )}
                        {p.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          <section>
            <h2 className="mb-5 text-lg font-bold text-slate-900">
              댓글{" "}
              <span className="ml-1 text-base font-normal text-slate-400">
                {comments.length}
              </span>
            </h2>
            {userId ? (
              <CommentTopForm productId={productId} />
            ) : (
              <div className="mb-6 rounded-xl border border-dashed border-slate-200 py-5 text-center">
                <p className="text-sm text-slate-500">
                  댓글을 남기려면{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    로그인
                  </Link>
                  이 필요합니다.
                </p>
              </div>
            )}
            <div className="space-y-6">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment as Comment}
                  productId={productId}
                  userId={userId}
                />
              ))}
              {comments.length === 0 && (
                <p className="py-4 text-center text-sm text-slate-400">
                  아직 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!
                </p>
              )}
            </div>
          </section>
        </div>
      )}

      {/* ── 팀 ── */}
      {activeTab === "team" && (
        <div>
          {teamMembers.length === 0 && !(makerType === "maker" && maker) ? (
            <div className="py-16 text-center text-slate-400">
              <p className="mb-3 text-5xl">👥</p>
              <p className="text-sm">팀 정보가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Launches인 경우 메이커(창업자)를 팀 상단에 표시 */}
              {makerType === "maker" && maker && (
                <div className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <Avatar url={maker.avatar_url} name={maker.display_name ?? maker.username ?? "?"} size={48} />
                  <div className="flex-1">
                    {maker.username ? (
                      <Link href={`/profile/${maker.username}`} className="font-semibold text-slate-900 hover:text-blue-700">
                        {maker.display_name ?? maker.username}
                      </Link>
                    ) : (
                      <p className="font-semibold text-slate-900">{maker.display_name ?? maker.username}</p>
                    )}
                    <p className="text-sm text-slate-500">창업자</p>
                  </div>
                  {maker.username && (
                    <Link href={`/profile/${maker.username}`} className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100">
                      프로필 →
                    </Link>
                  )}
                </div>
              )}
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 transition hover:border-slate-200 hover:shadow-sm"
                >
                  <Avatar
                    url={member.profile?.avatar_url}
                    name={member.name}
                    size={48}
                  />
                  <div className="flex-1">
                    {member.profile?.username ? (
                      <Link
                        href={`/profile/${member.profile.username}`}
                        className="font-semibold text-slate-900 hover:text-blue-700"
                      >
                        {member.name}
                      </Link>
                    ) : (
                      <p className="font-semibold text-slate-900">
                        {member.name}
                      </p>
                    )}
                    <p className="text-sm text-slate-500">{member.role}</p>
                  </div>
                  {member.profile?.username && (
                    <Link
                      href={`/profile/${member.profile.username}`}
                      className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100"
                    >
                      프로필 →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 추천 도구 ── */}
      {activeTab === "shoutouts" && (
        <div>
          {shoutouts.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <p className="mb-3 text-5xl">📣</p>
              <p className="text-sm">추천 도구가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {shoutouts.map((shoutout) => (
                <div
                  key={shoutout.id}
                  className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-5 transition hover:border-slate-200 hover:shadow-sm"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200">
                    <span className="text-lg font-black text-slate-400">
                      {shoutout.shoutout_name[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex items-center gap-2">
                      <p className="font-semibold text-slate-900">
                        {shoutout.shoutout_name}
                      </p>
                      {shoutout.shoutout_url && (
                        <a
                          href={shoutout.shoutout_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-blue-100 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 hover:bg-blue-100"
                        >
                          방문 ↗
                        </a>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-slate-500">
                      {shoutout.reason_text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 리뷰 ── */}
      {activeTab === "reviews" && (
        <ReviewsPanel
          productId={productId}
          reviews={reviews}
          userId={userId}
          userHasReview={userHasReview}
        />
      )}
    </div>
  );
}

// ── Reviews Panel ──────────────────────────────────────────────────────────────

const RATING_LABELS = [
  "",
  "별로예요",
  "그저 그래요",
  "보통이에요",
  "좋아요",
  "최고예요",
];

function ReviewsPanel({
  productId,
  reviews,
  userId,
  userHasReview,
}: {
  productId: string;
  reviews: ReviewWithProfile[];
  userId: string | null;
  userHasReview: boolean;
}) {
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  const avg =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  const handleSubmit = async () => {
    if (rating === 0 || content.trim().length < 10) return;
    setIsSubmitting(true);
    setError(null);
    const result = await createReview({ productId, rating, content });
    setIsSubmitting(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setSubmitted(true);
      setRating(0);
      setContent("");
      router.refresh();
    }
  };

  return (
    <div className="space-y-8">
      {/* Stats */}
      {reviews.length > 0 && (
        <div className="flex gap-8 rounded-2xl border border-slate-100 bg-slate-50 p-6">
          <div className="flex min-w-[90px] flex-col items-center justify-center gap-2">
            <p className="text-5xl font-black leading-none text-slate-900">
              {avg.toFixed(1)}
            </p>
            <StarRating value={Math.round(avg)} size="sm" />
            <p className="text-xs text-slate-400">{reviews.length}개 리뷰</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {dist.map(({ star, count }) => (
              <div key={star} className="flex items-center gap-2.5">
                <span className="w-4 text-right text-xs font-medium text-slate-500">
                  {star}
                </span>
                <span className="text-xs text-amber-400">★</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all duration-500"
                    style={{
                      width:
                        reviews.length > 0
                          ? `${(count / reviews.length) * 100}%`
                          : "0%",
                    }}
                  />
                </div>
                <span className="w-4 text-right text-xs text-slate-400">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Write review */}
      {!userId ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-8 text-center">
          <p className="text-sm text-slate-500">
            리뷰를 작성하려면{" "}
            <Link
              href="/login"
              className="font-semibold text-blue-600 hover:underline"
            >
              로그인
            </Link>
            이 필요합니다.
          </p>
        </div>
      ) : userHasReview || submitted ? (
        <div className="flex items-center gap-2 rounded-2xl border border-green-100 bg-green-50 px-5 py-4 text-sm text-green-700">
          <span className="text-lg">✓</span>
          <span>이 제품에 리뷰를 작성하셨습니다.</span>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-5 text-base font-bold text-slate-900">
            리뷰 작성
          </h3>

          {/* Star selector */}
          <div className="mb-5">
            <p className="mb-2.5 text-sm font-medium text-slate-700">별점</p>
            <StarRating value={rating} onChange={setRating} size="lg" />
            {rating > 0 && (
              <p className="mt-2 text-sm font-medium text-amber-600">
                {RATING_LABELS[rating]}
              </p>
            )}
          </div>

          {/* Content */}
          <div className="mb-5">
            <p className="mb-2 text-sm font-medium text-slate-700">
              리뷰 내용
            </p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="이 제품을 사용해 본 경험을 자유롭게 작성해주세요. (최소 10자)"
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
            <p
              className={`mt-1 text-right text-xs ${
                content.length > 0 && content.length < 10
                  ? "text-red-400"
                  : "text-slate-400"
              }`}
            >
              {content.length}자
            </p>
          </div>

          {error && (
            <p className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={
              rating === 0 || content.trim().length < 10 || isSubmitting
            }
            className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-40"
          >
            {isSubmitting ? "등록 중..." : "리뷰 등록"}
          </button>
        </div>
      )}

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <div className="py-12 text-center text-slate-400">
          <p className="mb-3 text-5xl">⭐</p>
          <p className="text-sm">
            아직 리뷰가 없습니다. 첫 번째 리뷰를 작성해보세요!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-2xl border border-slate-100 bg-white p-5 transition hover:border-slate-200 hover:shadow-sm"
            >
              <div className="mb-3 flex items-start gap-3">
                <Avatar
                  url={review.profile?.avatar_url}
                  name={
                    review.profile?.display_name ??
                    review.profile?.username ??
                    "?"
                  }
                  size={40}
                />
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {review.profile?.display_name ??
                      review.profile?.username ??
                      "익명"}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <StarRating value={review.rating} size="sm" />
                    <span className="text-xs text-slate-400">
                      {new Date(review.created_at).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-slate-600">
                {review.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
