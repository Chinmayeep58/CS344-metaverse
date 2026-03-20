import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

interface DashboardCardProps {
    title: string;
    value: string | number;
    description?: string;
}

export default function DashboardCard({
    title,
    value,
    description,
}: DashboardCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardDescription>{title}</CardDescription>
                <CardTitle className="text-2xl">{value}</CardTitle>
            </CardHeader>
            {description ? (
                <CardContent className="pt-0 text-xs text-muted-foreground">
                    {description}
                </CardContent>
            ) : null}
        </Card>
    );
}
