# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation [ref=e4]:
    - link "Notes" [ref=e5] [cursor=pointer]:
      - /url: /
    - link "Graph" [ref=e6] [cursor=pointer]:
      - /url: /graph
    - link "Settings" [ref=e7] [cursor=pointer]:
      - /url: /settings
    - button "☀️" [ref=e8] [cursor=pointer]
  - generic [ref=e10]:
    - heading "Settings" [level=2] [ref=e11]
    - generic [ref=e12]:
      - heading "GitHub Sync" [level=3] [ref=e13]
      - generic [ref=e14]:
        - paragraph [ref=e15]: "Connected to: user/repo"
        - generic [ref=e16]:
          - button "Sync Notes" [ref=e17] [cursor=pointer]
          - button "Import" [ref=e18] [cursor=pointer]
          - button "Disconnect" [ref=e19] [cursor=pointer]
    - generic [ref=e20]:
      - heading "About" [level=3] [ref=e21]
      - paragraph [ref=e22]: notesh.md - A modern note-taking app with graph view
      - paragraph [ref=e23]: Version 1.0.0
```