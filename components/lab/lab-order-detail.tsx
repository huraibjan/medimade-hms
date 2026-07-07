import { format } from "date-fns";
import { updateLabOrderStatusAction } from "@/lib/actions/lab-actions";
import type { LabOrderRecord, LabTechnicianSummary } from "@/lib/services/lab";
import type { LabOrderStatus } from "@/types/database";
import { LabResultForm } from "@/components/forms/lab-result-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const nextStatuses: LabOrderStatus[] = ["sample_collected", "processing", "completed", "cancelled"];

export function LabOrderDetail({
  order,
  hospitalId,
  actorProfileId,
  technicians
}: {
  order: LabOrderRecord;
  hospitalId: string;
  actorProfileId?: string | null;
  technicians: LabTechnicianSummary[];
}) {
  async function updateStatus(formData: FormData) {
    "use server";
    const status = formData.get("status") as LabOrderStatus;
    await updateLabOrderStatusAction(order.id, hospitalId, { status }, actorProfileId);
  }

  const patientName = order.patients ? `${order.patients.first_name} ${order.patients.last_name}` : order.patient_id;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle>Order {order.id.slice(0, 8)}</CardTitle>
              <CardDescription>{patientName} / {order.patients?.mrn ?? "No MRN"} / ordered {format(new Date(order.ordered_at), "MMM d, yyyy h:mm a")}</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={order.status === "completed" ? "success" : "secondary"}>{order.status}</Badge>
              <Badge variant={order.priority === "stat" ? "danger" : order.priority === "urgent" ? "warning" : "outline"}>{order.priority}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm md:grid-cols-3">
          <Info label="Ordering doctor" value={order.doctors?.staff?.profiles?.full_name ?? "-"} />
          <Info label="Encounter" value={order.encounter_id ?? "Not linked"} />
          <Info label="Completed" value={order.completed_at ? format(new Date(order.completed_at), "MMM d, yyyy h:mm a") : "-"} />
          <div className="md:col-span-3">
            <p className="text-muted-foreground">Notes</p>
            <p className="font-medium">{order.notes ?? "-"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workflow</CardTitle>
          <CardDescription>Move the lab order through specimen collection, processing, completion, or cancellation.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateStatus} className="flex flex-wrap gap-2">
            {nextStatuses.map((status) => (
              <Button key={status} variant={status === "cancelled" ? "outline" : "default"} size="sm" name="status" value={status} disabled={order.status === status}>
                {status.replace("_", " ")}
              </Button>
            ))}
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {(order.lab_order_items ?? []).map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>{item.lab_tests?.test_name ?? item.lab_test_id}</CardTitle>
                  <CardDescription>{item.lab_tests?.test_code} / {item.lab_tests?.sample_type ?? "Sample not specified"}</CardDescription>
                </div>
                <Badge variant={item.result_status === "critical" ? "danger" : item.result_status === "abnormal" ? "warning" : item.result_status === "normal" ? "success" : "secondary"}>{item.result_status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <LabResultForm hospitalId={hospitalId} orderId={order.id} item={item} technicians={technicians} actorProfileId={actorProfileId} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
