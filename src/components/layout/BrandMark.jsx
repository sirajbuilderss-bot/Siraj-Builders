import logo from "../../assets/logo.png";

export default function BrandMark({ admin = false }) {
  const className = admin ? "ad-brand-mark" : "brand-mark";
  return (
    <span className={className}>
      <img src={logo} alt="" width="80" height="80" />
    </span>
  );
}
