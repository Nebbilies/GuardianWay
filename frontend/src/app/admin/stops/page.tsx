import { StopPage } from "@/modules/planning/stops/page";
import { registrationId } from "@/modules/transport/registration-review/paths";

export default async function Page({
    searchParams,
}: {
    searchParams: Promise<{ registration?: string | string[] }>;
}) {
    const id =
        process.env.NODE_ENV === "development"
            ? registrationId.safeParse((await searchParams).registration)
            : null;
    return <StopPage reviewId={id?.data} />;
}
