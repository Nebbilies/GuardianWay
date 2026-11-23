// Project the database demo into the two proposed read contracts.
const fs = require("node:fs");
const path = require("node:path");
const {
    records,
    school: demoSchool,
} = require("../backend/prisma/seed-demo-data.json");
const { recordId } = require("../backend/prisma/demo-record-id.cjs");
const reviewScenarios = require("../fixtures/transport/review-scenarios.json");
const school = "76a75c7a-a9cc-4e50-a556-b1847746d6c2";
const key = (ref) => ref.slice(1);
const id = (ref) => recordId(school, key(ref));
function student(ref) {
    const row = records.student[key(ref)];
    return { id: id(ref), code: row.studentCode, name: row.fullName };
}
function stop(ref) {
    const row = records.stop[key(ref)];
    return { id: id(ref), code: row.code, name: row.name };
}
const registrations = Object.entries(records.serviceRegistration).map(
    ([name, row]) => ({
        id: recordId(school, name),
        student: student(row.studentId),
        status: row.status,
        submittedAt: row.submittedAt,
        reviewNote: row.reviewNote ?? null,
        days: Object.values(records.registrationDay)
            .filter((day) => key(day.registrationId) === name)
            .map((day) => ({
                serviceDate: day.serviceDate.slice(0, 10),
                direction: day.direction,
                requestedStop: day.requestedStopId
                    ? stop(day.requestedStopId)
                    : null,
                approvedStop: day.approvedStopId
                    ? stop(day.approvedStopId)
                    : null,
            })),
    }),
);
const reviewRegistrations = new Map(
    Object.entries(records.serviceRegistration).map(([name, row], index) => [
        name,
        {
            ...registrations[index],
            submittedBy: records.userAccount[key(row.submittedById)].displayName,
            review: row.reviewedAt
                ? { reviewer: "Quản trị trường demo", reviewedAt: row.reviewedAt }
                : null,
            days: registrations[index].days.map((day) => ({
                ...day,
                requestedAddress: Object.values(records.registrationDay).find(
                    (record) =>
                        key(record.registrationId) === name &&
                        record.serviceDate.slice(0, 10) === day.serviceDate &&
                        record.direction === day.direction,
                )?.requestedAddress ?? null,
            })),
        },
    ]),
);
for (const scenario of reviewScenarios) {
    const date = new Date(scenario.startDate + "T00:00:00Z");
    const days = [];
    for (let day = 0; day < scenario.dayCount; day++) {
        for (const [direction, point] of Object.entries(scenario.points)) {
            days.push({
                serviceDate: date.toISOString().slice(0, 10),
                direction,
                requestedStop: stop(point),
                approvedStop: null,
                requestedAddress: scenario.requestedAddress ?? null,
            });
        }
        date.setUTCDate(date.getUTCDate() + 1);
    }
    reviewRegistrations.set(scenario.key, {
        ...reviewRegistrations.get(scenario.source),
        id: recordId(school, scenario.key),
        submittedAt: scenario.submittedAt,
        status: "PENDING",
        review: null,
        reviewNote: null,
        days,
    });
}
const manifests = Object.fromEntries(
    Object.entries(records.trip).map(([name, row]) => {
        const passengers = Object.entries(records.tripPassenger)
            .filter(([, p]) => key(p.tripId) === name)
            .map(([passengerKey, p]) => ({
                id: recordId(school, passengerKey),
                student: student(p.studentId),
                stop: stop(records.tripStop[key(p.tripStopId)].stopId),
                attendance: Object.values(records.attendanceEvent)
                    .filter((e) => e.tripPassengerId === "$" + passengerKey)
                    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
                    .map((e) => ({
                        kind: e.eventKind,
                        occurredAt: e.occurredAt,
                    })),
            }));
        return [
            name,
            {
                driver: row.initialDriverId ? key(row.initialDriverId) : null,
                body: {
                    trip: {
                        id: recordId(school, name),
                        serviceDate: row.serviceDate.slice(0, 10),
                        direction: row.direction,
                        status: row.status,
                        completedAt: row.completedAt ?? null,
                        cancellationReason: row.cancellationReason ?? null,
                    },
                    passengers,
                },
            },
        ];
    }),
);
const guardians = {};
const studentsByActor = Object.fromEntries(
    Object.entries(records.userAccount)
        .filter(([, account]) => account.role === "PARENT")
        .map(([actor]) => [actor, []]),
);
for (const link of Object.values(records.guardianLink)) {
    const actor = key(link.guardianAccountId);
    if (link.canTrack || link.canRequest) {
        (guardians[actor] ??= []).push(id(link.studentId));
    }
    if (link.canRequest) studentsByActor[actor]?.push(student(link.studentId));
}
const registrationForm = {
    schoolName: demoSchool.name,
    studentsByActor,
    points: Object.entries(records.stop)
        .filter(
            ([, row]) => row.kind === "SERVICE_POINT" && row.status === "ACTIVE",
        )
        .map(([name, row]) => ({
            ...stop("$" + name),
            address: row.address,
            allowsPickup: row.allowsPickup,
            allowsDropoff: row.allowsDropoff,
        })),
};
const file = path.join(__dirname, "../fixtures/transport/demo.json");
const registrationReview = {
    school: { name: demoSchool.name, timezone: demoSchool.timezone },
    registrations: [...reviewRegistrations.values()],
};
const json =
    JSON.stringify(
        { registrations, guardians, manifests, registrationForm, registrationReview },
        null,
        2,
    ) + "\n";
if (process.argv.includes("--check")) {
    if (fs.readFileSync(file, "utf8").replaceAll("\r\n", "\n") !== json)
        throw Error("Regenerate transport fixtures from the demo seed");
} else {
    fs.writeFileSync(file, json);
}
