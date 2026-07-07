"use client";

import { format } from "date-fns";
import { Eye, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { useMemo, useState, useTransition } from "react";
import { softDeletePatientAction } from "@/lib/actions/patient-actions";
import type { PatientRecord } from "@/lib/services/patient-service";
import { toast } from "@/lib/toast";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/modals/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const allValue = "all";

function isString(value: string | null | undefined): value is string {
  return Boolean(value);
}

function patientName(patient: PatientRecord) {
  return `${patient.first_name} ${patient.last_name}`;
}

function statusVariant(status: string | undefined) {
  if (status === "admitted") return "warning";
  if (status === "inactive") return "danger";
  return "success";
}

export function PatientsTable({
  data,
  hospitalId
}: {
  data: PatientRecord[];
  hospitalId: string;
}) {
  const [query, setQuery] = useState("");
  const [gender, setGender] = useState(allValue);
  const [bloodGroup, setBloodGroup] = useState(allValue);
  const [city, setCity] = useState(allValue);
  const [status, setStatus] = useState(allValue);
  const [isPending, startTransition] = useTransition();

  const filterOptions = useMemo(
    () => ({
      genders: Array.from(new Set(data.map((patient) => patient.gender).filter(Boolean))).sort(),
      bloodGroups: Array.from(new Set(data.map((patient) => patient.blood_group).filter(isString))).sort(),
      cities: Array.from(new Set(data.map((patient) => patient.city).filter(isString))).sort()
    }),
    [data]
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return data.filter((patient) => {
      const searchable = [
        patient.mrn,
        patientName(patient),
        patient.phone,
        patient.email
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return (
        (!normalizedQuery || searchable.includes(normalizedQuery)) &&
        (gender === allValue || patient.gender === gender) &&
        (bloodGroup === allValue || patient.blood_group === bloodGroup) &&
        (city === allValue || patient.city === city) &&
        (status === allValue || patient.computed_status === status)
      );
    });
  }, [bloodGroup, city, data, gender, query, status]);

  function archivePatient(patient: PatientRecord) {
    startTransition(async () => {
      const result = await softDeletePatientAction(patient.id, hospitalId);
      if (result.ok) toast.success("Patient archived", result.message);
      else toast.error("Archive failed", result.message);
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(16rem,1fr)_repeat(4,minmax(9rem,12rem))]">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search MRN, name, phone, email..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <FilterSelect label="Gender" value={gender} values={filterOptions.genders} onValueChange={setGender} />
        <FilterSelect label="Blood group" value={bloodGroup} values={filterOptions.bloodGroups} onValueChange={setBloodGroup} />
        <FilterSelect label="City" value={city} values={filterOptions.cities} onValueChange={setCity} />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={allValue}>All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="admitted">Admitted</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>MRN</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Blood</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length ? (
              filtered.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">{patient.mrn}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{patientName(patient)}</p>
                      <p className="text-xs text-muted-foreground">{patient.email ?? "No email"}</p>
                    </div>
                  </TableCell>
                  <TableCell>{patient.phone ?? "Not recorded"}</TableCell>
                  <TableCell className="capitalize">{patient.gender}</TableCell>
                  <TableCell>{patient.blood_group ?? "Unknown"}</TableCell>
                  <TableCell>{patient.city ?? "Not recorded"}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(patient.computed_status)}>{patient.computed_status}</Badge>
                  </TableCell>
                  <TableCell>{format(new Date(patient.created_at), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="outline" size="icon" aria-label={`View ${patientName(patient)}`}>
                        <Link href={`/patients/${patient.id}` as Route}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <ConfirmDialog
                        title={`Archive ${patientName(patient)}?`}
                        description="This patient will be hidden from active registries. The audit history and related clinical records are preserved."
                        confirmLabel="Archive"
                        destructive
                        disabled={isPending}
                        onConfirm={() => archivePatient(patient)}
                        trigger={
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label={`Archive ${patientName(patient)}`}
                            disabled={isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="p-6">
                  <EmptyState title="No patients found" description="Adjust the search or filters, or register a new patient." />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  values,
  onValueChange
}: {
  label: string;
  value: string;
  values: string[];
  onValueChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={allValue}>All {label.toLowerCase()}</SelectItem>
        {values.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
