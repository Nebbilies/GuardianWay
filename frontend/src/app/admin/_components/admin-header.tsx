"use client";

import useSWR from "swr";
import { getSchoolContext } from "@/modules/system/schools/contracts";
import { PortalHeader } from "@/components/custom/portal-header";

export default function AdminHeader() {
  const { data: school } = useSWR("school-context", getSchoolContext);
  return <PortalHeader home="/" context={school?.name ?? "Quản trị trường"} />;
}
