# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation [ref=e4]:
    - button "☰" [active] [ref=e5] [cursor=pointer]
    - link "Notes" [ref=e6] [cursor=pointer]:
      - /url: /
    - link "Graph" [ref=e7] [cursor=pointer]:
      - /url: /graph
    - link "Settings" [ref=e8] [cursor=pointer]:
      - /url: /settings
    - button "☀️" [ref=e9] [cursor=pointer]
  - generic [ref=e10]:
    - generic [ref=e11]:
      - generic [ref=e12]:
        - heading "notesh.md" [level=1] [ref=e13]
        - button "+ New Note" [ref=e14] [cursor=pointer]
      - textbox "Search notes..." [ref=e16]
      - generic [ref=e18]: No notes yet
    - generic [ref=e19]:
      - heading "Welcome to notesh.md" [level=2] [ref=e20]
      - paragraph [ref=e21]: Select a note from the sidebar or create a new one
      - combobox [ref=e23]:
        - option "Select a template..." [selected]
        - option "Daily Note"
        - option "Meeting"
        - option "Project"
        - option "Book Note"
      - button "Create New Note" [ref=e24] [cursor=pointer]
```