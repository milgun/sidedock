export type ProductCategory =
  | "ai-tool"
  | "saas"
  | "dev-tool"
  | "productivity"
  | "design"
  | "marketing"
  | "mobile-app"
  | "browser-extension"
  | "desktop-app"
  | "game"
  | "api"
  | "education"
  | "finance"
  | "health"
  | "social"
  | "ecommerce"
  | "media"
  | "other";

export type LinkType =
  | "app-store"
  | "google-play"
  | "steam"
  | "github"
  | "bitbucket"
  | "gitlab"
  | "other";

export type MakerType = "maker" | "hunter";

export type ProductStatus = "draft" | "pending_review" | "published" | "rejected";

export interface Product {
  id: string;
  name: string;
  tagline: string;
  description: string;
  url: string;
  thumbnail_url: string | null;
  video_url: string | null;
  category: ProductCategory;
  categories: string[];
  tags: string[];
  maker_id: string;
  upvote_count: number;
  comment_count: number;
  is_featured: boolean;
  featured_label: string | null;
  source: 'curated' | 'launch';
  gallery_images: string[];
  is_open_source: boolean;
  repo_url: string | null;
  maker_type: MakerType;
  status: ProductStatus;
  rejection_reason: string | null;
  launched_at: string;
  created_at: string;
}

export interface ProductLink {
  id: string;
  product_id: string;
  link_type: LinkType;
  url: string;
  label: string | null;
  sort_order: number;
  created_at: string;
}

export interface ProductTeamMember {
  id: string;
  product_id: string;
  profile_id: string | null;
  name: string;
  role: string;
  created_at: string;
  profile?: Profile;
}

export interface ProductShoutout {
  id: string;
  product_id: string;
  shoutout_name: string;
  shoutout_url: string | null;
  reason_text: string;
  sort_order: number;
  created_at: string;
}

export interface ProductInvestorInfo {
  id: string;
  product_id: string;
  founder_reason: string | null;
  idea_reason: string | null;
  competitors_text: string | null;
  revenue_info: string | null;
  other_info: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  bio: string | null;
  website_url: string | null;
  twitter_url: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface Upvote {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  product_id: string;
  content: string;
  created_at: string;
  profile?: Profile;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  content: string;
  created_at: string;
  profile?: Profile;
}

export interface SavedProduct {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

// 피드용 확장 타입 (조인 포함)
export interface ProductWithMaker extends Product {
  maker: Profile;
  has_upvoted?: boolean;
  has_saved?: boolean;
}

// 상세 페이지용 (링크·팀·shoutouts 포함)
export interface ProductWithDetails extends ProductWithMaker {
  links?: ProductLink[];
  team_members?: ProductTeamMember[];
  shoutouts?: ProductShoutout[];
}

// Dev Log
export interface DevlogPost {
  id: string;
  author_id: string;
  title: string;
  content: string;
  tags: string[];
  thumbnail_url: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export interface DevlogComment {
  id: string;
  author_id: string;
  post_id: string;
  content: string;
  created_at: string;
  author?: Profile;
}

export interface DevlogPostWithAuthor extends DevlogPost {
  author: Profile;
  has_liked?: boolean;
}
