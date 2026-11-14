import json
import sqlite3
import uuid
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Dict, Any, List
from .config import settings

logger = logging.getLogger("krishisaathi.database")

# Try to initialize Supabase client if valid credentials are provided
supabase_client = None
using_supabase = False

if settings.SUPABASE_URL and settings.SUPABASE_KEY and "your-project" not in settings.SUPABASE_URL:
    try:
        from supabase import create_client
        supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        using_supabase = True
        logger.info("Supabase client initialized successfully.")
    except Exception as e:
        logger.warning(f"Could not connect to Supabase: {e}. Falling back to local database engine.")
        using_supabase = False
else:
    logger.info("Supabase credentials not configured. Using local PostgreSQL-compatible database engine.")


class DatabaseManager:
    """
    Unified database manager for KrishiSaathi.
    Directs operations to Supabase PostgreSQL when credentials exist,
    or runs on the local database engine with identical schema and queries.
    """

    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = db_path or settings.SQLITE_DB_PATH
        self.init_local_db()

    def get_connection(self):
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON;")
        return conn

    def init_local_db(self):
        """Create tables matching the Supabase PostgreSQL schema."""
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

        with self.get_connection() as conn:
            cursor = conn.cursor()

            # 1. Farmers Table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS farmers (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    mobile_number TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    village TEXT,
                    district TEXT NOT NULL,
                    state TEXT NOT NULL,
                    preferred_language TEXT NOT NULL DEFAULT 'en',
                    created_at TEXT NOT NULL
                );
            """)

            # 2. Soil Reports Table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS soil_reports (
                    id TEXT PRIMARY KEY,
                    farmer_id TEXT NOT NULL,
                    report_name TEXT NOT NULL,
                    file_url TEXT,
                    upload_date TEXT NOT NULL,
                    extracted_soil_data TEXT NOT NULL,
                    FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE
                );
            """)

            # 3. Recommendations Table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS recommendations (
                    id TEXT PRIMARY KEY,
                    farmer_id TEXT NOT NULL,
                    soil_report_id TEXT,
                    fertilizer_details TEXT NOT NULL,
                    crop_details TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE,
                    FOREIGN KEY (soil_report_id) REFERENCES soil_reports(id) ON DELETE CASCADE
                );
            """)

            # 4. Chat History Table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS chat_history (
                    id TEXT PRIMARY KEY,
                    farmer_id TEXT NOT NULL,
                    message TEXT NOT NULL,
                    response TEXT NOT NULL,
                    language TEXT NOT NULL DEFAULT 'en',
                    timestamp TEXT NOT NULL,
                    FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE
                );
            """)

            # Ensure default demo farmer exists for seamless testing and local demo usage
            cursor.execute("SELECT id FROM farmers WHERE mobile_number = '9876543210'")
            if not cursor.fetchone():
                from .security import hash_password
                pw_hash = hash_password("password123")
                demo_id = "demo-farmer-punjab"
                created_at = datetime.now(timezone.utc).isoformat()
                cursor.execute(
                    """
                    INSERT INTO farmers (id, name, mobile_number, password_hash, village, district, state, preferred_language, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (demo_id, "Ramesh Kumar", "9876543210", pw_hash, "Kila Raipur", "Ludhiana", "Punjab", "en", created_at)
                )

                # Also insert initial soil report for demo farmer
                default_soil_data = json.dumps({
                    "healthScore": 76,
                    "overallStatus": "Neutral Soil • Low Nitrogen • High Potassium",
                    "soilType": "Alluvial Sandy Loam",
                    "ph": {"value": 7.2, "rating": "Neutral"},
                    "nitrogen": {"symbol": "N", "value": 185.0, "unit": "kg/ha", "rating": "Low"},
                    "phosphorus": {"symbol": "P", "value": 18.4, "unit": "kg/ha", "rating": "Medium"},
                    "potassium": {"symbol": "K", "value": 295.0, "unit": "kg/ha", "rating": "High"},
                    "organic_carbon": {"value": 0.48, "unit": "%", "rating": "Low"},
                    "ec": {"value": 0.38, "unit": "dS/m", "rating": "Normal"},
                    "micronutrients": {
                        "zinc": {"symbol": "Zn", "value": 0.45, "unit": "ppm", "rating": "Low"},
                        "sulphur": {"symbol": "S", "value": 12.5, "unit": "ppm", "rating": "Medium"}
                    }
                })
                cursor.execute(
                    """
                    INSERT INTO soil_reports (id, farmer_id, report_name, file_url, upload_date, extracted_soil_data)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    ("demo-report-punjab", demo_id, "North Field Soil Health Card", "/uploads/sample_soil_report.pdf", created_at, default_soil_data)
                )

            # Ensure default demo farmer 2 (Maharashtra) exists
            cursor.execute("SELECT id FROM farmers WHERE mobile_number = '9812345678'")
            if not cursor.fetchone():
                from .security import hash_password
                pw_hash_mh = hash_password("password123")
                demo_mh_id = "demo-farmer-mh"
                created_at_mh = datetime.now(timezone.utc).isoformat()
                cursor.execute(
                    """
                    INSERT INTO farmers (id, name, mobile_number, password_hash, village, district, state, preferred_language, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (demo_mh_id, "Suresh Patil", "9812345678", pw_hash_mh, "Baramati", "Pune", "Maharashtra", "mr", created_at_mh)
                )
            conn.commit()

    # ==========================================================================
    # FARMERS OPERATIONS
    # ==========================================================================

    def create_farmer(self, farmer_data: Dict[str, Any]) -> Dict[str, Any]:
        farmer_id = str(uuid.uuid4())
        created_at = datetime.now(timezone.utc).isoformat()

        if using_supabase and supabase_client:
            try:
                payload = {
                    "id": farmer_id,
                    "name": farmer_data["name"],
                    "mobile_number": farmer_data["mobile_number"],
                    "password_hash": farmer_data["password_hash"],
                    "village": farmer_data.get("village"),
                    "district": farmer_data["district"],
                    "state": farmer_data["state"],
                    "preferred_language": farmer_data.get("preferred_language", "en"),
                    "created_at": created_at
                }
                res = supabase_client.table("farmers").insert(payload).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Supabase create_farmer failed: {e}. Falling back to local DB.")

        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO farmers (id, name, mobile_number, password_hash, village, district, state, preferred_language, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    farmer_id,
                    farmer_data["name"],
                    farmer_data["mobile_number"],
                    farmer_data["password_hash"],
                    farmer_data.get("village"),
                    farmer_data["district"],
                    farmer_data["state"],
                    farmer_data.get("preferred_language", "en"),
                    created_at
                )
            )
            conn.commit()
            return self.get_farmer_by_id(farmer_id)

    def get_farmer_by_mobile(self, mobile_number: str) -> Optional[Dict[str, Any]]:
        if using_supabase and supabase_client:
            try:
                res = supabase_client.table("farmers").select("*").eq("mobile_number", mobile_number).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Supabase get_farmer_by_mobile error: {e}")

        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM farmers WHERE mobile_number = ?", (mobile_number,))
            row = cursor.fetchone()
            return dict(row) if row else None

    def get_farmer_by_id(self, farmer_id: str) -> Optional[Dict[str, Any]]:
        if using_supabase and supabase_client:
            try:
                res = supabase_client.table("farmers").select("*").eq("id", farmer_id).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Supabase get_farmer_by_id error: {e}")

        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM farmers WHERE id = ?", (farmer_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    def update_farmer_profile(self, farmer_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        # Filter out None values
        valid_updates = {k: v for k, v in update_data.items() if v is not None}
        if not valid_updates:
            return self.get_farmer_by_id(farmer_id)

        if using_supabase and supabase_client:
            try:
                res = supabase_client.table("farmers").update(valid_updates).eq("id", farmer_id).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Supabase update_farmer_profile error: {e}")

        set_clause = ", ".join([f"{k} = ?" for k in valid_updates.keys()])
        values = list(valid_updates.values()) + [farmer_id]

        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(f"UPDATE farmers SET {set_clause} WHERE id = ?", values)
            conn.commit()
            return self.get_farmer_by_id(farmer_id)

    # ==========================================================================
    # SOIL REPORTS OPERATIONS
    # ==========================================================================

    def create_soil_report(self, farmer_id: str, report_data: Dict[str, Any]) -> Dict[str, Any]:
        report_id = str(uuid.uuid4())
        upload_date = datetime.now(timezone.utc).isoformat()
        soil_data = report_data.get("extracted_soil_data", {})

        if using_supabase and supabase_client:
            try:
                payload = {
                    "id": report_id,
                    "farmer_id": farmer_id,
                    "report_name": report_data["report_name"],
                    "file_url": report_data.get("file_url"),
                    "upload_date": upload_date,
                    "extracted_soil_data": soil_data
                }
                res = supabase_client.table("soil_reports").insert(payload).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Supabase create_soil_report error: {e}")

        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO soil_reports (id, farmer_id, report_name, file_url, upload_date, extracted_soil_data)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    report_id,
                    farmer_id,
                    report_data["report_name"],
                    report_data.get("file_url"),
                    upload_date,
                    json.dumps(soil_data)
                )
            )
            conn.commit()
            return self.get_soil_report_by_id(report_id)

    def get_soil_reports_by_farmer(self, farmer_id: str) -> List[Dict[str, Any]]:
        """Fetch all reports belonging strictly to the authenticated farmer."""
        if using_supabase and supabase_client:
            try:
                res = supabase_client.table("soil_reports")\
                    .select("*")\
                    .eq("farmer_id", farmer_id)\
                    .order("upload_date", desc=True)\
                    .execute()
                return res.data or []
            except Exception as e:
                logger.error(f"Supabase get_soil_reports_by_farmer error: {e}")

        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM soil_reports WHERE farmer_id = ? ORDER BY upload_date DESC", 
                (farmer_id,)
            )
            rows = cursor.fetchall()
            results = []
            for r in rows:
                item = dict(r)
                if isinstance(item.get("extracted_soil_data"), str):
                    try:
                        item["extracted_soil_data"] = json.loads(item["extracted_soil_data"])
                    except Exception:
                        item["extracted_soil_data"] = {}
                results.append(item)
            return results

    def get_soil_report_by_id(self, report_id: str) -> Optional[Dict[str, Any]]:
        if using_supabase and supabase_client:
            try:
                res = supabase_client.table("soil_reports").select("*").eq("id", report_id).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Supabase get_soil_report_by_id error: {e}")

        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM soil_reports WHERE id = ?", (report_id,))
            row = cursor.fetchone()
            if not row:
                return None
            item = dict(row)
            if isinstance(item.get("extracted_soil_data"), str):
                try:
                    item["extracted_soil_data"] = json.loads(item["extracted_soil_data"])
                except Exception:
                    item["extracted_soil_data"] = {}
            return item

    def delete_soil_report(self, report_id: str, farmer_id: str) -> bool:
        """Delete report strictly verifying farmer ownership."""
        if using_supabase and supabase_client:
            try:
                res = supabase_client.table("soil_reports")\
                    .delete()\
                    .eq("id", report_id)\
                    .eq("farmer_id", farmer_id)\
                    .execute()
                return True
            except Exception as e:
                logger.error(f"Supabase delete_soil_report error: {e}")

        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM soil_reports WHERE id = ? AND farmer_id = ?", (report_id, farmer_id))
            conn.commit()
            return cursor.rowcount > 0

    # ==========================================================================
    # RECOMMENDATIONS OPERATIONS
    # ==========================================================================

    def create_recommendation(self, farmer_id: str, rec_data: Dict[str, Any]) -> Dict[str, Any]:
        report_id = rec_data.get("soil_report_id")
        created_at = datetime.now(timezone.utc).isoformat()
        fert_details = rec_data.get("fertilizer_details", {})
        crop_details = rec_data.get("crop_details", [])

        # Check if an existing recommendation already exists for this report to update it
        existing = self.get_recommendation_by_report(report_id, farmer_id) if report_id else None
        rec_id = existing["id"] if existing else str(uuid.uuid4())

        if using_supabase and supabase_client:
            try:
                payload = {
                    "id": rec_id,
                    "farmer_id": farmer_id,
                    "soil_report_id": report_id,
                    "fertilizer_details": fert_details,
                    "crop_details": crop_details,
                    "created_at": created_at
                }
                if existing:
                    res = supabase_client.table("recommendations").update(payload).eq("id", rec_id).execute()
                else:
                    res = supabase_client.table("recommendations").insert(payload).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Supabase create_recommendation error: {e}")

        with self.get_connection() as conn:
            cursor = conn.cursor()
            if existing:
                cursor.execute(
                    """
                    UPDATE recommendations 
                    SET fertilizer_details = ?, crop_details = ?, created_at = ?
                    WHERE id = ? AND farmer_id = ?
                    """,
                    (json.dumps(fert_details), json.dumps(crop_details), created_at, rec_id, farmer_id)
                )
            else:
                cursor.execute(
                    """
                    INSERT INTO recommendations (id, farmer_id, soil_report_id, fertilizer_details, crop_details, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (rec_id, farmer_id, report_id, json.dumps(fert_details), json.dumps(crop_details), created_at)
                )
            conn.commit()
            return self.get_recommendation_by_id(rec_id)

    def get_recommendation_by_id(self, rec_id: str) -> Optional[Dict[str, Any]]:
        if using_supabase and supabase_client:
            try:
                res = supabase_client.table("recommendations").select("*").eq("id", rec_id).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Supabase get_recommendation_by_id error: {e}")

        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM recommendations WHERE id = ?", (rec_id,))
            row = cursor.fetchone()
            if not row:
                return None
            item = dict(row)
            for col in ["fertilizer_details", "crop_details"]:
                if isinstance(item.get(col), str):
                    try:
                        item[col] = json.loads(item[col])
                    except Exception:
                        item[col] = {} if col == "fertilizer_details" else []
            return item

    def get_recommendations_by_farmer(self, farmer_id: str) -> List[Dict[str, Any]]:
        if using_supabase and supabase_client:
            try:
                res = supabase_client.table("recommendations")\
                    .select("*")\
                    .eq("farmer_id", farmer_id)\
                    .order("created_at", desc=True)\
                    .execute()
                return res.data or []
            except Exception as e:
                logger.error(f"Supabase get_recommendations_by_farmer error: {e}")

        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM recommendations WHERE farmer_id = ? ORDER BY created_at DESC", 
                (farmer_id,)
            )
            rows = cursor.fetchall()
            results = []
            for r in rows:
                item = dict(r)
                for col in ["fertilizer_details", "crop_details"]:
                    if isinstance(item.get(col), str):
                        try:
                            item[col] = json.loads(item[col])
                        except Exception:
                            item[col] = {} if col == "fertilizer_details" else []
                results.append(item)
            return results

    def get_recommendation_by_report(self, report_id: str, farmer_id: str) -> Optional[Dict[str, Any]]:
        if using_supabase and supabase_client:
            try:
                res = supabase_client.table("recommendations")\
                    .select("*")\
                    .eq("soil_report_id", report_id)\
                    .eq("farmer_id", farmer_id)\
                    .execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Supabase get_recommendation_by_report error: {e}")

        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM recommendations WHERE soil_report_id = ? AND farmer_id = ?",
                (report_id, farmer_id)
            )
            row = cursor.fetchone()
            if not row:
                return None
            item = dict(row)
            for col in ["fertilizer_details", "crop_details"]:
                if isinstance(item.get(col), str):
                    try:
                        item[col] = json.loads(item[col])
                    except Exception:
                        item[col] = {} if col == "fertilizer_details" else []
            return item

    # ==========================================================================
    # CHAT HISTORY OPERATIONS
    # ==========================================================================

    def create_chat_message(self, farmer_id: str, message: str, response: str, language: str = "en") -> Dict[str, Any]:
        msg_id = str(uuid.uuid4())
        timestamp = datetime.now(timezone.utc).isoformat()

        if using_supabase and supabase_client:
            try:
                payload = {
                    "id": msg_id,
                    "farmer_id": farmer_id,
                    "message": message,
                    "response": response,
                    "language": language,
                    "timestamp": timestamp
                }
                res = supabase_client.table("chat_history").insert(payload).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Supabase create_chat_message error: {e}")

        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO chat_history (id, farmer_id, message, response, language, timestamp)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (msg_id, farmer_id, message, response, language, timestamp)
            )
            conn.commit()
            return {
                "id": msg_id,
                "farmer_id": farmer_id,
                "message": message,
                "response": response,
                "language": language,
                "timestamp": timestamp
            }

    def get_chat_history_by_farmer(self, farmer_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        if using_supabase and supabase_client:
            try:
                res = supabase_client.table("chat_history")\
                    .select("*")\
                    .eq("farmer_id", farmer_id)\
                    .order("timestamp", desc=False)\
                    .limit(limit)\
                    .execute()
                return res.data or []
            except Exception as e:
                logger.error(f"Supabase get_chat_history_by_farmer error: {e}")

        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM chat_history WHERE farmer_id = ? ORDER BY timestamp ASC LIMIT ?",
                (farmer_id, limit)
            )
            rows = cursor.fetchall()
            return [dict(r) for r in rows]

    def clear_chat_history_by_farmer(self, farmer_id: str) -> bool:
        if using_supabase and supabase_client:
            try:
                supabase_client.table("chat_history").delete().eq("farmer_id", farmer_id).execute()
                return True
            except Exception as e:
                logger.error(f"Supabase clear_chat_history_by_farmer error: {e}")

        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM chat_history WHERE farmer_id = ?", (farmer_id,))
            conn.commit()
            return True


# Global database instance
db = DatabaseManager()
