"""Zero-credit verification of Viro's full pipeline.

The Anthropic client is replaced with a fake that returns canned,
contract-shaped responses — so parsing, persistence, auth, caching,
and the pulse engine are exercised end-to-end without spending a cent.

Run:  source venv/bin/activate && python -m pytest tests/ -q
"""
import json
import os
import re
import uuid
from types import SimpleNamespace

# Force SQLite before main/db import (never touch prod Postgres from tests).
os.environ["DATABASE_URL"] = ""

import main  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402


# ── Fake Anthropic ────────────────────────────────────────────────
class _Msg:
    def __init__(self, text):
        self.content = [SimpleNamespace(type="text", text=text)]


class _FakeMessages:
    def create(self, **kw):
        system = kw.get("system", "") or ""
        user = ""
        for m in kw.get("messages", []):
            if isinstance(m.get("content"), str):
                user = m["content"]
        prompt = system + "\n" + user

        if "onboarding guide" in prompt:
            return _Msg(json.dumps({
                "reply": "Got it — a smoothie bar. What do you track?",
                "state": {
                    "company_name": "TestCo", "industry": "Smoothie bar", "universal_id": "Order",
                    "terminology": {"term_product": "Order", "term_defect": "Issue",
                                    "term_stage": "Stage", "term_issue": "Problem"},
                    "stages": [{"stage_number": 100, "stage_name": "Placed"},
                               {"stage_number": 200, "stage_name": "Made"}],
                    "defect_types": [{"name": "wrong_item", "default_severity": "medium"}],
                    "decisions": ["orders today"], "automations": ["reorder email"],
                    "modules": ["dashboard", "search", "log_issue", "settings"],
                    "entities": [{"name": "Order", "name_plural": "Orders", "icon": "O",
                                  "fields": [{"key": "item", "label": "Item", "type": "text"}]}],
                },
                "options": ["Sounds right"], "ready": True,
            }))

        if "A manager said" in prompt:  # entity dashboard reshape
            ids = re.findall(r'"entity_id":\s*"([^"]+)"', prompt)
            eid = ids[0] if ids else "unknown"
            return _Msg(json.dumps({"is_reshape": True,
                                    "config": {"title": "Reshaped", "sections": [
                                        {"cols": "1fr", "blocks": [{"type": "metric", "entity": eid,
                                                                    "agg": "count", "label": "Total"}]}]},
                                    "message": "Reshaped it."}))

        if "custom operations dashboard" in prompt:
            ids = re.findall(r'"entity_id":\s*"([^"]+)"', prompt)
            eid = ids[0] if ids else "unknown"
            return _Msg(json.dumps({"title": "Ops Overview", "sections": [
                {"cols": "repeat(3, 1fr)",
                 "blocks": [{"type": "metric", "entity": eid, "agg": "count", "label": "Total"}]},
                {"cols": "1fr",
                 "blocks": [{"type": "recent", "entity": eid, "label": "Recent", "limit": 5}]},
            ]}))

        if "automation catalog" in prompt:
            return _Msg(json.dumps({"automations": [
                {"id": "reorder_email", "department": "Suppliers", "icon": "P", "title": "Reorder Email",
                 "description": "Restock everything low", "instruction": "Write a reorder email from low_stock."},
                {"id": "weekly_recap", "department": "Operations", "icon": "R", "title": "Weekly Recap",
                 "description": "Weekly summary", "instruction": "Write a weekly recap."},
            ]}))

        if "wants Viro to automate a document" in prompt:
            return _Msg(json.dumps({"id": "friday_promo", "department": "Marketing", "icon": "M",
                                    "title": "Friday Promo", "description": "Weekly promo email",
                                    "instruction": "Write the Friday promo email."}))

        if "Draft this document" in prompt:
            return _Msg("Subject: Reorder request\n\nPlease send more Oat Milk and Strawberries.")

        if "morning briefing" in prompt:
            return _Msg("Operations are steady with 2 orders in flight. Restock Oat Milk today. Watch Friday demand.")

        return _Msg("OK")


main.client = SimpleNamespace(messages=_FakeMessages())
tc = TestClient(main.app)


# ── Helpers ───────────────────────────────────────────────────────
def _register(company_id):
    email = f"qa_{uuid.uuid4().hex[:10]}@test.dev"
    r = tc.post("/auth/register", json={
        "email": email, "password": "pw-test-123", "first_name": "QA", "last_name": "Bot",
        "role": "manager", "company_id": company_id,
    })
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


