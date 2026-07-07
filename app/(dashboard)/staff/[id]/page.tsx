import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PageProps = { params: Promise<{ id: string }> };

export default async function StaffDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff profile</CardTitle>
        <CardDescription>Staff ID {id}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">Credentials, department assignment, shifts, and access permissions.</CardContent>
    </Card>
  );
}
