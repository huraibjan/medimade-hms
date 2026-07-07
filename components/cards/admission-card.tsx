import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AdmissionCard({ patient, status }: { patient: string; status: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{patient}</CardTitle>
      </CardHeader>
      <CardContent>
        <Badge variant="warning">{status}</Badge>
      </CardContent>
    </Card>
  );
}
