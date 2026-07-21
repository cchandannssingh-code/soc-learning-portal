# Learning Metadata

Documentation pages are independent from application routes. Add stable learning IDs in the Markdown frontmatter; do not add links to assessments, labs, or other learning modules inside Markdown.

```yaml
---
id: windows-4657
eventId: 4657
category: windows-security
subcategory: persistence
difficulty: Intermediate
estimatedReadingTime: 6
estimatedAssessmentTime: 15
objectives:
  - Explain the event
  - Investigate suspicious registry changes
  - Correlate related events
previous: windows-4656
next: windows-4663
assessmentId: "4657"
scenarioId: registry-4657
splunkLabId: registry-4657
threatHuntId: registry-4657
resources:
  sigmaLab: registry-4657
---
```

`id`, `previous`, and `next` identify documentation pages. The remaining `*Id` fields identify learning resources. They are stable content IDs, not paths.

Assessment IDs are discovered from assessment JSON metadata in this order: `assessmentId`, then `eventId`. For other module types, register the resource ID and its application route in `lib/learning.ts`. This keeps Markdown unchanged when folders or routes move.
