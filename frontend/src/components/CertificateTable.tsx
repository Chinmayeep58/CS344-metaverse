import { useMemo, useState } from "react";
import { Download, ExternalLink, Eye } from "lucide-react";
import { saveAs } from "file-saver";
import type { CertificateRow } from "@/types/certificate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface CertificateTableProps {
    certificates: CertificateRow[];
    onRevoke: (certificateId: number) => Promise<void>;
}

const escapeHtml = (value: string): string =>
    value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

export default function CertificateTable({
    certificates,
    onRevoke,
}: CertificateTableProps) {
    const [selectedForRevoke, setSelectedForRevoke] =
        useState<CertificateRow | null>(null);
    const [selectedForPreview, setSelectedForPreview] =
        useState<CertificateRow | null>(null);
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const createSampleCertificate = (): CertificateRow => ({
        id: -1,
        student_id: -1,
        token_id: 31001,
        tx_hash: "",
        ipfs_hash: "QmSampleCertificateMetadataHash",
        issued_by: 1,
        revoked: false,
        issued_at: new Date().toISOString(),
        studentName: "Aarav Sharma",
        studentEmail: "aarav.sharma@example.com",
        examScore: 94,
    });

    const sorted = useMemo(
        () =>
            [...certificates].sort(
                (a, b) =>
                    new Date(b.issued_at).getTime() -
                    new Date(a.issued_at).getTime(),
            ),
        [certificates],
    );

    const handleConfirmRevoke = async () => {
        if (!selectedForRevoke) return;
        try {
            setLoading(true);
            await onRevoke(selectedForRevoke.token_id);
        } finally {
            setLoading(false);
            setSelectedForRevoke(null);
        }
    };

    const handleDownloadCertificate = async () => {
        if (!selectedForPreview) return;

        try {
            setDownloading(true);
            const issueDate = new Date(
                selectedForPreview.issued_at,
            ).toLocaleString();
            const scoreText = String(selectedForPreview.examScore);

            const width = 1600;
            const height = 1120;
            const svg = `
                <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
                    <rect width="100%" height="100%" fill="#f8fafc" />
                    <rect x="40" y="40" width="1520" height="1040" rx="24" ry="24" fill="#ffffff" stroke="#fcd34d" stroke-width="12" />
                    <rect x="90" y="90" width="1420" height="940" rx="14" ry="14" fill="#ffffff" stroke="#f59e0b" stroke-width="5" />

                    <text x="800" y="160" text-anchor="middle" fill="#b45309" font-family="Georgia, 'Times New Roman', serif" font-size="22" font-weight="700" letter-spacing="5">
                        EMERGENCY PREPAREDNESS PROGRAM
                    </text>
                    <text x="800" y="245" text-anchor="middle" fill="#1f2937" font-family="Georgia, 'Times New Roman', serif" font-size="70" font-weight="800">
                        Certificate of Completion
                    </text>

                    <text x="800" y="320" text-anchor="middle" fill="#334155" font-family="Georgia, 'Times New Roman', serif" font-size="32">
                        This certificate confirms that
                    </text>
                    <text x="800" y="405" text-anchor="middle" fill="#0f172a" font-family="Georgia, 'Times New Roman', serif" font-size="78" font-weight="800">
                        ${escapeHtml(selectedForPreview.studentName)}
                    </text>

                    <text x="800" y="470" text-anchor="middle" fill="#334155" font-family="Georgia, 'Times New Roman', serif" font-size="30">
                        has successfully completed the Earthquake Training Simulation
                    </text>
                    <text x="800" y="515" text-anchor="middle" fill="#334155" font-family="Georgia, 'Times New Roman', serif" font-size="30">
                        and demonstrated readiness with a score of
                    </text>
                    <rect x="730" y="540" width="140" height="54" rx="8" ry="8" fill="#dcfce7" />
                    <text x="800" y="577" text-anchor="middle" fill="#166534" font-family="Georgia, 'Times New Roman', serif" font-size="34" font-weight="700">
                        ${escapeHtml(scoreText)}
                    </text>
                    <text x="800" y="630" text-anchor="middle" fill="#334155" font-family="Georgia, 'Times New Roman', serif" font-size="30">
                        in scenario-based emergency response.
                    </text>

                    <rect x="180" y="680" width="1240" height="220" rx="12" ry="12" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2" />
                    <text x="230" y="740" fill="#475569" font-family="Georgia, 'Times New Roman', serif" font-size="28" font-weight="700">Simulation ID</text>
                    <text x="1320" y="740" text-anchor="end" fill="#0f172a" font-family="Georgia, 'Times New Roman', serif" font-size="28">EQ-${selectedForPreview.token_id}</text>

                    <text x="230" y="800" fill="#475569" font-family="Georgia, 'Times New Roman', serif" font-size="28" font-weight="700">Student Email</text>
                    <text x="1320" y="800" text-anchor="end" fill="#0f172a" font-family="Georgia, 'Times New Roman', serif" font-size="28">${escapeHtml(selectedForPreview.studentEmail)}</text>

                    <text x="230" y="860" fill="#475569" font-family="Georgia, 'Times New Roman', serif" font-size="28" font-weight="700">Issue Date</text>
                    <text x="1320" y="860" text-anchor="end" fill="#0f172a" font-family="Georgia, 'Times New Roman', serif" font-size="28">${escapeHtml(issueDate)}</text>

                    <text x="180" y="975" fill="#0f172a" font-family="Georgia, 'Times New Roman', serif" font-size="36" font-weight="700">Earthquake Response Training Division</text>
                    <text x="1420" y="975" text-anchor="end" fill="#0f172a" font-family="Georgia, 'Times New Roman', serif" font-size="36" font-weight="800">EQRT-${String(selectedForPreview.token_id).padStart(5, "0")}</text>
                </svg>
            `;

            const svgBlob = new Blob([svg], {
                type: "image/svg+xml;charset=utf-8",
            });
            const svgUrl = URL.createObjectURL(svgBlob);

            const image = await new Promise<HTMLImageElement>((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error("Failed to render SVG for export"));
                img.src = svgUrl;
            });

            URL.revokeObjectURL(svgUrl);

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            const context = canvas.getContext("2d");
            if (!context) {
                throw new Error("Failed to create canvas context");
            }

            context.fillStyle = "#ffffff";
            context.fillRect(0, 0, width, height);
            context.drawImage(image, 0, 0, width, height);

            const blob = await new Promise<Blob | null>((resolve) => {
                canvas.toBlob((file) => resolve(file), "image/png");
            });

            if (!blob) {
                throw new Error("Failed to create image file");
            }

            const fileName = `certificate-${selectedForPreview.token_id}.png`;

            try {
                saveAs(blob, fileName);
            } catch {
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error("Certificate download failed:", error);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <>
            <div className="overflow-x-auto rounded-xl border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Token ID</TableHead>
                            <TableHead>Student Name</TableHead>
                            <TableHead>Exam Score</TableHead>
                            <TableHead>IPFS Hash</TableHead>
                            <TableHead>Issued Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sorted.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className="text-center text-muted-foreground"
                                >
                                    <div className="flex flex-col items-center gap-3 py-2">
                                        <span>No certificates found.</span>
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() =>
                                                setSelectedForPreview(
                                                    createSampleCertificate(),
                                                )
                                            }
                                        >
                                            <Eye className="mr-1 h-4 w-4" />
                                            View Sample Certificate
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            sorted.map((certificate) => (
                                <TableRow key={certificate.id}>
                                    <TableCell>
                                        {certificate.token_id}
                                    </TableCell>
                                    <TableCell>
                                        {certificate.studentName}
                                    </TableCell>
                                    <TableCell>
                                        {certificate.examScore}
                                    </TableCell>
                                    <TableCell>
                                        <a
                                            href={`https://gateway.pinata.cloud/ipfs/${certificate.ipfs_hash}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-primary hover:underline"
                                        >
                                            {certificate.ipfs_hash.slice(0, 10)}
                                            ...
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </a>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(
                                            certificate.issued_at,
                                        ).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                certificate.revoked
                                                    ? "destructive"
                                                    : "secondary"
                                            }
                                        >
                                            {certificate.revoked
                                                ? "Revoked"
                                                : "Active"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() =>
                                                    setSelectedForPreview(
                                                        certificate,
                                                    )
                                                }
                                            >
                                                <Eye className="mr-1 h-4 w-4" />
                                                View
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={certificate.revoked}
                                                onClick={() =>
                                                    setSelectedForRevoke(
                                                        certificate,
                                                    )
                                                }
                                            >
                                                Revoke
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <ConfirmDialog
                open={!!selectedForRevoke}
                title="Revoke certificate"
                description="This action will revoke the certificate on blockchain and mark it revoked in database."
                confirmLabel="Revoke"
                loading={loading}
                onCancel={() => setSelectedForRevoke(null)}
                onConfirm={handleConfirmRevoke}
            />

            {selectedForPreview ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="max-h-[95vh] w-full max-w-5xl overflow-auto rounded-xl border bg-card p-4 shadow-lg">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold">
                                Certificate Preview
                            </h3>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={handleDownloadCertificate}
                                    disabled={downloading}
                                >
                                    <Download className="mr-1 h-4 w-4" />
                                    {downloading
                                        ? "Preparing..."
                                        : "Download PNG"}
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => setSelectedForPreview(null)}
                                >
                                    Close
                                </Button>
                            </div>
                        </div>

                        <div className="overflow-auto rounded-lg bg-muted p-4">
                            <div className="mx-auto w-full max-w-4xl rounded-2xl border-[10px] border-amber-300 bg-white p-8 text-slate-900 shadow-2xl">
                                <div className="rounded-xl border-4 border-amber-500 p-8">
                                    <p className="text-center text-sm font-semibold uppercase tracking-[0.35em] text-amber-700">
                                        Emergency Preparedness Program
                                    </p>
                                    <h1 className="mt-4 text-center text-4xl font-extrabold tracking-wide text-slate-800">
                                        Certificate of Completion
                                    </h1>
                                    <p className="mt-6 text-center text-base text-slate-700">
                                        This certificate confirms that
                                    </p>
                                    <p className="mt-2 text-center text-4xl font-bold text-slate-900">
                                        {selectedForPreview.studentName}
                                    </p>
                                    <p className="mt-6 text-center text-base leading-relaxed text-slate-700">
                                        has successfully completed the
                                        Earthquake Training Simulation and
                                        demonstrated readiness with a score of
                                        <span className="mx-2 rounded-md bg-emerald-100 px-2 py-1 font-bold text-emerald-800">
                                            {selectedForPreview.examScore}
                                        </span>
                                        in scenario-based emergency response.
                                    </p>

                                    <div className="mt-8 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                                        <div className="flex justify-between">
                                            <span className="font-semibold text-slate-600">
                                                Simulation ID
                                            </span>
                                            <span>
                                                EQ-{selectedForPreview.token_id}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold text-slate-600">
                                                Student Email
                                            </span>
                                            <span>
                                                {selectedForPreview.studentEmail}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold text-slate-600">
                                                Issue Date
                                            </span>
                                            <span>
                                                {new Date(
                                                    selectedForPreview.issued_at,
                                                ).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-10 flex items-end justify-between">
                                        <p className="text-lg font-semibold">
                                            Earthquake Response Training Division
                                        </p>
                                        <div className="text-right">
                                            <p className="text-lg font-bold tracking-wide">
                                                EQRT-
                                                {String(
                                                    selectedForPreview.token_id,
                                                ).padStart(5, "0")}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}
