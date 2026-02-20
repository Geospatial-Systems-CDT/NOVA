# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

variable "token" {
  description = "GitHub personal access token."
  type        = string
  sensitive   = true
}

variable "organisation" {
  description = "The GitHub organisation name."
  type        = string
  default     = "National-Digital-Twin"
}

variable "repository_description" {
  description = "GitHub repository description."
  type        = string
  default     = "NOVA is an early-stage digital twin demonstrator designed to model and optimise the integration of renewable energy generation and storage on the Isle of Wight."
}

variable "requirement_tracking_url_base" {
  description = "Requirement tracking system URL base to be used for autolinking commit messages."
  type        = string
}

variable "requirement_tracking_id" {
  description = "Requirement identifier to be used for autolinking commit messages. This ID should match those which prefix issue identifiers, for example DPAV."
  type        = string
  default     = "DPAV"
}