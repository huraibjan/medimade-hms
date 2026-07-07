import { PatientForm } from "@/components/forms/patient-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewPatientPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>New patient</CardTitle>
        <CardDescription>Register demographics, contact details, emergency contacts, and insurance-ready data.</CardDescription>
      </CardHeader>
      <CardContent>
        <PatientForm />
      </CardContent>
    </Card>
  );
}
