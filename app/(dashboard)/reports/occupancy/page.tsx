import { Bed, DoorOpen, Percent } from "lucide-react";
import { OccupancyChart } from "@/components/charts/occupancy-chart";
import { StatCard } from "@/components/cards/stat-card";
import { DateRangePicker } from "@/components/filters/date-range-picker";
import { PageTitle } from "@/components/layout/page-title";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCurrentProfile } from "@/lib/services/auth-service";
import { getReportsAnalytics } from "@/lib/services/reports";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";

export default async function OccupancyReportPage() {
  const profile = await getCurrentProfile();
  const analytics = await getReportsAnalytics(profile?.hospital_id ?? DEFAULT_HOSPITAL_ID);
  const stats = analytics.stats;

  return (
    <div className="space-y-6">
      <PageTitle title="Occupancy report" description="Ward, room, and bed utilization from room_occupancy_view." actions={<DateRangePicker />} />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={Bed} title="Occupied beds" value={stats.occupiedBeds} detail="Currently allocated" tone="warning" />
        <StatCard icon={DoorOpen} title="Available beds" value={stats.availableBeds} detail="Ready for admission" tone="success" />
        <StatCard icon={Percent} title="Occupancy" value={`${stats.occupancyPercentage}%`} detail="Occupied / active beds" tone="primary" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Bed occupancy by ward</CardTitle>
          <CardDescription>Occupied and available beds grouped by ward.</CardDescription>
        </CardHeader>
        <CardContent>
          <OccupancyChart data={analytics.charts.bedOccupancyByWard} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Ward occupancy table</CardTitle>
          <CardDescription>Occupancy percentage and available capacity by ward.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ward</TableHead>
                <TableHead className="text-right">Occupied</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="text-right">Occupancy</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.charts.bedOccupancyByWard.map((row) => (
                <TableRow key={row.name}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-right">{row.occupied}</TableCell>
                  <TableCell className="text-right">{row.available}</TableCell>
                  <TableCell className="text-right">{row.occupancy}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
