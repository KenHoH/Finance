---
trigger: always_on
---

The agent must treat `/docs/srs` as the canonical and authoritative source of truth for the entire project.

Rules:

1. If `/docs/srs` does not exist, create it automatically with a proper SRS structure.

2. All features, requirements, workflows, APIs, database schemas, validations, business rules, and system behaviors must be documented inside `/docs/srs` before implementation.

3. The agent must always read `/docs/srs` before:
   - planning
   - coding
   - refactoring
   - generating APIs
   - modifying schemas
   - implementing UI
   - writing tests
   - making architectural decisions

4. Never assume undocumented behavior.

5. If requirements are missing, ambiguous, incomplete, or conflicting:
   - stop implementation
   - report the issue
   - request clarification
   - update `/docs/srs` first

6. If implementation conflicts with `/docs/srs`, treat the implementation as incorrect unless the SRS is officially updated.

7. Any requirement change must update `/docs/srs` before implementation continues.

8. The agent must maintain synchronization between:
   - `/docs/srs`
   - implementation
   - APIs
   - database schema
   - architecture
   - tests
   - validations

9. The agent must never introduce:
   - undocumented features
   - hidden functionality
   - silent workflow changes
   - inferred business logic

10. Before generating code, verify:
   - requirement exists in `/docs/srs`
   - acceptance criteria are defined
   - expected behavior is documented

11. Tests must derive only from documented requirements and acceptance criteria inside `/docs/srs`.

12. Maintain clear requirement traceability between implementation and SRS documentation.

13. `/docs/srs` has the highest authority in the repository.
