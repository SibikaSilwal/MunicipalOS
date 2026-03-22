# Municipal OS — Future TODOs

Features and improvements beyond the initial POC scope, organized by domain.

---

## Notification System

The POC ships with an email stub (logs to console). Future work:

- [ ] Integrate real SMTP provider for email delivery
- [ ] Add SMS gateway integration (e.g., Sparrow SMS, Aakash SMS — common in Nepal)
- [ ] Implement real-time push notifications via SignalR or WebSocket for in-app alerts
- [ ] Add notification preferences per user (opt-in/out by channel and event type)
- [ ] Mark-as-read / mark-all-read functionality
- [ ] Notification batching and digest emails (daily summary)

---

## Advanced Workflow Engine

The POC supports linear step-by-step workflows. Future enhancements:

- [ ] Conditional branching — route applications differently based on data (e.g., if amount > threshold, require additional approval)
- [ ] Parallel approval steps — multiple officers review simultaneously before advancing
- [ ] SLA and deadline tracking — define maximum processing time per step, surface overdue applications
- [ ] Auto-escalation on timeout — automatically forward to supervisor if step exceeds deadline
- [ ] Workflow versioning — support multiple versions of a workflow definition; existing applications continue on the version they started with
- [ ] Rollback / revert step — allow supervisors to send an application back to a previous step
- [ ] Dynamic officer assignment — assign specific officers (not just roles) based on workload or ward

---

## Document Management

- [ ] Document verification and validation — check file type, size limits, and required document completeness before submission
- [ ] Digital signature support — officer signs documents electronically, embedded in the generated PDF
- [ ] Template-based document generation — extend beyond certificates to recommendation letters, permits, and notices
- [ ] Document expiry tracking — flag certificates that are approaching or past their validity period
- [ ] Bulk document download — officer downloads all documents for an application as a ZIP
- [ ] Document preview — in-browser preview of uploaded documents without download

---

## Analytics and Reporting

- [ ] Admin dashboard with key metrics: average processing time, approval/rejection rates, applications per service type
- [ ] Municipality-level reports exportable as CSV/PDF
- [ ] Officer performance tracking — applications processed per day, average review time
- [ ] Service demand heatmap — which services are most requested
- [ ] Bottleneck detection — identify which workflow steps cause the most delays

---

## Multi-Tenancy

The POC uses `municipality_id` on key tables. Full multi-tenancy requires:

- [ ] Row-level security or schema-per-tenant isolation in PostgreSQL
- [ ] Municipality-specific branding (logo, name, colors)
- [ ] Provincial-level aggregation dashboard — view metrics across multiple municipalities
- [ ] Central government reporting portal — national-level visibility into service delivery performance
- [ ] Tenant onboarding flow — self-service municipality registration with admin provisioning

---

## Security Hardening

- [ ] Rate limiting on auth endpoints to prevent brute-force attacks
- [ ] IP address logging on all audit events
- [ ] Two-factor authentication (2FA) for officer and admin accounts
- [ ] Encryption at rest for sensitive fields (PII)
- [ ] Granular RBAC — permissions per endpoint, not just per role
- [ ] Session management — token refresh, revocation, and forced logout
- [ ] CORS and CSP policy configuration for production

---

## Integration Points

- [ ] National ID API integration — verify citizen identity against government records (when API becomes available)
- [ ] Payment gateway — collect service fees online (eSewa, Khalti, ConnectIPS — Nepal-specific)
- [ ] Land registry integration — cross-reference property data for building permits
- [ ] Inter-municipality transfer — forward applications between municipalities when a citizen moves
- [ ] Third-party webhook support — notify external systems on status changes

---

## Deployment and Operations

- [ ] CI/CD pipeline — GitHub Actions or Azure DevOps for automated build, test, and deploy
- [ ] Health check endpoints — `/health` and `/ready` for container orchestration
- [ ] Centralized logging — aggregate logs with ELK stack or Seq
- [ ] Database backup strategy — automated daily backups with point-in-time recovery
- [ ] Monitoring and alerting — Prometheus/Grafana or Azure Monitor for uptime and performance
- [ ] Horizontal scaling — guide for running multiple API instances behind a load balancer
- [ ] Kubernetes migration path — Helm charts for production-grade orchestration

---

## Localization

- [ ] Nepali language (Unicode/Devanagari) support across all UI labels and system messages
- [ ] Bikram Sambat (BS) date system — display and store dates in Nepal's official calendar alongside Gregorian
- [ ] RTL-aware layout considerations for future language support
- [ ] Localized PDF certificate templates — generate certificates in Nepali
- [ ] Multi-language admin configuration — allow service type names and descriptions in multiple languages
