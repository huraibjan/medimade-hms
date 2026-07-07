import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RoomCard({ room, status }: { room: string; status: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{room}</CardTitle>
      </CardHeader>
      <CardContent>
        <Badge>{status}</Badge>
      </CardContent>
    </Card>
  );
}
