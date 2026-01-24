import { type ReactNode, useEffect } from "react";
import { auth } from "../auth";
export default function Protected({ children }: { children: ReactNode }) {
useEffect(() => {
if (!auth.token) window.location.href = "/login";
}, []);
return <>{children}</>;
}