import { hasSupabaseEnv } from "@/lib/supabase/env";
import { asQueryClient } from "@/lib/supabase/query-client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";
import { bedSchema, roomSchema, wardSchema, type BedInput, type RoomInput, type WardInput } from "@/lib/validations/facilities";
import { writeAuditLog } from "./service-context";

export type { BedStatus, RoomStatus, RoomType } from "@/types/database";
import type { BedStatus, RoomStatus, RoomType } from "@/types/database";

export type WardRecord = {
  id: string;
  hospital_id: string;
  name: string;
  floor?: string | null;
  department?: string | null;
  created_at?: string;
  rooms?: RoomRecord[];
  total_beds?: number;
  occupied_beds?: number;
  available_beds?: number;
};

export type RoomRecord = {
  id: string;
  hospital_id: string;
  ward_id: string;
  room_number: string;
  room_type: RoomType;
  status: RoomStatus;
  daily_rate?: number;
  created_at?: string;
  wards?: Pick<WardRecord, "id" | "name" | "floor"> | null;
  beds?: BedRecord[];
  total_beds?: number;
  occupied_beds?: number;
  available_beds?: number;
};

export type BedRecord = {
  id: string;
  hospital_id: string;
  room_id: string;
  bed_number: string;
  status: BedStatus;
  current_patient_id?: string | null;
  created_at?: string;
  rooms?: Pick<RoomRecord, "id" | "room_number" | "room_type" | "ward_id"> & {
    wards?: Pick<WardRecord, "id" | "name" | "floor"> | null;
  };
};

const mockWards: WardRecord[] = [
  { id: "ward-icu", hospital_id: DEFAULT_HOSPITAL_ID, name: "ICU East", floor: "3", department: "Emergency" },
  { id: "ward-med", hospital_id: DEFAULT_HOSPITAL_ID, name: "Medical Ward A", floor: "4", department: "General Medicine" },
  { id: "ward-mat", hospital_id: DEFAULT_HOSPITAL_ID, name: "Maternity", floor: "5", department: "Pediatrics" }
];

const mockRooms: RoomRecord[] = [
  { id: "room-icu-301", hospital_id: DEFAULT_HOSPITAL_ID, ward_id: "ward-icu", room_number: "ICU-301", room_type: "icu", status: "occupied", daily_rate: 2200 },
  { id: "room-icu-302", hospital_id: DEFAULT_HOSPITAL_ID, ward_id: "ward-icu", room_number: "ICU-302", room_type: "icu", status: "available", daily_rate: 2200 },
  { id: "room-er-201", hospital_id: DEFAULT_HOSPITAL_ID, ward_id: "ward-icu", room_number: "ER-201", room_type: "emergency", status: "reserved", daily_rate: 1100 },
  { id: "room-med-401", hospital_id: DEFAULT_HOSPITAL_ID, ward_id: "ward-med", room_number: "GEN-401", room_type: "general", status: "available", daily_rate: 650 },
  { id: "room-med-402", hospital_id: DEFAULT_HOSPITAL_ID, ward_id: "ward-med", room_number: "PRI-402", room_type: "private", status: "occupied", daily_rate: 950 },
  { id: "room-mat-501", hospital_id: DEFAULT_HOSPITAL_ID, ward_id: "ward-mat", room_number: "MAT-501", room_type: "private", status: "maintenance", daily_rate: 850 }
];

const mockBeds: BedRecord[] = [
  { id: "bed-icu-301-a", hospital_id: DEFAULT_HOSPITAL_ID, room_id: "room-icu-301", bed_number: "A", status: "occupied", current_patient_id: "p-1001" },
  { id: "bed-icu-301-b", hospital_id: DEFAULT_HOSPITAL_ID, room_id: "room-icu-301", bed_number: "B", status: "available" },
  { id: "bed-icu-302-a", hospital_id: DEFAULT_HOSPITAL_ID, room_id: "room-icu-302", bed_number: "A", status: "available" },
  { id: "bed-er-201-a", hospital_id: DEFAULT_HOSPITAL_ID, room_id: "room-er-201", bed_number: "A", status: "reserved" },
  { id: "bed-med-401-a", hospital_id: DEFAULT_HOSPITAL_ID, room_id: "room-med-401", bed_number: "A", status: "available" },
  { id: "bed-med-401-b", hospital_id: DEFAULT_HOSPITAL_ID, room_id: "room-med-401", bed_number: "B", status: "available" },
  { id: "bed-med-402-a", hospital_id: DEFAULT_HOSPITAL_ID, room_id: "room-med-402", bed_number: "A", status: "occupied", current_patient_id: "p-1002" },
  { id: "bed-mat-501-a", hospital_id: DEFAULT_HOSPITAL_ID, room_id: "room-mat-501", bed_number: "A", status: "maintenance" }
];

