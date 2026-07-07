import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PatientCard({ name, mrn }: { name: string; mrn: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{mrn}</CardContent>
    </Card>
  );
}
