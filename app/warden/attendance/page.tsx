import { AttendanceForm } from "@/components/warden/AttendanceForm";
import { requireRole } from "@/lib/auth";
import { todayStr } from "@/lib/dates";
import { attendanceForClass, getLookups } from "@/lib/queries";

export default async function AttendancePage({ searchParams }: { searchParams: Promise<{ class?: string }> }) {
  await requireRole("warden");
  const { classes, reasons, illnesses } = getLookups();
  const asked = (await searchParams).class;
  const initialClass = asked && classes.includes(asked) ? asked : classes[0];

  const today = todayStr();

  return (
    <AttendanceForm
      classes={classes}
      reasons={reasons}
      illnesses={illnesses}
      today={today}
      initialClass={initialClass}
      initialRows={attendanceForClass(initialClass, today)}
    />
  );
}