function hydrateBeds(beds: BedRecord[], rooms = mockRooms, wards = mockWards) {
  return beds.map((bed) => {
    const room = rooms.find((item) => item.id === bed.room_id);
    const ward = room ? wards.find((item) => item.id === room.ward_id) : undefined;
    return {
      ...bed,
      rooms: room
        ? {
            id: room.id,
            room_number: room.room_number,
            room_type: room.room_type,
            ward_id: room.ward_id,
            wards: ward ? { id: ward.id, name: ward.name, floor: ward.floor } : null
          }
        : undefined
    };
  });
}

function attachOccupancyToRoom(room: RoomRecord, beds: BedRecord[]) {
  const roomBeds = beds.filter((bed) => bed.room_id === room.id);
  const occupied = roomBeds.filter((bed) => bed.status === "occupied").length;
  const available = roomBeds.filter((bed) => bed.status === "available").length;
  return {
    ...room,
    beds: hydrateBeds(roomBeds),
    wards: mockWards.find((ward) => ward.id === room.ward_id) ?? null,
    total_beds: roomBeds.length,
    occupied_beds: occupied,
    available_beds: available
  };
}

function attachOccupancyToWard(ward: WardRecord, rooms: RoomRecord[], beds: BedRecord[]) {
  const wardRooms = rooms.filter((room) => room.ward_id === ward.id);
  const roomIds = new Set(wardRooms.map((room) => room.id));
  const wardBeds = beds.filter((bed) => roomIds.has(bed.room_id));
  return {
    ...ward,
    rooms: wardRooms.map((room) => attachOccupancyToRoom(room, beds)),
    total_beds: wardBeds.length,
    occupied_beds: wardBeds.filter((bed) => bed.status === "occupied").length,
    available_beds: wardBeds.filter((bed) => bed.status === "available").length
  };
}

export async function listWards(hospitalId?: string | null): Promise<WardRecord[]> {
  if (!hasSupabaseEnv() || !hospitalId) return mockWards.map((ward) => attachOccupancyToWard(ward, mockRooms, mockBeds));

  const supabase = asQueryClient(await createServerSupabaseClient());
  const { data, error } = await supabase
    .from<WardRecord & { rooms?: Array<RoomRecord & { beds?: BedRecord[] }> }>("wards")
    .select("*, rooms(*, beds(*))")
    .eq("hospital_id", hospitalId)
    .order("name");
  if (error) throw error;
  return (data ?? []).map((ward) => {
    const rooms = (ward.rooms ?? []).map((room) => {
      const beds = room.beds ?? [];
      return {
        ...room,
        total_beds: beds.length,
        occupied_beds: beds.filter((bed) => bed.status === "occupied").length,
        available_beds: beds.filter((bed) => bed.status === "available").length
      };
    });
    return {
      ...ward,
      rooms,
      total_beds: rooms.reduce((total, room) => total + (room.total_beds ?? 0), 0),
      occupied_beds: rooms.reduce((total, room) => total + (room.occupied_beds ?? 0), 0),
      available_beds: rooms.reduce((total, room) => total + (room.available_beds ?? 0), 0)
    };
  });
}

export async function listRooms(hospitalId?: string | null): Promise<RoomRecord[]> {
  if (!hasSupabaseEnv() || !hospitalId) return mockRooms.map((room) => attachOccupancyToRoom(room, mockBeds));

  const supabase = asQueryClient(await createServerSupabaseClient());
  const { data, error } = await supabase
    .from<RoomRecord>("rooms")
    .select("*, wards(id,name,floor), beds(*)")
    .eq("hospital_id", hospitalId)
    .order("room_number");
  if (error) throw error;
  return (data ?? []).map((room) => {
    const beds = room.beds ?? [];
    return {
      ...room,
      total_beds: beds.length,
      occupied_beds: beds.filter((bed) => bed.status === "occupied").length,
      available_beds: beds.filter((bed) => bed.status === "available").length
    };
  });
}

