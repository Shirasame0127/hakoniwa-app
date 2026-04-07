#!/usr/bin/env python3
"""
初期データシーディングスクリプト

本番・テスト共用のマスタデータを投入する。
実行: docker compose exec -T backend python scripts/seed.py
  または: just seed
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.shared.db import SessionLocal, engine
from app.shared.models import Base, User, GardenState, GardenObject, FoodItem, ExerciseLog, HakoniwaObject
from scripts.voxel_data import CATALOG
import uuid
from datetime import datetime, timedelta


def seed():
    print("📊 Creating tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # ── ユーザー ──────────────────────────────────
        print("👤 Creating sample user...")
        user_id = uuid.uuid4()
        user = User(
            id=user_id,
            email="demo@hakoniwa.app",
            password_hash="$2b$12$demo_hash_not_for_production",
        )
        db.add(user)
        db.flush()

        # ── 箱庭状態 ──────────────────────────────────
        print("🌍 Creating garden state...")
        db.add(GardenState(
            user_id=user_id,
            level=3,
            exp=450,
            environment={"theme": "grass", "size": 10, "season": "spring"},
            city_name="Tokyo",
        ))

        # ── 箱庭オブジェクト（配置済み） ─────────────
        print("🌳 Adding garden objects...")
        for i, (obj_type, cat) in enumerate([
            ("oak_large", "plant"), ("campfire", "furniture"), ("cabin_small", "building")
        ]):
            db.add(GardenObject(
                user_id=user_id,
                type=obj_type,
                position={"x": i * 3 - 3, "y": 0, "z": i - 1},
                model_path=f"/models/{cat}/{obj_type}.glb",
            ))

        # ── 食材 ──────────────────────────────────────
        print("🍎 Adding food items...")
        for name, qty, days in [
            ("にんじん", 3, 7), ("トマト", 5, 5), ("りんご", 2, 10),
            ("鶏肉", 1, 3), ("バナナ", 4, 6),
        ]:
            db.add(FoodItem(
                user_id=user_id,
                name=name,
                quantity=qty,
                expires_at=datetime.now().date() + timedelta(days=days),
            ))

        # ── 運動ログ ──────────────────────────────────
        print("🏃 Adding exercise logs...")
        for exe_type, duration, days_ago in [
            ("running", 30, 0), ("walking", 45, 1), ("cycling", 60, 2),
            ("yoga", 40, 3), ("swimming", 50, 4),
        ]:
            db.add(ExerciseLog(
                user_id=user_id,
                type=exe_type,
                duration_min=duration,
                logged_at=datetime.now() - timedelta(days=days_ago),
            ))

        db.commit()
        print(f"   User ID: {user_id}\n")

        # ── 箱庭オブジェクトマスタ（図鑑データ） ──────
        print("🧊 Adding HakoniwaObjects (voxel GLB catalog)...")
        for item in CATALOG:
            obj = HakoniwaObject(
                id=uuid.uuid4(),
                catalog_id=item["catalog_id"],
                name=item["name"],
                name_en=item.get("name_en"),
                category=item["category"],
                subcategory=item.get("subcategory"),
                description=item["description"],
                flavor_text=item["flavor_text"],
                rarity=item["rarity"],
                locations=item.get("locations"),
                seasons=item.get("seasons"),
                obtain_method=item.get("obtain_method"),
                model_path=f"/models/{item['model_file']}",
                size_w=item["size"][0],
                size_h=item["size"][1],
                size_d=item["size"][2],
                uploaded_by=user_id,
            )
            db.add(obj)
            print(f"   [{item['catalog_id']}] {item['name']} ({item['rarity']})")

        db.commit()
        print(f"\n✅ Seed completed! {len(CATALOG)} objects registered.")
        print(f"   User: demo@hakoniwa.app / ID: {user_id}")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
