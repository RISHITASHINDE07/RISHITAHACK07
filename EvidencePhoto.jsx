import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Loader2 } from "lucide-react";

// Renders an evidence photo. Public http URLs (e.g. seed/Unsplash) load directly;
// private file_uri values from UploadPrivateFile are signed client-side before display.
export function EvidencePhoto({ url, alt = "Evidence", className = "" }) {
  const isHttp = url && /^https?:\/\//.test(url);
  const [src, setSrc] = useState(isHttp ? url : null);
  const [signing, setSigning] = useState(!!(url && !isHttp));

  useEffect(() => {
    let active = true;
    if (!url) { setSrc(null); return; }
    if (/^https?:\/\//.test(url)) { setSrc(url); setSigning(false); return; }
    setSigning(true);
    base44.integrations.Core.CreateFileSignedUrl({ file_uri: url })
      .then((r) => { if (active) setSrc(r?.signed_url || null); })
      .catch(() => { if (active) setSrc(null); })
      .finally(() => { if (active) setSigning(false); });
    return () => { active = false; };
  }, [url]);

  if (signing && !src) {
    return <div className={`flex items-center justify-center bg-secondary rounded-lg ${className}`}><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }
  if (!src) return null;
  return <Image src={src} alt={alt} className={className} fittingType="fill" />;
}