export async function listBeds(hospitalId?: string | null): Promise<BedRecord[]> {
  if (!hasSupabaseEnv() || !hospitalId) return hydrateBeds(mockBeds);

  const supabase = asQueryClient(await createServerSupabaseClient());
  const { data, error } = await supabase
    .from<BedRecord>("beds")
    .select("*, rooms(id,room_number,room_type,ward_id,wards(id,name,floor))")
    .eq("hospital_id", hospitalId)
    .order("bed_number");
  if (error) throw error;
  return data ?? [];
}

export async function listAvailableBeds(hospitalId?: string | null) {
  const beds = await listBeds(hospitalId);
  return beds.filter((bed) => bed.status === "available" && !bed.current_patient_id);
}

export async function getBed(bedId: string, hospitalId?: string | null) {
  const beds = await listBeds(hospitalId);
  return beds.find((bed) => bed.id === bedId) ?? null;
}

export async function getOccupancySummary(hospitalId?: string | null) {
  const beds = await listBeds(hospitalId);
  return {
    total: beds.length,
    available: beds.filter((bed) => bed.status === "available").length,
    occupied: beds.filter((bed) => bed.status === "occupied").length,
    maintenance: beds.filter((bed) => bed.status === "maintenance").length,
    reserved: beds.filter((bed) => bed.status === "reserved").length
  };
}

export async function getRoom(id: string, hospitalId?: string | null) {
  const rooms = await listRooms(hospitalId);
  return rooms.find((room) => room.id === id) ?? null;
}

export async function getWard(id: string, hospitalId?: string | null) {
  const wards = await listWards(hospitalId);
  return wards.find((ward) => ward.id === id) ?? null;
}

export async function createRoom(hospitalId: string, values: RoomInput, actorProfileId?: string | null) {
  const parsed = roomSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Please fix room details." };
  if (!hasSupabaseEnv()) return { ok: true, message: "Room validated. Connect Supabase to persist records.", roomId: "room-1001" };
  const supabase = asQueryClient(await createServerSupabaseClient());
  const payload = { id: crypto.randomUUID(), hospital_id: hospitalId, ...parsed.data };
  const { error } = await supabase.from("rooms").insert(payload);
  if (error) return { ok: false, message: error.message };
  await writeAuditLog({ hospitalId, action: "room.created", entityType: "room", entityId: payload.id, values: { ...payload, actorProfileId } });
  return { ok: true, message: "Room created.", roomId: payload.id };
}

export async function updateRoom(id: string, hospitalId: string, values: RoomInput, actorProfileId?: string | null) {
  const parsed = roomSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Please fix room details." };
  if (!hasSupabaseEnv()) return { ok: true, message: "Room changes validated. Connect Supabase to persist records." };
  const supabase = asQueryClient(await createServerSupabaseClient());
  const payload = { ...parsed.data, updated_at: new Date().toISOString() };
  const { error } = await supabase.from("rooms").update(payload).eq("hospital_id", hospitalId).eq("id", id);
  if (error) return { ok: false, message: error.message };
  await writeAuditLog({ hospitalId, action: "room.updated", entityType: "room", entityId: id, values: { ...payload, actorProfileId } });
  return { ok: true, message: "Room updated." };
}

export async function softDeleteRoom(id: string, hospitalId: string, actorProfileId?: string | null) {
  if (!hasSupabaseEnv()) return { ok: true, message: "Room deletion validated. Connect Supabase to persist records." };
  const supabase = asQueryClient(await createServerSupabaseClient());
  const payload = { status: "inactive", updated_at: new Date().toISOString() };
  const { error } = await supabase.from("rooms").update(payload).eq("hospital_id", hospitalId).eq("id", id);
  if (error) return { ok: false, message: error.message };
  await writeAuditLog({ hospitalId, action: "room.deleted", entityType: "room", entityId: id, values: { ...payload, actorProfileId } });
  return { ok: true, message: "Room deactivated." };
}

export async function createWard(hospitalId: string, values: WardInput, actorProfileId?: string | null) {
  const parsed = wardSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Please fix ward details." };
  if (!hasSupabaseEnv()) return { ok: true, message: "Ward validated. Connect Supabase to persist records.", wardId: "ward-1001" };
  const supabase = asQueryClient(await createServerSupabaseClient());
  const payload = { id: crypto.randomUUID(), hospital_id: hospitalId, ...parsed.data, department_id: parsed.data.department_id || null, description: parsed.data.description || null };
  const { error } = await supabase.from("wards").insert(payload);
  if (error) return { ok: false, message: error.message };
  await writeAuditLog({ hospitalId, action: "ward.created", entityType: "ward", entityId: payload.id, values: { ...payload, actorProfileId } });
  return { ok: true, message: "Ward created.", wardId: payload.id };
}

