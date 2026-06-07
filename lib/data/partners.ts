import { getDb, saveDb, id } from "./store";
import type { Partner } from "@/lib/types";

// DDE Partner Directory — admin-managed organization profiles. Async store.

export async function listPartners(includeArchived = false): Promise<Partner[]> {
  const all = (await getDb()).partners;
  return includeArchived ? all : all.filter((p) => p.status === "active");
}
export async function getPartner(partnerId: string): Promise<Partner | undefined> {
  return (await getDb()).partners.find((p) => p.id === partnerId);
}
export async function createPartner(data: Omit<Partner, "id" | "status">): Promise<Partner> {
  const partner: Partner = { ...data, id: id("partner"), status: "active" };
  await saveDb((db) => db.partners.push(partner));
  return partner;
}
export async function updatePartner(partnerId: string, patch: Partial<Omit<Partner, "id">>): Promise<void> {
  await saveDb((db) => {
    const p = db.partners.find((x) => x.id === partnerId);
    if (p) Object.assign(p, patch);
  });
}
export async function setPartnerStatus(partnerId: string, status: Partner["status"]): Promise<void> {
  await saveDb((db) => {
    const p = db.partners.find((x) => x.id === partnerId);
    if (p) p.status = status;
  });
}
