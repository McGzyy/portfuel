export type AnnouncementSeverity = "info" | "warning" | "success";
export type AnnouncementAudience = "all" | "member" | "pro";

export type SiteAnnouncement = {
  id: string;
  title: string;
  body: string;
  severity: AnnouncementSeverity;
  audience: AnnouncementAudience;
  link_url: string | null;
  link_label: string | null;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