export async function updateWard(id: string, hospitalId: string, values: WardInput, actorProfileId?: string | null) {
  const parsed = wardSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Please fix ward details." };
  if (!hasSupabaseEnv()) return { ok: true, message: "Ward changes validated. Connect Supabase to persist records." };
  const supabase = asQueryClient(await createServerSupabaseClient());
  const payload = { ...parsed.data, department_id: parsed.data.department_id || null, description: parsed.data.description || null, updated_at: new Date().toISOString() };
  const { error } = await supabase.from("wards").update(payload).eq("hospital_id", hospitalId).eq("id", id);
  if (error) return { ok: false, message: error.message };
  await writeAuditLog({ hospitalId, action: "ward.updated", entityType: "ward", entityId: id, values: { ...payload, actorProfileId } });
  return { ok: true, message: "Ward updated." };
}

export async function softDeleteWard(id: string, hospitalId: string, actorProfileId?: string | null) {
  if (!hasSupabaseEnv()) return { ok: true, message: "Ward deletion validated. Connect Supabase to persist records." };
  const supabase = asQueryClient(await createServerSupabaseClient());
  const payload = { is_active: false, updated_at: new Date().toISOString() };
  const { error } = await supabase.from("wards").update(payload).eq("hospital_id", hospitalId).eq("id", id);
  if (error) return { ok: false, message: error.message };
  await writeAuditLog({ hospitalId, action: "ward.deleted", entityType: "ward", entityId: id, values: { ...payload, actorProfileId } });
  return { ok: true, message: "Ward deactivated." };
}

export async function createBed(hospitalId: string, values: BedInput, actorProfileId?: string | null) {
  const parsed = bedSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Please fix bed details." };
  if (!hasSupabaseEnv()) return { ok: true, message: "Bed validated. Connect Supabase to persist records.", bedId: "bed-1001" };
  const supabase = asQueryClient(await createServerSupabaseClient());
  const payload = { id: crypto.randomUUID(), hospital_id: hospitalId, ...parsed.data, current_patient_id: parsed.data.current_patient_id || null };
  const { error } = await supabase.from("beds").insert(payload);
  if (error) return { ok: false, message: error.message };
  await writeAuditLog({ hospitalId, action: "bed.created", entityType: "bed", entityId: payload.id, values: { ...payload, actorProfileId } });
  return { ok: true, message: "Bed created.", bedId: payload.id };
}

export async function updateBed(id: string, hospitalId: string, values: BedInput, actorProfileId?: string | null) {
  const parsed = bedSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Please fix bed details." };
  if (!hasSupabaseEnv()) return { ok: true, message: "Bed changes validated. Connect Supabase to persist records." };
  const supabase = asQueryClient(await createServerSupabaseClient());
  const payload = { ...parsed.data, current_patient_id: parsed.data.current_patient_id || null, updated_at: new Date().toISOString() };
  const { error } = await supabase.from("beds").update(payload).eq("hospital_id", hospitalId).eq("id", id);
  if (error) return { ok: false, message: error.message };
  await writeAuditLog({ hospitalId, action: "bed.updated", entityType: "bed", entityId: id, values: { ...payload, actorProfileId } });
  return { ok: true, message: "Bed updated." };
}

export async function softDeleteBed(id: string, hospitalId: string, actorProfileId?: string | null) {
  if (!hasSupabaseEnv()) return { ok: true, message: "Bed deletion validated. Connect Supabase to persist records." };
  const supabase = asQueryClient(await createServerSupabaseClient());
  const payload = { status: "maintenance", current_patient_id: null, updated_at: new Date().toISOString() };
  const { error } = await supabase.from("beds").update(payload).eq("hospital_id", hospitalId).eq("id", id);
  if (error) return { ok: false, message: error.message };
  await writeAuditLog({ hospitalId, action: "bed.deleted", entityType: "bed", entityId: id, values: { ...payload, actorProfileId } });
  return { ok: true, message: "Bed placed in maintenance." };
}
