import { notFound } from "next/navigation";
import { ReviewPage } from "@/modules/transport/registration-review/page";
import { registrationId } from "@/modules/transport/registration-review/paths";

export default async function Page({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const result = registrationId.safeParse((await params).id);
    if (!result.success) notFound();
    return <ReviewPage id={result.data} />;
}
