import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
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

export default function CertificateTable({
    certificates,
    onRevoke,
}: CertificateTableProps) {
    const [selected, setSelected] = useState<CertificateRow | null>(null);
    const [loading, setLoading] = useState(false);

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
        if (!selected) return;
        try {
            setLoading(true);
            await onRevoke(selected.token_id);
        } finally {
            setLoading(false);
            setSelected(null);
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
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sorted.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className="text-center text-muted-foreground"
                                >
                                    No certificates found.
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
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={certificate.revoked}
                                            onClick={() =>
                                                setSelected(certificate)
                                            }
                                        >
                                            Revoke
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <ConfirmDialog
                open={!!selected}
                title="Revoke certificate"
                description="This action will revoke the certificate on blockchain and mark it revoked in database."
                confirmLabel="Revoke"
                loading={loading}
                onCancel={() => setSelected(null)}
                onConfirm={handleConfirmRevoke}
            />
        </>
    );
}
