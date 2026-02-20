# Changelog

All notable changes to this project will be documented in this file, following **Semantic Versioning**.

## v1.0.0 (Feature release)

### New features
**Initial release** of the User Details API with capability to:
  - Source user details from the `X-Auth-Request-Access-Token` header of inbound requests by calling the /v1/user-details endpoint.
  - Decode JWT tokens to inspect their contents by calling the /v1/jwt-decode endpoint.
  - Adjust API settings such as the default header name inspected for inbound tokens and claims returned through use of environment variables.

### Deprecated features
No deprecated features in this release.

### Fixes
No fixes in this release.

© Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.  
Licensed under the Open Government Licence v3.0.  