def _company():
    r = tc.post("/onboarding/company", json={"name": f"QA {uuid.uuid4().hex[:6]}",
                                             "industry": "Smoothie bar", "universal_id_field": "order"})
    assert r.status_code == 200, r.text
    return r.json()["company_id"]


# ── Auth gate ─────────────────────────────────────────────────────
def test_ai_endpoints_require_auth():
    assert tc.post("/ai/command", json={"message": "x", "company_id": "x"}).status_code == 401
    assert tc.post("/pulse/NOPE").status_code == 401
    assert tc.post("/automations/draft", json={"company_id": "x", "automation_id": "y"}).status_code == 401
    assert tc.get("/entities/dashboard/NOPE").status_code == 401


def test_onboarding_converse_is_public_and_merges_state():
    r = tc.post("/onboarding/converse", json={
        "messages": [{"role": "user", "content": "we sell smoothies"}],
        "state": {"custom_note": "keep-me"},
    })
    assert r.status_code == 200
    d = r.json()
    assert d["reply"] and d["ready"] is True
    assert d["state"]["custom_note"] == "keep-me"          # prior state survives
    assert d["state"]["entities"][0]["name"] == "Order"    # extraction present


def test_onboarding_converse_size_guard():
    r = tc.post("/onboarding/converse", json={
        "messages": [{"role": "user", "content": "x" * 3000}], "state": {},
    })
    assert r.status_code == 200
    assert r.json()["ready"] is False  # guarded, not passed to the model


# ── Full generative flow ──────────────────────────────────────────
def test_generative_flow_end_to_end():
    cid = _company()
    auth = _register(cid)

    # entities + records (one ingredient low)
    r = tc.post(f"/entities/{cid}/bulk", json={"entities": [
        {"name": "Ingredient", "name_plural": "Ingredients", "icon": "I", "fields": [
            {"key": "name", "label": "Name", "type": "text"},
            {"key": "on_hand", "label": "On Hand", "type": "number"},
            {"key": "reorder_at", "label": "Reorder At", "type": "number"},
        ]},
    ]})
    assert r.status_code == 200
    eid = r.json()["created"][0]
    tc.post(f"/records/{cid}/{eid}", json={"data": {"name": "Oat Milk", "on_hand": 1, "reorder_at": 4}})
    tc.post(f"/records/{cid}/{eid}", json={"data": {"name": "Bananas", "on_hand": 9, "reorder_at": 3}})

    # AI-designed dashboard references the real entity
    r = tc.get(f"/entities/dashboard/{cid}", headers=auth)
    cfg = r.json()["config"]
    assert cfg["sections"], r.text
    assert cfg["sections"][0]["blocks"][0]["entity"] == eid

    # catalog get-or-generate, then draft → document persisted
    cat = tc.get(f"/automations/catalog/{cid}", headers=auth).json()
    assert any(a["id"] == "reorder_email" for a in cat["automations"])
    d = tc.post("/automations/draft", json={"company_id": cid, "automation_id": "reorder_email"},
                headers=auth).json()
    assert d["doc_id"] and "Reorder" in d["body"]
    docs = tc.get(f"/documents/{cid}").json()
    assert docs and docs[0]["title"] == "Reorder Email"

    # add-your-own automation grows the catalog
    added = tc.post(f"/automations/catalog/{cid}/add", json={"description": "friday promo email"},
                    headers=auth).json()
    assert added["automation"]["id"] == "friday_promo"
    assert len(added["catalog"]["automations"]) == 3

    # document status update
    tc.put(f"/documents/{d['doc_id']}/status", json={"status": "approved"})
    assert tc.get(f"/documents/one/{d['doc_id']}").json()["status"] == "approved"

    # entity dashboard reshape persists
    rs = tc.post(f"/entities/dashboard/{cid}/reshape",
                 json={"instruction": "just totals", "current_config": {}}, headers=auth).json()
    assert rs["is_reshape"] is True
    assert tc.get(f"/entities/dashboard/{cid}", headers=auth).json()["config"]["title"] == "Reshaped"


