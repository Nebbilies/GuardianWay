"use client";

import { ErrorNotice } from "@/components/error-notice";
import { useState } from "react";
import { navigateAfterSessionChange } from "@/lib/session-navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { PasswordInput } from "@/components/custom/password-input";
import { AuthShell } from "@/components/custom/auth-shell";
import { loginWeb } from "@/modules/system/auth/contracts";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<unknown>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const { user } = await loginWeb(email, password);

            navigateAfterSessionChange(
                user?.role === "SUPER_ADMIN"
                    ? "/platform/schools"
                    : "/admin/users",
            );
        } catch (err) {
            setError(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AuthShell
            title="Đăng nhập quản trị"
            description="Dùng tài khoản đã thiết lập mật khẩu qua liên kết mời."
        >
            <form onSubmit={onSubmit} className="space-y-4">
                <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="ban@truong.edu.vn"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                        disabled={isSubmitting}
                    />
                </Field>

                <Field>
                    <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
                    <PasswordInput
                        id="password"
                        autoComplete="current-password"
                        placeholder="Nhập mật khẩu"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
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
                    {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
                </Button>
            </form>
        </AuthShell>
    );
}
