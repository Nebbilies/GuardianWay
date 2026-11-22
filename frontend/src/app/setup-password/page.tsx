"use client";

import { ErrorNotice } from "@/components/error-notice";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { PasswordInput } from "@/components/custom/password-input";
import { AuthShell } from "@/components/custom/auth-shell";
import { setupPassword } from "@/modules/system/auth/contracts";

function SetupPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<unknown>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        if (!token) {
            setError({ code: "INVITATION_INVALID" });
            return;
        }

        if (password.length < 8) {
            setError({ code: "PASSWORD_TOO_SHORT" });
            return;
        }

        if (password !== confirmPassword) {
            setError({ code: "PASSWORD_MISMATCH" });
            return;
        }

        setIsSubmitting(true);

        try {
            await setupPassword(token, password);

            router.push("/login");
        } catch (err) {
            setError(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AuthShell
            title="Thiết lập mật khẩu"
            description="Nhập mật khẩu mới để hoàn tất kích hoạt tài khoản."
        >
            <form onSubmit={onSubmit} className="space-y-4">
                <Field>
                    <FieldLabel htmlFor="password">Mật khẩu mới</FieldLabel>
                    <PasswordInput
                        id="password"
                        placeholder="Nhập mật khẩu mới"
                        autoComplete="new-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        disabled={isSubmitting}
                    />
                    <FieldDescription>Ít nhất 8 ký tự.</FieldDescription>
                </Field>

                <Field>
                    <FieldLabel htmlFor="confirmPassword">
                        Xác nhận mật khẩu
                    </FieldLabel>
                    <PasswordInput
                        id="confirmPassword"
                        placeholder="Nhập lại mật khẩu mới"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(event) =>
                            setConfirmPassword(event.target.value)
                        }
                        required
                        disabled={isSubmitting}
                    />
                </Field>

                {error ? <ErrorNotice error={error} /> : null}

                <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Đang lưu..." : "Hoàn tất"}
                </Button>
            </form>
        </AuthShell>
    );
}

export default function SetupPasswordPage() {
    return (
        <Suspense
            fallback={
                <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
                    Đang tải...
                </div>
            }
        >
            <SetupPasswordForm />
        </Suspense>
    );
}
