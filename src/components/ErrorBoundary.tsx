import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
                    <div className="mb-4 rounded-full bg-destructive/10 p-4">
                        <AlertTriangle className="h-12 w-12 text-destructive" />
                    </div>
                    <h1 className="mb-2 text-2xl font-bold text-foreground">
                        Terjadi Kesalahan
                    </h1>
                    <p className="mb-6 max-w-md text-muted-foreground">
                        {this.state.error?.message || "Maaf, terjadi kesalahan yang tidak terduga dalam aplikasi."}
                    </p>
                    <Button
                        onClick={() => window.location.reload()}
                        className="gap-2 rounded-xl gradient-primary text-primary-foreground"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Muat Ulang Halaman
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
