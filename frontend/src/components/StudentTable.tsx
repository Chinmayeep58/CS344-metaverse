import type { Student } from "@/types/student";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function StudentTable({ students }: { students: Student[] }) {
    return (
        <div className="overflow-x-auto rounded-xl border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Student ID</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Exam Score</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {students.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={4}
                                className="text-center text-muted-foreground"
                            >
                                No students found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        students.map((student) => (
                            <TableRow key={student.id}>
                                <TableCell>{student.id}</TableCell>
                                <TableCell>{student.full_name}</TableCell>
                                <TableCell>{student.email || "-"}</TableCell>
                                <TableCell>
                                    {student.exam_score === undefined
                                        ? "Pending"
                                        : student.exam_score}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
