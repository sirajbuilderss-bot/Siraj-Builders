import { useSiteData } from "../../context/SiteDataContext";

export default function BrandMark({ admin = false }) {
  const { company } = useSiteData();
  const className = admin ? "ad-brand-mark" : "brand-mark";
  return company.logoUrl ? (
    <span className={className}>
      <img src={company.logoUrl} alt="" />
    </span>
  ) : (
    <span className={className}>{company.initials}</span>
  );
}
