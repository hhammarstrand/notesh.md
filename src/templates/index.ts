import type { Template } from '../types';

export const dailyNoteTemplate: Template = {
  id: 'daily',
  name: 'Daily Note',
  description: 'Template for daily journal entries',
  content: `# {{date}}

## Morning
- 

## Tasks
- [ ] 

## Notes
-

## Evening
- 

## Reflections
- 
`
};

export const meetingNoteTemplate: Template = {
  id: 'meeting',
  name: 'Meeting',
  description: 'Template for meeting notes',
  content: `# Meeting: {{title}}

**Date:** {{date}}
**Attendees:** 

## Agenda
1. 

## Discussion

## Action Items
- [ ] 

## Next Steps
- 
`
};

export const projectNoteTemplate: Template = {
  id: 'project',
  name: 'Project',
  description: 'Template for project documentation',
  content: `# {{title}}

## Overview
Brief description of the project.

## Goals
- 

## Milestones
| Milestone | Target Date | Status |
|-----------|-------------|--------|
|           |             |        |

## Tasks
- [ ] 

## Notes
-

## Resources
- 
`
};

export const bookNoteTemplate: Template = {
  id: 'book',
  name: 'Book Note',
  description: 'Template for book notes and highlights',
  content: `# {{title}}

**Author:** 
**Date Finished:** 

## Summary

## Key Takeaways
1. 
2. 
3. 

## Quotes
> 

## Notes
-

## Review
Rating: /5
`
};

export const templates: Template[] = [
  dailyNoteTemplate,
  meetingNoteTemplate,
  projectNoteTemplate,
  bookNoteTemplate
];

export function applyTemplate(template: Template): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  return template.content
    .replace(/\{\{date\}\}/g, dateStr)
    .replace(/\{\{title\}\}/g, '');
}

export function getTemplateById(id: string): Template | undefined {
  return templates.find((t) => t.id === id);
}
