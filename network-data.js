// SAMPLE dev fixture — FICTIONAL data for local preview only. The FDI engine
// OVERWRITES this per-build with real Affinity data (fetch-affinity-network.mjs,
// run as a workflow step after Phase 10). Names/companies/scores here are invented;
// do not treat as real relationships. Schema mirrors the engine's // Sample covers every relationship label the map can show: employee, investor
// (venture arm), board member and advisor. Connector location is the object
// shape Affinity returns.
window.NETWORK_DATA = {
  "schema_version": 1,
  "generated_at": "2026-07-15T00:00:00.000Z",
  "hub": "Primary",
  "build_status": "ok",
  "summary": {
    "companies_total": 4,
    "companies_with_path": 2,
    "coverage_pct": 50,
    "total_relationships": 181,
    "primary_connectors": [
      "Dana Cole",
      "Robin Vega",
      "Sky Morgan"
    ]
  },
  "connectors": {
    "Robin Vega": {
      "id": 900001,
      "title": "Partner",
      "org": "Primary Venture Partners",
      "linkedin": "https://linkedin.com/in/example-robin-vega",
      "location": {
        "streetAddress": null,
        "city": "New York",
        "state": "New York",
        "country": "United States",
        "continent": null
      }
    },
    "Dana Cole": {
      "id": 900002,
      "title": "Principal",
      "org": "Primary Venture Partners",
      "linkedin": "https://linkedin.com/in/example-dana-cole",
      "location": "New York, NY"
    },
    "Sky Morgan": {
      "id": 900003,
      "title": "Associate",
      "org": "Primary Venture Partners",
      "linkedin": "https://linkedin.com/in/example-sky-morgan",
      "location": "Boston, MA"
    }
  },
  "companies": [
    {
      "company": "Acme Cloud",
      "domain": "acmecloud.example",
      "affinity_id": 224000001,
      "affinity_name": "Acme Cloud",
      "status": "resolved",
      "total_paths": 134,
      "shown_paths": 5,
      "best_score": 97,
      "paths": [
        {
          "connector": "Robin Vega",
          "connector_id": 900001,
          "connector_email": "robin@primary.example",
          "contact_name": "Jamie Fielder",
          "contact_id": 151000001,
          "contact_email": "jamie.fielder@acmecloud.example",
          "contact_title": "Chief Information Security Officer",
          "contact_affiliation": "Acme Cloud",
          "at_target_company": true,
          "seniority": "C-Level",
          "linkedin_url": "https://linkedin.com/in/example-jamie-fielder",
          "type": "interaction",
          "has_interaction_data": true,
          "score": 97,
          "linkedin_connected": false,
          "linkedin_connected_on": null,
          "last_contact": "2026-07-09",
          "history": {
            "first_contact": "2023-05-25",
            "first_email": {
              "date": "2023-05-25",
              "label": "Intro from the Primary team",
              "from_internal": true,
              "from_name": "Robin Vega",
              "with_connector": true
            },
            "last_email": {
              "date": "2026-07-09",
              "label": null,
              "from_internal": false,
              "from_name": "Jamie Fielder",
              "with_connector": true
            },
            "first_meeting": {
              "date": "2023-06-26",
              "label": "Intro call",
              "from_internal": true,
              "from_name": "Robin Vega",
              "with_connector": true
            },
            "last_meeting": {
              "date": "2026-06-25",
              "label": "Advisory sync",
              "from_internal": false,
              "from_name": "Jamie Fielder",
              "with_connector": true
            },
            "next_meeting": {
              "date": "2026-08-27",
              "label": "Advisory sync",
              "from_internal": null,
              "from_name": null,
              "with_connector": true
            },
            "last_chat": null
          },
          "enrichment_status": "ok",
          "relationship": "employee",
          "relationship_label": "Works at Acme Cloud"
        },
        {
          "connector": "Dana Cole",
          "connector_id": 900002,
          "connector_email": "dana@primary.example",
          "contact_name": "Jamie Fielder",
          "contact_id": 151000001,
          "contact_email": "jamie.fielder@acmecloud.example",
          "contact_title": "Chief Information Security Officer",
          "contact_affiliation": "Acme Cloud",
          "at_target_company": true,
          "seniority": "C-Level",
          "linkedin_url": "https://linkedin.com/in/example-jamie-fielder",
          "type": "interaction",
          "has_interaction_data": true,
          "score": 71,
          "linkedin_connected": false,
          "linkedin_connected_on": null,
          "last_contact": "2026-04-15",
          "history": {
            "first_contact": "2024-02-01",
            "first_email": {
              "date": "2024-02-01",
              "label": "Intro",
              "from_internal": true,
              "from_name": "Dana Cole",
              "with_connector": true
            },
            "last_email": {
              "date": "2026-04-15",
              "label": null,
              "from_internal": true,
              "from_name": "Dana Cole",
              "with_connector": true
            },
            "first_meeting": null,
            "last_meeting": null,
            "next_meeting": null,
            "last_chat": null
          },
          "enrichment_status": "ok",
          "relationship": "employee",
          "relationship_label": "Works at Acme Cloud"
        },
        {
          "connector": "Dana Cole",
          "connector_id": 900002,
          "connector_email": "dana@primary.example",
          "contact_name": "Morgan Ash",
          "contact_id": 151000002,
          "contact_email": "morgan.ash@example.com",
          "contact_title": "Operating Partner, Example Growth",
          "contact_affiliation": "Example Growth",
          "at_target_company": false,
          "seniority": null,
          "linkedin_url": null,
          "type": "interaction",
          "has_interaction_data": true,
          "score": 82,
          "linkedin_connected": false,
          "linkedin_connected_on": null,
          "last_contact": "2026-06-01",
          "history": {
            "first_contact": "2024-01-10",
            "first_email": {
              "date": "2024-01-10",
              "label": "Catching up",
              "from_internal": false,
              "from_name": "Morgan Ash",
              "with_connector": true
            },
            "last_email": {
              "date": "2026-06-01",
              "label": "Re: intro",
              "from_internal": true,
              "from_name": "Dana Cole",
              "with_connector": true
            },
            "first_meeting": null,
            "last_meeting": null,
            "next_meeting": null,
            "last_chat": null
          },
          "enrichment_status": "ok",
          "relationship": "board",
          "relationship_label": "Board member, Acme Cloud",
          "rank": 0
        },
        {
          "connector": "Robin Vega",
          "connector_id": 900001,
          "connector_email": "robin@primary.example",
          "contact_name": "Toni Delgado",
          "contact_id": 151000003,
          "contact_email": "toni.delgado@northstarcap.example",
          "contact_title": "Investment Director",
          "contact_affiliation": "Acme Ventures",
          "at_target_company": true,
          "seniority": "Director",
          "linkedin_url": "https://linkedin.com/in/example-toni-delgado",
          "type": "interaction",
          "has_interaction_data": true,
          "score": 32,
          "linkedin_connected": false,
          "linkedin_connected_on": null,
          "last_contact": "2026-05-01",
          "enrichment_status": "ok",
          "relationship": "investor",
          "relationship_label": "Investor at Acme Ventures",
          "rank": 3
        },
        {
          "connector": "Sky Morgan",
          "connector_id": 900003,
          "connector_email": "sky@primary.example",
          "contact_name": "Devin Park",
          "contact_id": 151000004,
          "contact_email": "devin.park@acmecloud.example",
          "contact_title": "Staff Engineer",
          "contact_affiliation": "Acme Cloud",
          "at_target_company": true,
          "seniority": "Senior",
          "linkedin_url": "https://linkedin.com/in/example-devin-park",
          "type": "linkedin",
          "has_interaction_data": false,
          "score": null,
          "linkedin_connected": true,
          "linkedin_connected_on": "2024-03-04",
          "last_contact": null,
          "enrichment_status": "ok",
          "relationship": "employee",
          "relationship_label": "Works at Acme Cloud"
        }
      ]
    },
    {
      "company": "Nimbus Data",
      "domain": "nimbusdata.example",
      "affinity_id": 330000001,
      "affinity_name": "Nimbus Data",
      "status": "resolved",
      "total_paths": 47,
      "shown_paths": 3,
      "best_score": 88,
      "paths": [
        {
          "connector": "Dana Cole",
          "connector_id": 900002,
          "connector_email": "dana@primary.example",
          "contact_name": "Riley Chen",
          "contact_id": 400001,
          "contact_email": "riley@nimbusdata.example",
          "contact_title": "VP of Finance",
          "contact_affiliation": "Nimbus Data",
          "at_target_company": true,
          "seniority": "VP",
          "linkedin_url": "https://linkedin.com/in/example-riley-chen",
          "type": "interaction",
          "has_interaction_data": true,
          "score": 88,
          "linkedin_connected": false,
          "linkedin_connected_on": null,
          "last_contact": "2026-06-30",
          "history": {
            "first_contact": "2025-02-01",
            "first_email": {
              "date": "2025-02-01",
              "label": "Introduction",
              "from_internal": true,
              "from_name": "Dana Cole",
              "with_connector": true
            },
            "last_email": {
              "date": "2026-06-30",
              "label": "Following up",
              "from_internal": true,
              "from_name": "Dana Cole",
              "with_connector": true
            },
            "first_meeting": null,
            "last_meeting": null,
            "next_meeting": null,
            "last_chat": null
          },
          "enrichment_status": "ok",
          "relationship": "employee",
          "relationship_label": "Works at Nimbus Data"
        },
        {
          "connector": "Robin Vega",
          "connector_id": 900001,
          "connector_email": "robin@primary.example",
          "contact_name": "Alex Okafor",
          "contact_id": 400002,
          "contact_email": "alex@nimbusdata.example",
          "contact_title": "Professor of Data Systems, Example University",
          "contact_affiliation": "Example University",
          "at_target_company": false,
          "seniority": null,
          "linkedin_url": "https://linkedin.com/in/example-alex-okafor",
          "type": "interaction",
          "has_interaction_data": true,
          "score": 64,
          "linkedin_connected": true,
          "linkedin_connected_on": "2023-09-12",
          "last_contact": "2026-04-10",
          "enrichment_status": "ok",
          "relationship": "advisor",
          "relationship_label": "Advisor to Nimbus Data (not an employee)",
          "rank": 0
        },
        {
          "connector": "Sky Morgan",
          "connector_id": 900003,
          "connector_email": "sky@primary.example",
          "contact_name": "Jesse Lin",
          "contact_id": 400004,
          "contact_email": "jesse@nimbusdata.example",
          "contact_title": "Senior PM",
          "contact_affiliation": "Nimbus Data",
          "at_target_company": true,
          "seniority": "Senior",
          "linkedin_url": null,
          "type": "linkedin",
          "has_interaction_data": false,
          "score": null,
          "linkedin_connected": true,
          "linkedin_connected_on": "2025-01-20",
          "last_contact": null,
          "enrichment_status": "ok",
          "relationship": "employee",
          "relationship_label": "Works at Nimbus Data"
        }
      ]
    },
    {
      "company": "Vertex Health",
      "domain": "vertexhealth.example",
      "affinity_id": 330000002,
      "affinity_name": "Vertex Health",
      "status": "no_relationships",
      "total_paths": 0,
      "paths": []
    },
    {
      "company": "Orbit Logistics",
      "domain": "notacompany-xyz.example",
      "status": "not_found",
      "total_paths": 0,
      "paths": []
    }
  ]
};
