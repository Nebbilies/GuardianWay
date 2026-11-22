import { z } from "zod";
import { roleSchema, callApi } from "@/lib/http/contracts";
export const webLoginSchema = z.object({ user: z.object({ id: z.uuid(), name: z.string(), email: z.email(), role: roleSchema }) });
export const currentUserSchema = z.object({ user: webLoginSchema.shape.user.extend({ schoolId: z.uuid().nullable() }) });
export const logoutSchema = z.object({ message: z.string() });
export const loginWeb = (email: string, password: string) => callApi({ path: "/auth/login", method: "POST", body: { email, password } }, webLoginSchema);
export const setupPassword = (token: string, password: string) => callApi({ path: "/auth/setup-password", method: "POST", body: { token, password } }, logoutSchema);
export const logoutWeb = () => callApi({ path: "/auth/logout", method: "POST" }, logoutSchema);

export const refreshWeb = () => callApi({ path: "/auth/refresh", method: "POST" }, webLoginSchema);
export const currentUser = () => callApi({ path: "/auth/me", method: "GET" }, currentUserSchema);