def test_pulse_fires_drafts_and_dedupes():
    cid = _company()
    auth = _register(cid)
    r = tc.post(f"/entities/{cid}/bulk", json={"entities": [
        {"name": "Ingredient", "name_plural": "Ingredients", "icon": "I", "fields": [
            {"key": "name", "label": "Name", "type": "text"},
            {"key": "on_hand", "label": "On Hand", "type": "number"},
            {"key": "reorder_at", "label": "Reorder At", "type": "number"},
        ]},
    ]})
    eid = r.json()["created"][0]
    tc.post(f"/records/{cid}/{eid}", json={"data": {"name": "Spinach", "on_hand": 0, "reorder_at": 2}})
    tc.get(f"/automations/catalog/{cid}", headers=auth)  # ensure catalog exists → pulse can draft

    p1 = tc.post(f"/pulse/{cid}", headers=auth).json()
    assert len(p1["events"]) == 1
    assert p1["events"][0]["doc_id"], "pulse should auto-draft when the catalog matches"
    assert "1 ingredient at or below" in p1["events"][0]["reason"]  # singularized

    p2 = tc.post(f"/pulse/{cid}", headers=auth).json()
    assert p2["events"] == []  # deduped

    # state change → fires again
    rec = tc.get(f"/records/{cid}/{eid}").json()[0]["record_id"]
    tc.put(f"/records/{rec}", json={"data": {"name": "Spinach", "on_hand": 10, "reorder_at": 2}})
    tc.post(f"/records/{cid}/{eid}", json={"data": {"name": "Kale", "on_hand": 1, "reorder_at": 5}})
    p3 = tc.post(f"/pulse/{cid}", headers=auth).json()
    assert len(p3["events"]) == 1 and "Kale" in p3["events"][0]["reason"]

    notes = tc.get(f"/notifications/{cid}").json()
    assert any("Viro drafted" in n["title"] for n in notes)


def test_records_crud_and_entity_cascade():
    cid = _company()
    r = tc.post(f"/entities/{cid}/bulk", json={"entities": [
        {"name": "Order", "name_plural": "Orders", "icon": "O",
         "fields": [{"key": "item", "label": "Item", "type": "text"}]},
    ]})
    eid = r.json()["created"][0]
    tc.post(f"/records/{cid}/{eid}", json={"data": {"item": "Berry Blast"}})
    recs = tc.get(f"/records/{cid}/{eid}").json()
    assert recs[0]["item"] == "Berry Blast"
    tc.put(f"/records/{recs[0]['record_id']}", json={"data": {"item": "Green Machine"}})
    assert tc.get(f"/records/{cid}/{eid}").json()[0]["item"] == "Green Machine"
    tc.delete(f"/entities/{eid}")
    assert tc.get(f"/records/{cid}/{eid}").json() == []  # cascade


def test_briefing_contract_and_daily_cache():
    cid = _company()
    auth = _register(cid)
    assert tc.get(f"/ai/briefing/{cid}").status_code == 401  # auth-gated
    r = tc.post(f"/entities/{cid}/bulk", json={"entities": [
        {"name": "Order", "name_plural": "Orders", "icon": "O",
         "fields": [{"key": "item", "label": "Item", "type": "text"}]},
    ]})
    eid = r.json()["created"][0]
    tc.post(f"/records/{cid}/{eid}", json={"data": {"item": "Berry Blast"}})
    calls = {"n": 0}
    real = main.client.messages.create

    def counting(**kw):
        calls["n"] += 1
        return real(**kw)

    main.client.messages.create = counting
    try:
        r1 = tc.get(f"/ai/briefing/{cid}", headers=auth).json()
        r2 = tc.get(f"/ai/briefing/{cid}", headers=auth).json()
        assert "Restock Oat Milk" in r1["briefing"]
        assert r1 == r2
        assert calls["n"] == 1, "same-day briefing must be served from cache"
    finally:
        main.client.messages.create = real


def test_page_insight_cache_prevents_second_ai_call():
    cid = _company()
    auth = _register(cid)
    calls = {"n": 0}
    real = main.client.messages.create

    def counting(**kw):
        calls["n"] += 1
        return real(**kw)

    main.client.messages.create = counting
    try:
        body = {"company_id": cid, "page": "Analytics", "summary": {"total": 5}}
        r1 = tc.post("/ai/page-insight", json=body, headers=auth)
        r2 = tc.post("/ai/page-insight", json=body, headers=auth)
        assert r1.json() == r2.json()
        assert calls["n"] == 1, "second identical view must be served from cache"
    finally:
        main.client.messages.create = real
