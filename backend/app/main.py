from __future__ import annotations

import base64
import binascii
import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List

from fastapi import FastAPI, HTTPException, Query, Body, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "omancare.db"
UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)
MAX_IMAGE_BYTES = 3 * 1024 * 1024
IMAGE_TYPES = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}

app = FastAPI(title="OmanCare API", version="1.0.0")
app.mount("/api/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def to_dict(row: sqlite3.Row | None) -> Dict[str, Any] | None:
    if row is None:
        return None
    return dict(row)


def load_seed_data() -> Dict[str, List[Dict[str, Any]]]:
    return {
        "cities": [
            {
                "id": "muscat",
                "name": "Muscat",
                "governorate": "Muscat",
                "wilayat": "Muscat",
                "lat": 23.588,
                "lng": 58.3829,
            },
            {
                "id": "salalah",
                "name": "Salalah",
                "governorate": "Dhofar",
                "wilayat": "Salalah",
                "lat": 17.0151,
                "lng": 54.0924,
            },
            {
                "id": "sohar",
                "name": "Sohar",
                "governorate": "North Batinah",
                "wilayat": "Sohar",
                "lat": 24.3477,
                "lng": 56.7089,
            },
            {
                "id": "nizwa",
                "name": "Nizwa",
                "governorate": "Dakhiliyah",
                "wilayat": "Nizwa",
                "lat": 22.9333,
                "lng": 57.5333,
            },
            {
                "id": "sur",
                "name": "Sur",
                "governorate": "South Sharqiyah",
                "wilayat": "Sur",
                "lat": 22.5333,
                "lng": 59.5333,
            },
        ],
        "facilities": [
            {
                "id": "fac-muscat-1",
                "name": "Al Rahman Mosque",
                "name_arabic": "مسجد الرحمن",
                "type": "mosque",
                "city_id": "muscat",
                "governorate": "Muscat",
                "wilayat": "Muscat",
                "area": "Al Khuwair",
                "address": "Muscat",
                "lat": 23.595,
                "lng": 58.39,
                "responsible_org": "Community Support Team",
                "verification_status": "verified",
                "verification_date": "2026-09-20",
                "owner_id": None,
            },
            {
                "id": "fac-muscat-2",
                "name": "Royal Oman Hospital",
                "name_arabic": "مستشفى الملكي",
                "type": "hospital",
                "city_id": "muscat",
                "governorate": "Muscat",
                "wilayat": "Muscat",
                "area": "Seeb",
                "address": "Seeb, Muscat",
                "lat": 23.63,
                "lng": 58.31,
                "responsible_org": "Royal Care Network",
                "verification_status": "verified",
                "verification_date": "2026-09-21",
                "owner_id": None,
            },
            {
                "id": "fac-salalah-1",
                "name": "Salalah Community Masjid",
                "name_arabic": "مسجد الصلاح",
                "type": "mosque",
                "city_id": "salalah",
                "governorate": "Dhofar",
                "wilayat": "Salalah",
                "area": "Haffa",
                "address": "Haffa, Salalah",
                "lat": 17.02,
                "lng": 54.12,
                "responsible_org": "Dhofar Relief Group",
                "verification_status": "verified",
                "verification_date": "2026-09-18",
                "owner_id": None,
            },
        ],
        "projects": [
            {
                "id": "proj-muscat-water",
                "facility_id": "fac-muscat-1",
                "title": "Water Tank Support for Al Rahman Mosque",
                "category": "water",
                "need_level": "high",
                "urgency": "urgent",
                "target_amount": 1200,
                "collected_amount": 480,
                "currency": "OMR",
                "description": "Install a clean water tank and piping for worshippers and community use.",
                "status": "active",
                "verified": 1,
                "image_url": None,
                "water_type": "tank",
                "created_at": "2026-09-20T12:00:00Z",
                "updated_at": "2026-09-23T10:00:00Z",
            },
            {
                "id": "proj-muscat-hospital",
                "facility_id": "fac-muscat-2",
                "title": "Hospital Water & Care Station",
                "category": "hospital",
                "need_level": "critical",
                "urgency": "critical",
                "target_amount": 3000,
                "collected_amount": 800,
                "currency": "OMR",
                "description": "Fund essential water supply and patient support equipment at the hospital.",
                "status": "active",
                "verified": 1,
                "image_url": None,
                "water_type": None,
                "created_at": "2026-09-18T09:00:00Z",
                "updated_at": "2026-09-22T16:00:00Z",
            },
            {
                "id": "proj-salalah-water",
                "facility_id": "fac-salalah-1",
                "title": "Mosque Water Supply Upgrade",
                "category": "water",
                "need_level": "medium",
                "urgency": "normal",
                "target_amount": 900,
                "collected_amount": 310,
                "currency": "OMR",
                "description": "Improve water access for prayers and seasonal visitors at the mosque.",
                "status": "active",
                "verified": 1,
                "image_url": None,
                "water_type": "supply",
                "created_at": "2026-09-19T08:00:00Z",
                "updated_at": "2026-09-23T08:00:00Z",
            },
        ],
        "donations": [
            {
                "id": "don-1",
                "project_id": "proj-muscat-water",
                "user_id": "user-demo",
                "donor_name": "Aisha Rahman",
                "donor_email": "aisha@example.com",
                "amount": 120,
                "currency": "OMR",
                "recurring": 0,
                "frequency": "one-time",
                "status": "completed",
                "delivery_status": "received",
                "delivery_updated_at": "2026-09-23T09:00:00Z",
                "receipt_number": "OMC-20260923-001",
                "created_at": "2026-09-23T09:00:00Z",
            },
            {
                "id": "don-2",
                "project_id": "proj-salalah-water",
                "user_id": "user-demo",
                "donor_name": "Aisha Rahman",
                "donor_email": "aisha@example.com",
                "amount": 90,
                "currency": "OMR",
                "recurring": 1,
                "frequency": "monthly",
                "status": "completed",
                "delivery_status": "preparing",
                "delivery_updated_at": "2026-09-21T16:00:00Z",
                "receipt_number": "OMC-20260921-002",
                "created_at": "2026-09-21T16:00:00Z",
            },
        ],
        "impact_updates": [
            {
                "id": "impact-1",
                "project_id": "proj-muscat-water",
                "title": "Water tank installation started",
                "description": "The team has completed the site assessment and ordered the tank materials.",
                "completion_date": "2026-09-22",
                "amount_utilized": 220,
                "quantity_delivered": "1 tank + piping set",
                "status": "published",
                "created_at": "2026-09-22T09:00:00Z",
            },
            {
                "id": "impact-2",
                "project_id": "proj-salalah-water",
                "title": "Supply line inspected",
                "description": "The water line route was checked and materials are being prepared for installation.",
                "completion_date": "2026-09-20",
                "amount_utilized": 160,
                "quantity_delivered": "2 supply line kits",
                "status": "published",
                "created_at": "2026-09-20T11:00:00Z",
            },
        ],
    }


def init_db() -> None:
    conn = get_connection()
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS cities (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                governorate TEXT NOT NULL,
                wilayat TEXT,
                lat REAL NOT NULL,
                lng REAL NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS facilities (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                name_arabic TEXT,
                type TEXT NOT NULL,
                city_id TEXT,
                governorate TEXT NOT NULL,
                wilayat TEXT,
                area TEXT,
                address TEXT,
                lat REAL NOT NULL,
                lng REAL NOT NULL,
                responsible_org TEXT,
                verification_status TEXT DEFAULT 'pending',
                verification_date TEXT,
                owner_id TEXT
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                facility_id TEXT NOT NULL,
                title TEXT NOT NULL,
                category TEXT NOT NULL,
                need_level TEXT NOT NULL,
                urgency TEXT NOT NULL,
                target_amount REAL NOT NULL,
                collected_amount REAL NOT NULL DEFAULT 0,
                currency TEXT NOT NULL DEFAULT 'OMR',
                description TEXT,
                status TEXT NOT NULL DEFAULT 'active',
                verified INTEGER NOT NULL DEFAULT 0,
                image_url TEXT,
                water_type TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (facility_id) REFERENCES facilities(id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS donations (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                user_id TEXT,
                donor_name TEXT,
                donor_email TEXT,
                amount REAL NOT NULL,
                currency TEXT NOT NULL DEFAULT 'OMR',
                recurring INTEGER NOT NULL DEFAULT 0,
                frequency TEXT,
                status TEXT NOT NULL DEFAULT 'completed',
                delivery_status TEXT NOT NULL DEFAULT 'received',
                delivery_updated_at TEXT,
                receipt_number TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS impact_updates (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                completion_date TEXT,
                amount_utilized REAL,
                quantity_delivered TEXT,
                status TEXT NOT NULL DEFAULT 'published',
                created_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id)
            )
            """
        )

        project_columns = {row["name"] for row in conn.execute("PRAGMA table_info(projects)")}
        if "service_radius_km" not in project_columns:
            # NULL = no radius limit (visible everywhere)
            conn.execute("ALTER TABLE projects ADD COLUMN service_radius_km REAL")

        for table_name, rows in load_seed_data().items():
            count = conn.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
            if count == 0:
                if table_name == "cities":
                    conn.executemany(
                        "INSERT INTO cities (id, name, governorate, wilayat, lat, lng) VALUES (:id, :name, :governorate, :wilayat, :lat, :lng)",
                        rows,
                    )
                elif table_name == "facilities":
                    conn.executemany(
                        "INSERT INTO facilities (id, name, name_arabic, type, city_id, governorate, wilayat, area, address, lat, lng, responsible_org, verification_status, verification_date, owner_id) VALUES (:id, :name, :name_arabic, :type, :city_id, :governorate, :wilayat, :area, :address, :lat, :lng, :responsible_org, :verification_status, :verification_date, :owner_id)",
                        rows,
                    )
                elif table_name == "projects":
                    conn.executemany(
                        "INSERT INTO projects (id, facility_id, title, category, need_level, urgency, target_amount, collected_amount, currency, description, status, verified, image_url, water_type, created_at, updated_at) VALUES (:id, :facility_id, :title, :category, :need_level, :urgency, :target_amount, :collected_amount, :currency, :description, :status, :verified, :image_url, :water_type, :created_at, :updated_at)",
                        rows,
                    )
                elif table_name == "donations":
                    conn.executemany(
                        "INSERT INTO donations (id, project_id, user_id, donor_name, donor_email, amount, currency, recurring, frequency, status, delivery_status, delivery_updated_at, receipt_number, created_at) VALUES (:id, :project_id, :user_id, :donor_name, :donor_email, :amount, :currency, :recurring, :frequency, :status, :delivery_status, :delivery_updated_at, :receipt_number, :created_at)",
                        rows,
                    )
                elif table_name == "impact_updates":
                    conn.executemany(
                        "INSERT INTO impact_updates (id, project_id, title, description, completion_date, amount_utilized, quantity_delivered, status, created_at) VALUES (:id, :project_id, :title, :description, :completion_date, :amount_utilized, :quantity_delivered, :status, :created_at)",
                        rows,
                    )
        conn.commit()
    finally:
        conn.close()


init_db()


class DonationCreate(BaseModel):
    project_id: str
    user_id: str | None = None
    donor_name: str | None = None
    donor_email: str | None = None
    amount: float = Field(..., gt=0)
    currency: str = "OMR"
    recurring: bool = False
    frequency: str = "one-time"

    @classmethod
    def _clean_optional(cls, value: Any) -> str | None:
        if value is None:
            return None
        if isinstance(value, str):
            value = value.strip()
            return value or None
        return str(value)

    @classmethod
    def _normalize_amount(cls, value: Any) -> float:
        if value is None:
            raise ValueError("Donation amount is required")
        try:
            cleaned = float(str(value).strip())
        except (TypeError, ValueError):
            raise ValueError("Donation amount is required")
        if cleaned <= 0:
            raise ValueError("Donation amount must be greater than zero")
        return cleaned

    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, value):
        if not isinstance(value, dict):
            return value

        cleaned = dict(value)
        cleaned["project_id"] = str(cleaned.get("project_id", "")).strip()
        cleaned["user_id"] = cls._clean_optional(cleaned.get("user_id"))
        cleaned["donor_name"] = cls._clean_optional(cleaned.get("donor_name"))
        cleaned["donor_email"] = cls._clean_optional(cleaned.get("donor_email"))

        if cleaned.get("amount") is not None:
            cleaned["amount"] = cls._normalize_amount(cleaned.get("amount"))

        if cleaned.get("currency") is not None:
            cleaned["currency"] = str(cleaned["currency"]).strip() or "OMR"

        if cleaned.get("recurring") is not None:
            recurring = cleaned["recurring"]
            if isinstance(recurring, str):
                cleaned["recurring"] = recurring.strip().lower() in {"true", "1", "yes", "y"}

        if cleaned.get("frequency") is not None:
            frequency = str(cleaned["frequency"]).strip().lower()
            if frequency in {"", "one-time", "onetime"}:
                cleaned["frequency"] = "one-time"
            elif frequency in {"weekly", "monthly", "custom"}:
                cleaned["frequency"] = frequency
            else:
                cleaned["frequency"] = str(cleaned["frequency"]).strip()

        return cleaned


def normalize_donation_payload(raw: Any) -> Dict[str, Any]:
    if not isinstance(raw, dict):
        raise HTTPException(status_code=400, detail="Donation payload must be a JSON object")

    project_id = str(raw.get("project_id") or raw.get("projectId") or "").strip()
    if not project_id:
        raise HTTPException(status_code=400, detail="Project is required")

    amount_raw = raw.get("amount")
    try:
        amount = float(str(amount_raw).strip())
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Donation amount is required")
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Donation amount must be greater than zero")

    user_id = raw.get("user_id")
    donor_name = raw.get("donor_name")
    donor_email = raw.get("donor_email")

    def clean_optional(value: Any) -> str | None:
        if value is None:
            return None
        if isinstance(value, str):
            cleaned = value.strip()
            return cleaned or None
        return str(value)

    recurring = raw.get("recurring", False)
    if isinstance(recurring, str):
        recurring = recurring.strip().lower() in {"true", "1", "yes", "y"}
    elif recurring is None:
        recurring = False

    frequency = str(raw.get("frequency") or "one-time").strip().lower()
    if frequency in {"", "one-time", "onetime"}:
        frequency = "one-time"
    elif frequency in {"weekly", "monthly", "custom"}:
        pass
    else:
        frequency = "one-time"

    currency = str(raw.get("currency") or "OMR").strip().upper() or "OMR"

    return {
        "project_id": project_id,
        "user_id": clean_optional(user_id) or None,
        "donor_name": clean_optional(donor_name) or "Anonymous Donor",
        "donor_email": clean_optional(donor_email) or "anonymous@omancare.local",
        "amount": amount,
        "currency": currency,
        "recurring": bool(recurring),
        "frequency": frequency,
    }


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/cities")
def get_cities() -> List[Dict[str, Any]]:
    conn = get_connection()
    try:
        rows = conn.execute("SELECT * FROM cities ORDER BY name").fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def normalize_project_row(row: Dict[str, Any] | sqlite3.Row) -> Dict[str, Any]:
    if hasattr(row, 'keys'):
        row_data = dict(row)
    else:
        row_data = row

    project: Dict[str, Any] = {}
    facility_data: Dict[str, Any] = {}

    for key, value in row_data.items():
        if key.startswith("facility__"):
            facility_key = key[10:]
            if value is not None:
                facility_data[facility_key] = value
        else:
            project[key] = value

    if facility_data.get("name"):
        project["facility"] = facility_data
    else:
        project["facility"] = None

    if "verified" in project:
        project["verified"] = bool(project.get("verified", 0))

    return project


PROJECT_SELECT_SQL = """
    SELECT
        p.id AS id,
        p.facility_id,
        p.title,
        p.category,
        p.need_level,
        p.urgency,
        p.target_amount,
        p.collected_amount,
        p.currency,
        p.description,
        p.status,
        p.verified,
        p.image_url,
        p.water_type,
        p.service_radius_km,
        p.created_at,
        p.updated_at,
        f.id AS facility__id,
        f.name AS facility__name,
        f.name_arabic AS facility__name_arabic,
        f.type AS facility__type,
        f.city_id AS facility__city_id,
        f.governorate AS facility__governorate,
        f.wilayat AS facility__wilayat,
        f.area AS facility__area,
        f.address AS facility__address,
        f.lat AS facility__lat,
        f.lng AS facility__lng,
        f.responsible_org AS facility__responsible_org,
        f.verification_status AS facility__verification_status,
        f.verification_date AS facility__verification_date,
        f.owner_id AS facility__owner_id
    FROM projects p
    LEFT JOIN facilities f ON f.id = p.facility_id
"""


@app.get("/api/projects")
def get_projects(
    category: str | None = None,
    city_id: str | None = None,
    facility_id: str | None = None,
    user_id: str | None = None,
    status: str | None = None,
) -> List[Dict[str, Any]]:
    conn = get_connection()
    try:
        query = PROJECT_SELECT_SQL + " WHERE 1=1"
        params: List[Any] = []

        if status:
            query += " AND p.status = ?"
            params.append(status)
        if category:
            query += " AND p.category = ?"
            params.append(category)
        if city_id:
            query += " AND f.city_id = ?"
            params.append(city_id)
        if facility_id:
            query += " AND p.facility_id = ?"
            params.append(facility_id)
        if user_id:
            query += " AND p.id IN (SELECT project_id FROM donations WHERE user_id = ?)"
            params.append(user_id)

        query += " ORDER BY p.created_at DESC"
        rows = conn.execute(query, params).fetchall()

        results: List[Dict[str, Any]] = []
        for row in rows:
            results.append(normalize_project_row(row))
        return results
    finally:
        conn.close()


@app.get("/api/projects/{project_id}")
def get_project(project_id: str) -> Dict[str, Any]:
    conn = get_connection()
    try:
        row = conn.execute(
            PROJECT_SELECT_SQL + " WHERE p.id = ?",
            (project_id,),
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Project not found")

        return normalize_project_row(row)
    finally:
        conn.close()


@app.get("/api/projects/{project_id}/donations")
def get_project_donations(project_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM donations WHERE project_id = ? ORDER BY created_at DESC LIMIT 20",
            (project_id,),
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


@app.get("/api/projects/{project_id}/impact")
def get_project_impact(project_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM impact_updates WHERE project_id = ? AND status = 'published' ORDER BY created_at DESC",
            (project_id,),
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


@app.get("/api/donations")
def get_donations(user_id: str | None = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    try:
        if user_id:
            rows = conn.execute(
                "SELECT * FROM donations WHERE user_id = ? AND status = 'completed' ORDER BY created_at DESC LIMIT 20",
                (user_id,),
            ).fetchall()
            results: List[Dict[str, Any]] = []
            for row in rows:
                donation = dict(row)
                project_row = conn.execute(
                    PROJECT_SELECT_SQL + " WHERE p.id = ?",
                    (donation["project_id"],),
                ).fetchone()
                if project_row:
                    donation["project"] = normalize_project_row(project_row)
                results.append(donation)
            return results

        rows = conn.execute("SELECT * FROM donations ORDER BY created_at DESC LIMIT 20").fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()





@app.get("/api/impact-stats")
def get_impact_stats() -> Dict[str, Any]:
    conn = get_connection()
    try:
        total_donations = conn.execute("SELECT COUNT(*) FROM donations WHERE status = 'completed'").fetchone()[0]
        total_raised = conn.execute("SELECT COALESCE(SUM(amount), 0) FROM donations WHERE status = 'completed'").fetchone()[0]
        total_projects = conn.execute("SELECT COUNT(*) FROM projects").fetchone()[0]
        active_projects = conn.execute("SELECT COUNT(*) FROM projects WHERE status = 'active'").fetchone()[0]
        completed_projects = conn.execute("SELECT COUNT(*) FROM projects WHERE status = 'completed'").fetchone()[0]
        return {
            "totalDonations": total_donations,
            "totalProjects": total_projects,
            "activeProjects": active_projects,
            "completedProjects": completed_projects,
            "totalRaised": float(total_raised or 0),
        }
    finally:
        conn.close()


@app.get("/api/facilities")
def get_facilities(
    city_id: str | None = Query(None),
    types: str | None = Query(None),
) -> List[Dict[str, Any]]:
    """Get facilities, optionally filtered by city and type"""
    conn = get_connection()
    try:
        query = "SELECT * FROM facilities WHERE verification_status = 'verified'"
        params: List[Any] = []

        if city_id:
            query += " AND city_id = ?"
            params.append(city_id)

        if types:
            type_list = [t.strip() for t in types.split(",")]
            placeholders = ",".join(["?" for _ in type_list])
            query += f" AND type IN ({placeholders})"
            params.extend(type_list)

        query += " ORDER BY name"
        rows = conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


@app.get("/api/donations/{donation_id}")
def get_donation(donation_id: str) -> Dict[str, Any]:
    """Get donation details including tracking status"""
    conn = get_connection()
    try:
        row = conn.execute("SELECT * FROM donations WHERE id = ?", (donation_id,)).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Donation not found")

        donation = dict(row)

        # Get associated project info
        project_row = conn.execute(
            PROJECT_SELECT_SQL + " WHERE p.id = ?",
            (donation["project_id"],),
        ).fetchone()

        if project_row:
            donation["project"] = normalize_project_row(project_row)

        return donation
    finally:
        conn.close()


@app.put("/api/donations/{donation_id}/track")
def update_donation_tracking(
    donation_id: str,
    payload: dict[str, Any] = Body(...),
) -> Dict[str, Any]:
    """Update donation delivery status"""
    conn = get_connection()
    try:
        row = conn.execute("SELECT * FROM donations WHERE id = ?", (donation_id,)).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Donation not found")

        valid_statuses = ["received", "preparing", "on_the_way", "delivered"]
        new_status = payload.get("delivery_status")

        if new_status not in valid_statuses:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}",
            )

        updated_at = utc_now()
        conn.execute(
            "UPDATE donations SET delivery_status = ?, delivery_updated_at = ? WHERE id = ?",
            (new_status, updated_at, donation_id),
        )
        conn.commit()

        return {
            "id": donation_id,
            "delivery_status": new_status,
            "delivery_updated_at": updated_at,
        }
    finally:
        conn.close()


@app.post("/api/donations")
def create_donation_new(payload: dict[str, Any] = Body(...)) -> Dict[str, Any]:
    """Create a donation - supports both facility_id and project_id"""
    conn = get_connection()
    try:
        facility_id = payload.get("facility_id")
        project_id = payload.get("project_id")

        # If facility_id is provided, find/create a project for water donation
        if facility_id and not project_id:
            # Check if facility exists
            facility_row = conn.execute(
                "SELECT * FROM facilities WHERE id = ?", (facility_id,)
            ).fetchone()
            if facility_row is None:
                raise HTTPException(status_code=404, detail="Facility not found")

            # Find or create a water donation project for this facility
            project_row = conn.execute(
                "SELECT * FROM projects WHERE facility_id = ? AND category = 'water' AND status = 'active' LIMIT 1",
                (facility_id,),
            ).fetchone()

            if project_row is None:
                # Create a new project
                project_id = str(uuid.uuid4())
                facility_name = facility_row["name"]
                project_title = f"Water Support for {facility_name}"

                conn.execute(
                    """
                    INSERT INTO projects (
                        id, facility_id, title, category, need_level, urgency,
                        target_amount, collected_amount, currency, description,
                        status, verified, image_url, water_type, created_at, updated_at
                    ) VALUES (?, ?, ?, 'water', 'high', 'normal', 10000, 0, 'OMR',
                              'Water support for the facility', 'active', 1, NULL, 'supply', ?, ?)
                    """,
                    (project_id, facility_id, utc_now(), utc_now()),
                )
            else:
                project_id = project_row["id"]

        if not project_id:
            raise HTTPException(status_code=400, detail="Either facility_id or project_id must be provided")

        project_row = conn.execute(
            "SELECT * FROM projects WHERE id = ?", (project_id,)
        ).fetchone()
        if project_row is None:
            raise HTTPException(status_code=404, detail="Project not found")

        # Create donation record
        donation_id = str(uuid.uuid4())
        receipt_number = f"OMC-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        created_at = utc_now()

        donor_name = payload.get("donor_name") or "Anonymous Donor"
        donor_email = payload.get("donor_email") or "anonymous@omancare.local"

        conn.execute(
            """
            INSERT INTO donations (
                id, project_id, user_id, donor_name, donor_email, amount, currency,
                recurring, frequency, status, delivery_status, delivery_updated_at,
                receipt_number, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', 'received', ?, ?, ?)
            """,
            (
                donation_id,
                project_id,
                payload.get("user_id"),
                donor_name,
                donor_email,
                float(payload.get("amount", 0)),
                payload.get("currency", "OMR"),
                1 if payload.get("recurring") else 0,
                payload.get("frequency", "one-time"),
                created_at,
                receipt_number,
                created_at,
            ),
        )

        # Update project collected amount
        updated_amount = float(project_row["collected_amount"]) + float(payload.get("amount", 0))
        conn.execute(
            "UPDATE projects SET collected_amount = ?, updated_at = ? WHERE id = ?",
            (updated_amount, created_at, project_id),
        )

        conn.commit()

        return {
            "id": donation_id,
            "receipt_number": receipt_number,
            "amount": float(payload.get("amount", 0)),
            "currency": payload.get("currency", "OMR"),
            "status": "completed",
            "delivery_status": "received",
        }
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Admin: donation posts and facility verification
# NOTE: the app has no server-side auth yet; these routes trust the caller.
# ---------------------------------------------------------------------------

PROJECT_STATUSES = {"active", "funded", "completed", "cancelled"}


def save_image_data_url(data_url: str) -> str:
    """Store a base64 data URL upload and return its public path."""
    try:
        header, encoded = data_url.split(",", 1)
        mime = header.split(";")[0].removeprefix("data:")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid image data")
    ext = IMAGE_TYPES.get(mime)
    if ext is None:
        raise HTTPException(status_code=400, detail="Photo must be JPEG, PNG or WebP")
    try:
        raw = base64.b64decode(encoded, validate=True)
    except (binascii.Error, ValueError):
        raise HTTPException(status_code=400, detail="Invalid image data")
    if len(raw) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=400, detail="Photo must be 3 MB or smaller")
    filename = f"{uuid.uuid4().hex}.{ext}"
    (UPLOADS_DIR / filename).write_bytes(raw)
    return f"/api/uploads/{filename}"


def delete_uploaded_image(image_url: str | None) -> None:
    if image_url and image_url.startswith("/api/uploads/"):
        (UPLOADS_DIR / image_url.rsplit("/", 1)[-1]).unlink(missing_ok=True)


class AdminPostIn(BaseModel):
    facility_id: str
    title: str = Field(..., min_length=3, max_length=120)
    description: str = Field("", max_length=2000)
    target_amount: float = Field(..., gt=0)
    service_radius_km: float | None = Field(None, gt=0, le=500)
    image_data: str | None = None
    remove_image: bool = False
    status: str = "active"


@app.get("/api/admin/facilities")
def admin_list_facilities() -> List[Dict[str, Any]]:
    conn = get_connection()
    try:
        rows = conn.execute("SELECT * FROM facilities ORDER BY name").fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


@app.put("/api/admin/facilities/{facility_id}/verification")
def admin_set_verification(facility_id: str, payload: dict[str, Any] = Body(...)) -> Dict[str, Any]:
    status = str(payload.get("status", "")).strip()
    if status not in {"verified", "rejected", "pending"}:
        raise HTTPException(status_code=400, detail="Status must be verified, rejected or pending")
    conn = get_connection()
    try:
        cur = conn.execute(
            "UPDATE facilities SET verification_status = ?, verification_date = ? WHERE id = ?",
            (status, utc_now() if status == "verified" else None, facility_id),
        )
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Facility not found")
        conn.commit()
        return dict(conn.execute("SELECT * FROM facilities WHERE id = ?", (facility_id,)).fetchone())
    finally:
        conn.close()


def _validate_post(conn: sqlite3.Connection, post: AdminPostIn) -> None:
    if post.status not in PROJECT_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")
    facility = conn.execute("SELECT verification_status FROM facilities WHERE id = ?", (post.facility_id,)).fetchone()
    if facility is None:
        raise HTTPException(status_code=404, detail="Facility not found")
    if facility["verification_status"] != "verified":
        raise HTTPException(status_code=400, detail="Facility must be verified before posting")


@app.post("/api/admin/projects", status_code=201)
def admin_create_post(post: AdminPostIn) -> Dict[str, Any]:
    conn = get_connection()
    try:
        _validate_post(conn, post)
        image_url = save_image_data_url(post.image_data) if post.image_data else None
        project_id = f"post-{uuid.uuid4().hex[:12]}"
        now = utc_now()
        conn.execute(
            """
            INSERT INTO projects (
                id, facility_id, title, category, need_level, urgency, target_amount,
                collected_amount, currency, description, status, verified, image_url,
                water_type, service_radius_km, created_at, updated_at
            ) VALUES (?, ?, ?, 'water', 'medium', 'normal', ?, 0, 'OMR', ?, ?, 1, ?, NULL, ?, ?, ?)
            """,
            (
                project_id, post.facility_id, post.title.strip(), post.target_amount,
                post.description.strip() or None, post.status, image_url, post.service_radius_km, now, now,
            ),
        )
        conn.commit()
        return normalize_project_row(conn.execute(PROJECT_SELECT_SQL + " WHERE p.id = ?", (project_id,)).fetchone())
    finally:
        conn.close()


@app.put("/api/admin/projects/{project_id}")
def admin_update_post(project_id: str, post: AdminPostIn) -> Dict[str, Any]:
    conn = get_connection()
    try:
        existing = conn.execute("SELECT image_url FROM projects WHERE id = ?", (project_id,)).fetchone()
        if existing is None:
            raise HTTPException(status_code=404, detail="Post not found")
        _validate_post(conn, post)

        image_url = existing["image_url"]
        if post.image_data:
            image_url = save_image_data_url(post.image_data)
            delete_uploaded_image(existing["image_url"])
        elif post.remove_image:
            delete_uploaded_image(existing["image_url"])
            image_url = None

        conn.execute(
            """
            UPDATE projects SET facility_id = ?, title = ?, description = ?, target_amount = ?,
                service_radius_km = ?, status = ?, image_url = ?, updated_at = ?
            WHERE id = ?
            """,
            (
                post.facility_id, post.title.strip(), post.description.strip() or None, post.target_amount,
                post.service_radius_km, post.status, image_url, utc_now(), project_id,
            ),
        )
        conn.commit()
        return normalize_project_row(conn.execute(PROJECT_SELECT_SQL + " WHERE p.id = ?", (project_id,)).fetchone())
    finally:
        conn.close()


@app.delete("/api/admin/projects/{project_id}", status_code=204, response_class=Response)
def admin_delete_post(project_id: str) -> Response:
    conn = get_connection()
    try:
        row = conn.execute("SELECT image_url FROM projects WHERE id = ?", (project_id,)).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Post not found")
        donations = conn.execute("SELECT COUNT(*) FROM donations WHERE project_id = ?", (project_id,)).fetchone()[0]
        if donations:
            raise HTTPException(status_code=409, detail="This post has donations. Close it instead of deleting.")
        conn.execute("DELETE FROM impact_updates WHERE project_id = ?", (project_id,))
        conn.execute("DELETE FROM projects WHERE id = ?", (project_id,))
        conn.commit()
        delete_uploaded_image(row["image_url"])
        return Response(status_code=204)
    finally:
        conn.close()

