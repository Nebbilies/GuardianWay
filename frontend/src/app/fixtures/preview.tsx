"use client";
import { useEffect, useState } from "react";
import { preview, scenarios } from "../../../../fixtures/transport/preview";
export function FixturePreview() {
    const [index, select] = useState(0);
    const [lines, setLines] = useState<string[]>([]);
    useEffect(() => {
        let active = true;
        preview(scenarios[index]).then((rows) => {
            if (active) setLines(rows);
        });
        return () => {
            active = false;
        };
    }, [index]);
    return (
        <main className="mx-auto max-w-3xl space-y-5 p-6">
            <h1 className="text-2xl font-semibold">
                Fixture đăng ký và vận hành chuyến
            </h1>
            <label className="block">
                Tình huống
                <select
                    className="block rounded border p-2"
                    value={index}
                    onChange={(e) => select(Number(e.target.value))}
                >
                    {scenarios.map((s, i) => (
                        <option key={s.label} value={i}>
                            {s.label}
                        </option>
                    ))}
                </select>
            </label>
            <ul aria-live="polite" className="space-y-2">
                {lines.map((line) => (
                    <li key={line}>{line}</li>
                ))}
            </ul>
        </main>
    );
}
