"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { ErrorNotice } from "@/components/error-notice";
import { ListPage } from "@/components/custom/list-page";
import { Button } from "@/components/ui/button";
import { currentUser } from "@/modules/system/auth/contracts";
import { getSchoolContext } from "@/modules/system/schools/contracts";
import {
    demoSchool,
    readReviewSession,
    reviewQueue,
    reviewSessionKey,
    type ReviewSession,
} from "./demo";
import { ReviewList } from "./list";
import { ReviewDetails } from "./detail";
import {
    assignDays,
    finishReview,
    ReviewError,
    type ReviewRegistration,
} from "./review";
import { registrationListPath } from "./paths";

type View =
    | { id: string; initialStatus?: never }
    | { id?: never; initialStatus: ReviewRegistration["status"] };

async function loadScope() {
    const [{ user }, school] = await Promise.all([
        currentUser(),
        getSchoolContext(),
    ]);
    if (
        user.role !== "ADMIN" ||
        user.schoolId !== school.id ||
        school.name !== demoSchool.name ||
        school.timezone !== demoSchool.timezone
    )
        return null;
    return {
        reviewer: user.name,
        schoolId: school.id,
        timezone: school.timezone,
        sessionKey: reviewSessionKey(school.id, user.id),
    };
}

export function ReviewPage(view: View) {
    const { data, error, isLoading, mutate } = useSWR(
        "registration-review-scope",
        loadScope,
    );
    if (error || isLoading)
        return (
            <ListPage title="Đăng ký xe">
                {error ? (
                    <>
                        <ErrorNotice error={error} />
                        <Button variant="outline" onClick={() => void mutate()}>
                            Thử lại
                        </Button>
                    </>
                ) : (
                    <p role="status">Đang tải đăng ký xe…</p>
                )}
            </ListPage>
        );
    if (!data)
        return (
            <ListPage title="Đăng ký xe">
                <p>Chức năng dành cho quản trị trường demo.</p>
            </ListPage>
        );
    return (
        <ReviewWorkspace
            key={data.sessionKey + ":" + (view.id ?? view.initialStatus)}
            view={view}
            scope={data}
        />
    );
}

function ReviewWorkspace({
    view,
    scope,
}: {
    view: View;
    scope: NonNullable<Awaited<ReturnType<typeof loadScope>>>;
}) {
    const { sessionKey, reviewer, schoolId, timezone } = scope;
    const [session, setSession] = useState(() => readReviewSession(sessionKey));
    const queue = reviewQueue(session);
    if (view.id === undefined)
        return (
            <ReviewList
                registrations={queue}
                initialStatus={view.initialStatus}
                timezone={timezone}
            />
        );
    const id = view.id;
    const row = queue.find((registration) => registration.id === id);
    if (!row)
        return (
            <ListPage title="Không tìm thấy đăng ký">
                <Button variant="outline" asChild>
                    <Link href={registrationListPath}>
                        Về danh sách đăng ký
                    </Link>
                </Button>
            </ListPage>
        );

    function update(
        transform: (
            latest: ReviewSession,
            registration: ReviewRegistration,
            registrations: ReviewRegistration[],
        ) => ReviewSession,
    ) {
        const latest = readReviewSession(sessionKey);
        const registrations = reviewQueue(latest);
        const current = registrations.find(
            (registration) => registration.id === id,
        );
        if (!current || current.status !== "PENDING") {
            setSession(latest);
            throw new ReviewError("Đăng ký đã được xử lý.");
        }
        const next = transform(latest, current, registrations);
        window.sessionStorage.setItem(sessionKey, JSON.stringify(next));
        setSession(next);
    }

    return (
        <ReviewDetails
            registration={row}
            registrations={queue}
            schoolId={schoolId}
            timezone={timezone}
            draft={session.drafts[id] ?? {}}
            onAssign={(days, pointId) =>
                update((latest) => ({
                    ...latest,
                    drafts: {
                        ...latest.drafts,
                        [id]: assignDays(
                            latest.drafts[id] ?? {},
                            days,
                            pointId,
                        ),
                    },
                }))
            }
            onDecision={(decision) =>
                update((latest, current, registrations) => {
                    const result = finishReview(
                        current,
                        decision.kind === "reject"
                            ? decision
                            : {
                                  ...decision,
                                  draft: latest.drafts[id] ?? {},
                                  registrations,
                              },
                        { reviewer, reviewedAt: new Date().toISOString() },
                    );
                    const drafts = { ...latest.drafts };
                    delete drafts[id];
                    return {
                        drafts,
                        results: { ...latest.results, [id]: result },
                    };
                })
            }
        />
    );
}
