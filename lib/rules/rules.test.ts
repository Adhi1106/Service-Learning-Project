import { describe, expect, it } from "vitest";
import { addDays } from "../dates";
import { checkAttendance, checkStock, findRepeatedIllnesses, type DayRecord } from "./rules";

const TODAY = "2026-11-15";
const ASTHMA = 1;
const FEVER = 2;

const absent = (daysAgo: number, illnessId: number | null = null): DayRecord => ({
  date: addDays(TODAY, -daysAgo),
  status: "absent",
  illnessId,
});
const present = (daysAgo: number): DayRecord => ({ date: addDays(TODAY, -daysAgo), status: "present", illnessId: null });

describe("Rule 1: repeated medical absence", () => {
  it("does not fire for 2 absences with the same illness", () => {
    expect(findRepeatedIllnesses([absent(1, ASTHMA), absent(5, ASTHMA)], TODAY)).toEqual([]);
  });

  it("fires at exactly 3 absences with the same illness", () => {
    const hits = findRepeatedIllnesses([absent(0, ASTHMA), absent(5, ASTHMA), absent(9, ASTHMA)], TODAY);
    expect(hits).toEqual([{ illnessId: ASTHMA, count: 3, latestDate: TODAY }]);
  });

  it("does not add up different illnesses", () => {
    const hits = findRepeatedIllnesses([absent(0, ASTHMA), absent(5, FEVER), absent(9, ASTHMA), absent(12, FEVER)], TODAY);
    expect(hits).toEqual([]);
  });

  it("ignores absences that are not medical", () => {
    expect(findRepeatedIllnesses([absent(0), absent(1), absent(2)], TODAY)).toEqual([]);
  });

  it("counts an absence 29 days ago (inside the window)", () => {
    expect(findRepeatedIllnesses([absent(0, ASTHMA), absent(10, ASTHMA), absent(29, ASTHMA)], TODAY)).toHaveLength(1);
  });

  it("does not count an absence 30 days ago (outside the window)", () => {
    expect(findRepeatedIllnesses([absent(0, ASTHMA), absent(10, ASTHMA), absent(30, ASTHMA)], TODAY)).toEqual([]);
  });

  it("ignores dates in the future", () => {
    expect(findRepeatedIllnesses([absent(0, ASTHMA), absent(3, ASTHMA), absent(-2, ASTHMA)], TODAY)).toEqual([]);
  });
});

describe("Rule 2: low attendance", () => {
  /** `total` recorded days ending today, with absences on the given days-ago. */
  const days = (total: number, absentDaysAgo: number[]): DayRecord[] =>
    Array.from({ length: total }, (_, i) => (absentDaysAgo.includes(i) ? absent(i) : present(i)));

  it("does not fire at exactly 85%", () => {
    const check = checkAttendance(days(20, [3, 8, 13]), TODAY); // 17 of 20
    expect(check.pct).toBe(85);
    expect(check.fires).toBe(false);
  });

  it("fires just below 85%", () => {
    const check = checkAttendance(days(20, [3, 8, 13, 18]), TODAY); // 16 of 20
    expect(check.pct).toBe(80);
    expect(check.belowPct).toBe(true);
    expect(check.fires).toBe(true);
  });

  it("does not use the percentage with fewer than 10 recorded days", () => {
    const check = checkAttendance(days(5, [1, 3]), TODAY); // 60%, but only 5 days
    expect(check.pct).toBe(60);
    expect(check.fires).toBe(false);
  });

  it("fires for 3 absences in a row, even with few days recorded", () => {
    const check = checkAttendance(days(5, [0, 1, 2]), TODAY);
    expect(check.consecutiveAbsences).toBe(3);
    expect(check.absentInARow).toBe(true);
    expect(check.fires).toBe(true);
  });

  it("does not fire for 2 absences in a row", () => {
    const check = checkAttendance(days(20, [0, 1]), TODAY);
    expect(check.consecutiveAbsences).toBe(2);
    expect(check.fires).toBe(false);
  });

  it("stops counting the run at the first day present", () => {
    const check = checkAttendance(days(20, [0, 1, 3, 4]), TODAY);
    expect(check.consecutiveAbsences).toBe(2);
  });

  it("treats days with no record (Sundays) as neither present nor absent", () => {
    const records = [absent(0), absent(2), absent(3), present(4)]; // nothing recorded 1 day ago
    expect(checkAttendance(records, TODAY).consecutiveAbsences).toBe(3);
  });

  it("ignores records older than the window", () => {
    const records = [...days(20, []), absent(30), absent(31), absent(32), absent(33), absent(34)];
    const check = checkAttendance(records, TODAY);
    expect(check.daysRecorded).toBe(20);
    expect(check.pct).toBe(100);
  });

  it("handles a child with no records", () => {
    const check = checkAttendance([], TODAY);
    expect(check.pct).toBeNull();
    expect(check.fires).toBe(false);
  });
});

describe("Rule 3: low stock and expiring stock", () => {
  it("is not low when the balance equals the minimum", () => {
    expect(checkStock({ balance: 20, minLevel: 20, expiryDate: null }, TODAY).low).toBe(false);
  });

  it("is low just below the minimum", () => {
    expect(checkStock({ balance: 19.5, minLevel: 20, expiryDate: null }, TODAY).low).toBe(true);
  });

  it("is low at zero", () => {
    expect(checkStock({ balance: 0, minLevel: 5, expiryDate: null }, TODAY).low).toBe(true);
  });

  it("flags stock expiring in exactly 30 days", () => {
    const check = checkStock({ balance: 5, minLevel: 1, expiryDate: addDays(TODAY, 30) }, TODAY);
    expect(check.daysToExpiry).toBe(30);
    expect(check.expiring).toBe(true);
  });

  it("does not flag stock expiring in 31 days", () => {
    expect(checkStock({ balance: 5, minLevel: 1, expiryDate: addDays(TODAY, 31) }, TODAY).expiring).toBe(false);
  });

  it("flags stock that has already expired", () => {
    const check = checkStock({ balance: 5, minLevel: 1, expiryDate: addDays(TODAY, -3) }, TODAY);
    expect(check.daysToExpiry).toBe(-3);
    expect(check.expiring).toBe(true);
  });

  it("does not flag expiry when nothing is left", () => {
    expect(checkStock({ balance: 0, minLevel: 1, expiryDate: addDays(TODAY, 5) }, TODAY).expiring).toBe(false);
  });

  it("does not flag items with no expiry date", () => {
    const check = checkStock({ balance: 50, minLevel: 10, expiryDate: null }, TODAY);
    expect(check).toEqual({ low: false, expiring: false, daysToExpiry: null });
  });
});
