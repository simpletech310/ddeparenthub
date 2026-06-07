// Shared partner form fields, used by the admin create + edit partner pages.
export function PartnerFields({ defaults }: { defaults?: Record<string, string> }) {
  const d = defaults ?? {};
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Name</label><input name="name" className="input" defaultValue={d.name} required /></div>
        <div><label className="label">Category</label><input name="category" className="input" defaultValue={d.category} /></div>
      </div>
      <div><label className="label">Tagline (short, confidence-building)</label><input name="tagline" className="input" defaultValue={d.tagline} placeholder="Calm, outdoor group sessions kids love" /></div>
      <div><label className="label">Image URL</label><input name="imageUrl" className="input" defaultValue={d.imageUrl} placeholder="/media/partners/equine.svg" /></div>
      <div><label className="label">What they do</label><textarea name="description" className="input min-h-[60px]" defaultValue={d.description} /></div>
      <div><label className="label">How they help</label><textarea name="howTheyHelp" className="input min-h-[60px]" defaultValue={d.howTheyHelp} /></div>
      <div><label className="label">Services (one per line)</label><textarea name="services" className="input min-h-[60px]" defaultValue={d.services} /></div>
      <div><label className="label">Insurance accepted (comma)</label><input name="insuranceAccepted" className="input" defaultValue={d.insuranceAccepted} placeholder="Medi-Cal, Aetna, Kaiser, Private pay" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Interest tags (comma)</label><input name="interestTags" className="input" defaultValue={d.interestTags} placeholder="animals, horses, outdoors" /></div>
        <div><label className="label">Need tags (comma)</label><input name="needTags" className="input" defaultValue={d.needTags} placeholder="social, group_work, outdoor_time" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Contact name</label><input name="contactName" className="input" defaultValue={d.contactName} /></div>
        <div><label className="label">Phone</label><input name="phone" className="input" defaultValue={d.phone} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Email</label><input name="email" className="input" defaultValue={d.email} /></div>
        <div><label className="label">Website</label><input name="website" className="input" defaultValue={d.website} /></div>
      </div>
      <div><label className="label">Address</label><input name="address" className="input" defaultValue={d.address} /></div>
    </>
  );
}
