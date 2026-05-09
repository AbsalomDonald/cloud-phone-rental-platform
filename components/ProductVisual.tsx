import { CheckCircle2, Clock3, KeyRound, Server, ShieldCheck, Smartphone, Wifi } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";

export function ProductVisual({ dictionary }: { dictionary: Dictionary }) {
  const visual = dictionary.home.visual;

  return (
    <div className="product-visual" aria-label={visual.title}>
      <div className="visual-toolbar">
        <div className="visual-title">
          <Server size={18} />
          {visual.title}
        </div>
        <span className="badge blue">
          <ShieldCheck size={14} />
          {visual.status}
        </span>
      </div>

      <div className="visual-body">
        <div className="phone-frame">
          <div className="phone-status">
            <span>9:41</span>
            <span>
              <Wifi size={14} aria-hidden="true" /> 5G
            </span>
          </div>
          <div>
            <div className="phone-app-grid">
              {[Smartphone, KeyRound, Clock3, CheckCircle2, Server, ShieldCheck].map((Icon, index) => (
                <div className="phone-app" key={index}>
                  <Icon size={24} />
                </div>
              ))}
            </div>
          </div>
          <div className="small-muted">Android Cloud Environment</div>
        </div>

        <div className="visual-panel">
          <div className="visual-record">
            <span>{visual.device}</span>
            <strong>Cloud Phone #001</strong>
            <span className="badge">{visual.status}</span>
          </div>
          <div className="visual-record">
            <span>{visual.expires}</span>
            <strong>2026-06-05</strong>
          </div>
          <div className="visual-record">
            <span>{visual.order}</span>
            <strong>ORD-20260505-001</strong>
          </div>
          <div className="visual-record">
            <span>{visual.support}</span>
            <strong>#SUP-1024</strong>
          </div>
          <div className="hero-dock">
            <div>
              <span>Secure</span>
              <strong>Server</strong>
            </div>
            <div>
              <span>Web</span>
              <strong>Access</strong>
            </div>
            <div>
              <span>Provider</span>
              <strong>Hidden</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
