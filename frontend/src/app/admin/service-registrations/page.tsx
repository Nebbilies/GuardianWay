import { ReviewPage } from "@/modules/transport/registration-review/page";

export default async function Page({
    searchParams,
}: {
    searchParams: Promise<{ status?: string | string[] }>;
}) {
    const { status } = await searchParams;
    return (
        <ReviewPage
            initialStatus={
                status === "APPROVED" || status === "REJECTED"
                    ? status
                    : "PENDING"
            }
        />
    );
}
