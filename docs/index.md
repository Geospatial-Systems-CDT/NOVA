# NOVA Technical Documentation

This documentation site contains technical and user-facing reference material for NOVA.

## Purpose and Scope of the System

NOVA is a geospatial decision-support platform used to assess location suitability for renewable energy infrastructure on the Isle of Wight, with compatibility to be expanded to the rest of the United Kingdom. It combines map-based polygon input, policy and environmental constraint layers, and backend analysis services to produce suitability outputs and reports for areas selected by the user within Ordnance Survey area quadrant SZ.

This technical documentation covers:

- System architecture and components (frontend, API, etc)
- Geospatial data integration and layer-based analysis behavior
- Configuration and deployment workflows
- Operational guidance for monitoring, troubleshooting, and maintenance

Out of scope for this section:

- Legal interpretation of planning policy
- Authoritative policy text (refer to source policy documents)
- End-user training material beyond technical usage context

```bash
pip install mkdocs
py -m mkdocs serve -f "Technical Documentation.yml"
```

Then open `http://127.0.0.1:8000`.
