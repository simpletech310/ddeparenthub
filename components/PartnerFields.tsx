// Shared partner form fields, used by the admin create + edit partner pages.
// (Image is handled separately by PartnerImageUpload — no URL pasting here.)
function Group({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3 rounded-2xl border border-brand-100 bg-brand-50/30 p-4">
      <legend className="px-1 text-xs font-bold uppercase tracking-wide text-ink-500">{title}</legend>
      {hint && <p className="-mt-1 text-xs text-ink-400">{hint}</p>}
      {children}
    </fieldset>
  );
}

const SOCIALS: { name: string; label: string; placeholder: string }[] = [
  { name: "social_instagram", label: "Instagram", placeholder: "@handle or full URL" },
  { name: "social_facebook", label: "Facebook", placeholder: "Page name or full URL" },
  { name: "social_youtube", label: "YouTube", placeholder: "@channel or full URL" },
  { name: "social_tiktok", label: "TikTok", placeholder: "@handle or full URL" },
  { name: "social_linkedin", label: "LinkedIn", placeholder: "company/name or full URL" },
  { name: "social_x", label: "X (Twitter)", placeholder: "@handle or full URL" },
];

export function PartnerFields({ defaults }: { defaults?: Record<string, string> }) {
  const d = defaults ?? {};
  return (
    <div className="space-y-4">
      <Group title="Basics">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Name</label><input name="name" className="input" defaultValue={d.name} required /></div>
          <div><label className="label">Category</label><input name="category" className="input" defaultValue={d.category} placeholder="Speech clinic" /></div>
        </div>
        <div><label className="label">Tagline (short, confidence-building)</label><input name="tagline" className="input" defaultValue={d.tagline} placeholder="Calm, outdoor group sessions kids love" /></div>
        <div><label className="label">What they do</label><textarea name="description" className="input min-h-[60px]" defaultValue={d.description} /></div>
        <div><label className="label">How they help DDE families</label><textarea name="howTheyHelp" className="input min-h-[60px]" defaultValue={d.howTheyHelp} /></div>
        <div><label className="label">Services (one per line)</label><textarea name="services" className="input min-h-[60px]" defaultValue={d.services} placeholder={"Weekend social groups\n1:1 sessions"} /></div>
      </Group>

      <Group title="Matching & insurance" hint="Tags drive the recommendations families see. Match them to child interests and needs.">
        <div><label className="label">Insurance accepted (comma)</label><input name="insuranceAccepted" className="input" defaultValue={d.insuranceAccepted} placeholder="Medi-Cal, Aetna, Kaiser, Private pay" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Interest tags (comma)</label><input name="interestTags" className="input" defaultValue={d.interestTags} placeholder="animals, horses, outdoors" /></div>
          <div><label className="label">Need tags (comma)</label><input name="needTags" className="input" defaultValue={d.needTags} placeholder="social, group_work, outdoor_time" /></div>
        </div>
      </Group>

      <Group title="Contact">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Contact name</label><input name="contactName" className="input" defaultValue={d.contactName} /></div>
          <div><label className="label">Phone</label><input name="phone" className="input" defaultValue={d.phone} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Email</label><input name="email" className="input" defaultValue={d.email} /></div>
          <div><label className="label">Website</label><input name="website" className="input" defaultValue={d.website} placeholder="example.com" /></div>
        </div>
        <div><label className="label">Address</label><input name="address" className="input" defaultValue={d.address} /></div>
      </Group>

      <Group title="Social networks" hint="Leave any blank. Paste a full URL or just the @handle.">
        <div className="grid grid-cols-2 gap-3">
          {SOCIALS.map((s) => (
            <div key={s.name}>
              <label className="label">{s.label}</label>
              <input name={s.name} className="input" defaultValue={d[s.name]} placeholder={s.placeholder} />
            </div>
          ))}
        </div>
      </Group>
    </div>
  );
}
