import { SiteFrame } from "@/components/marketing/site-frame";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <SiteFrame>{children}</SiteFrame>;
}
