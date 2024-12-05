'use client';

import { SessionProvider, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { usePathname } from "next/navigation";

interface ProtectedPageProps {
    children: ReactNode;
}

const ProtectedPage: React.FC<ProtectedPageProps> = ({ children }) => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname() ?? "";

    const unprotectedPaths = ['/auth/login', '/auth/register', '/'];

    useEffect(() => {

        // 如果是未保护的路径，直接跳过
        if (unprotectedPaths.includes(pathname)) {
            return;
        }

        if (status === "unauthenticated") {
            router.push("/auth/login");
        }
    }, [status, pathname, router]);

    if (unprotectedPaths.includes(pathname)) {
        return <>{children}</>;
    }

    if (status === "loading") {
        return <div>Loading...</div>;
    }

    if (status === "unauthenticated") {
        return <div>Please log in to access this page.</div>;
    }

    if (!session) {
        router.push("/auth/login");
        return null; // 不渲染任何内容
    }

    return (
        <div>
            {children}
        </div>
    );
};

export default ProtectedPage;
