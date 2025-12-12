# Project description — Evernote-style Notes app (Angular + Vex theme)

Nice — you’ve got the Vex Angular theme from ThemeForest. Below is a full project description, architecture, component breakdown, data models, routes, services, and sample component code to get you started building an Evernote-style note app where users can create, search, tag, and sync notes. I also included an optional **Cursor / presence** component for collaborative editing (since you mentioned “cusor” — I assumed you might want collaborator cursors; if you meant something else I still covered the most useful options).

---

# 1 — Elevator pitch

Build a responsive, PWA-capable notes app using the Vex theme (Angular) that supports: create/edit rich-text notes, tag & notebook organization, search, offline-first behavior (IndexedDB), user auth, and optional real-time collaboration (cursor presence). Designed to fit inside the Vex theme UI and follow Angular best-practices.

---

# 2 — Tech stack

* Angular (latest stable)
* Vex theme for UI & layout (use Vex components and styles)
* Angular Router
* Reactive Forms
* Rich text editor: Quill (ngx-quill) or TipTap if preferred
* State management: NgRx (optional) or simple services + BehaviorSubjects
* Offline/Local DB: IndexedDB via `idb` or `ngx-indexed-db`
* Backend: REST API (Node/Express) + optional WebSocket (Socket.IO) for realtime
* Auth: JWT
* PWA support: Angular Service Worker
* Unit tests: Jasmine/Karma; e2e: Playwright or Cypress

---

# 3 — Goals / features (MVP → v1)

MVP

* User registration & login (JWT)
* Create / edit / delete notes (title, rich-text body)
* Notes list with preview (title + snippet)
* Search (title + content + tags)
* Tagging + filter by tag
* Notebooks or folders (optional)
* Responsive UI integrated into Vex
* Offline support (read/write while offline → sync when online)
* Local persistence using IndexedDB

v1+

* Rich-text formatting (bold, lists, code, images)
* Note attachments (images)
* Note versioning / history
* Pin, archive, trash
* Sharing and permissions (read-only)
* Real-time collaboration with cursor presence (optional)
* Full-text search indexing (lunr.js or server-side)

---

# 4 — Data models (TypeScript interfaces)

```ts
export interface User {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string; // html / delta (for quill)
  tags: string[]; // tag ids or names
  notebookId?: string;
  pinned?: boolean;
  archived?: boolean;
  trashed?: boolean;
  createdAt: string;
  updatedAt: string;
  version?: number;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url?: string; // for remote
  localBlobId?: string; // for local storage
}

export interface Notebook {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
}
```

---

# 5 — Project folder structure (Current Implementation)

```
src/
  app/
    core/                  // singletons, interceptors, auth
      models/              // All data models (single source of truth)
        user.model.ts
        note.model.ts
        notebook.model.ts
        tag.model.ts
        attachment.model.ts
        sync-queue.model.ts
        index.ts
      services/
        auth.service.ts    // JWT authentication
        api.service.ts     // HTTP client wrapper
        storage.service.ts // In-memory cache (can extend to IndexedDB)
        sync.service.ts    // Offline sync queue management
        index.ts
      guards/
        auth.guard.ts      // Route protection
        index.ts
    features/
      notes/
        services/
          notes.service.ts // Notes CRUD operations
          search.service.ts // Search and filtering
          index.ts
        components/        // To be implemented
          notes-list/
          note-editor/
          note-detail/
          note-preview/
          sidebar/
          search-bar/
          tags-list/
          notebook-list/
          cursor-presence/   // optional
        notes.module.ts    // To be created
        notes-routing.module.ts  // To be created
    custom-layout/         // Vex layout wrapper
    pages/                 // Vex theme pages
  assets/
  environments/
    environment.ts         // API configuration
```

**Note on Storage:**
- Currently using in-memory cache for development
- Storage service can be extended with IndexedDB (`idb` library) for full offline support
- Auth tokens are stored in localStorage (standard practice)
- Data models are consolidated in `core/models/` as single source of truth

---

# 6 — Routes (high level)

```
/              -> redirect to /notes
/notes         -> NotesList (left: sidebar, center: list, right: editor/view)
/notes/:id     -> NoteDetail / editor for note with id
/tags/:tagId   -> NotesList filtered by tag
/notebooks/:id -> NotesList filtered by notebook
/settings
/login
/register
```

---

# 7 — Component breakdown & responsibilities

### Layout / Vex integration

* `AppLayoutComponent` — Vex header + left nav + main outlet. Handles responsive layout and theme toggles.

### Notes feature (module: `NotesModule`)

* `SidebarComponent`

  * notebooks list, tags list, quick filters (All, Pinned, Archive, Trash)
* `SearchBarComponent`

  * debounce search input, emits search query
* `NotesListComponent`

  * shows list of notes (virtual scroll recommended), sort, group by date or notebook
* `NotePreviewComponent`

  * one row/card showing title + snippet + tags + updatedAt, click opens note
* `NoteEditorComponent`

  * rich-text editor + title input + tag selector + controls (save, pin, trash). Autosave with debounce
* `NoteDetailComponent`

  * read-only or full-screen view, show attachments, history link
* `TagSelectorComponent`

  * create tag dropdown, color picker
* `AttachmentUploaderComponent`

  * drag & drop images + inline attach
* `CursorPresenceComponent` (optional)

  * visual indicators for collaborators’ cursors and names (small colored dots)
* `ConflictModalComponent`

  * handle sync conflicts: keep local, keep server, merge

### Core services (Implemented)

* `ApiService`
  * HTTP client wrapper with auth token injection
  * Handles API base URL and headers
  * Returns typed responses with error handling

* `AuthService`
  * JWT authentication (login, register, logout)
  * Token refresh mechanism
  * Current user state management
  * Token storage in localStorage

* `StorageService`
  * **Current:** In-memory cache for development
  * **Future:** Can be extended with IndexedDB for offline support
  * Generic interface: `put`, `get`, `getAll`, `delete`, `getAllByIndex`, `clear`
  * Supports: notes, notebooks, tags, attachments, syncQueue

* `SyncService`
  * Queues local operations for sync when online
  * Retry mechanism with exponential backoff
  * Downloads updates from server
  * Monitors online/offline status
  * Auto-syncs every 30 seconds when online

* `NotesService`
  * CRUD operations for notes, notebooks, tags
  * Integrates with StorageService (local cache)
  * Queues changes to SyncService for API sync
  * Reactive state management with BehaviorSubjects

* `SearchService`
  * Search notes by title, content, tags
  * Filter by tag, notebook, or status (pinned/archived/trashed)
  * Observable-based reactive search

* `PresenceService` (optional - not yet implemented)
  * WebSocket connection + broadcast cursor positions
  * For real-time collaboration features

---

# 8 — Important UX behaviors & details

* Autosave every N seconds or on blur — show saving indicator.
* Offline-first: read from local DB instantly; queue writes to sync when online.
* Note editor: allow switching between Markdown and Rich Text (optional).
* Keyboard shortcuts: `Ctrl+N` new note, `Ctrl+S` save, `Ctrl+K` quick search.
* Mobile: bottom sheet editor, collapsible sidebar.
* Accessibility: aria attributes for editor toolbar, keyboard navigation in list.

---

# 9 — Sync strategy (simple)

1. Local writes saved to IndexedDB with `synced: false` and `lastModified`.
2. `SyncService` listens for online event; when online, it:

   * Uploads unsynced notes to server
   * Resolves conflicts by timestamp or show conflict UI
   * Downloads updates from server since lastSyncAt
3. Use optimistic UI + background retries

For realtime collaboration: use WebSocket to broadcast edits and cursor positions. Use operational transforms (OT) or CRDTs for merge — but note this is advanced.

---

# 10 — NotesService Implementation (Current)

**Status:** ✅ Implemented at `src/app/features/notes/services/notes.service.ts`

The service provides:
- Full CRUD for Notes, Notebooks, and Tags
- Reactive state management via BehaviorSubjects
- Integration with StorageService (in-memory cache)
- Automatic sync queue management via SyncService
- User-scoped data filtering

**Key Methods:**
- `getNotes()`, `getNotebooks()`, `getTags()` - Observable streams
- `createNote()`, `updateNote()`, `deleteNote()` - Note operations
- `createNotebook()`, `updateNotebook()`, `deleteNotebook()` - Notebook operations
- `createTag()`, `updateTag()`, `deleteTag()` - Tag operations

**Architecture:**
- Uses `StorageService` for local persistence (currently in-memory, extensible to IndexedDB)
- Queues all changes to `SyncService` for API synchronization
- Reactive updates via BehaviorSubjects for real-time UI updates
- Error handling and validation included

---

# 11 — Sample NoteEditorComponent (Angular + Quill)

```ts
// note-editor.component.ts (simplified)
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NotesService } from '../notes.service';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-note-editor',
  template: `
  <div class="note-editor">
    <input class="title" [formControl]="form.controls.title" placeholder="Title" />
    <quill-editor formControlName="content"></quill-editor>
    <div class="actions">
      <button (click)="save()">Save</button>
      <button (click)="togglePin()">Pin</button>
    </div>
  </div>
  `
})
export class NoteEditorComponent implements OnInit {
  @Input() noteId?: string;
  form: FormGroup;

  constructor(private fb: FormBuilder, private notes: NotesService) {
    this.form = this.fb.group({ title: '', content: '' });
  }

  ngOnInit() {
    this.form.valueChanges.pipe(debounceTime(800)).subscribe(v => {
      if (this.noteId) this.notes.updateNote(this.noteId, v);
    });

    if (this.noteId) {
      this.notes.getNotes().subscribe(list => {
        const n = list.find(i => i.id === this.noteId);
        if (n) this.form.setValue({ title: n.title, content: n.content }, { emitEvent: false });
      });
    }
  }

  save() {
    if (this.noteId) {
      this.notes.updateNote(this.noteId, this.form.value);
    } else {
      this.notes.createNote(this.form.value as any);
    }
  }

  togglePin() { /* pin logic */ }
}
```

---

# 12 — Cursor / Presence component (optional)

If you want collaborative cursors (showing other users’ caret positions inside the editor), create:

* `PresenceService` — opens WebSocket, exchanges presence messages
* `CursorPresenceComponent` — subscribes to presence stream and paints small colored avatars/dots with names at positions in the editor (Quill provides APIs to map index → DOM position)
* Implementation notes:

  * Send `{ userId, displayName, color, range: {index, length} }` messages
  * Render using absolute-positioned elements inside editor container
  * Security: only for authenticated rooms and authorized users
  * For real editing you need OT/CRDT (TipTap + yjs simplifies CRDT integration)

---

# 13 — Integrating with Vex theme

* Use Vex layout components for header/sidebar and the content area for the notes UI.
* Wrap the notes list and editor in Vex content cards.
* Keep the visual language consistent: buttons and inputs use Vex classes and spacing.
* For the dark/light mode toggle, integrate with Vex theme variables.

---

# 14 — Dev tasks / Milestones

Week 1 — Setup

* Create Angular project; add Vex theme
* Setup routing, auth skeleton
* Setup IndexedDB storage service

Week 2 — Core notes CRUD

* Notes list, create/edit, note service + local persistence
* Basic search & tag filtering

Week 3 — Offline & Sync

* Implement sync queue & server stubs
* Add PWA support

Week 4 — Rich features

* Rich-text editor, attachments, tagging UI, notebooks
* Polishing, keyboard shortcuts, tests

Optional Week 5 — Realtime

* Add WebSocket, presence, cursors, collaboration model

---

# 15 — Example README intro (you can paste into your repo)

```
# VexNotes — Angular Notes App (Vex theme)

VexNotes is an Evernote-style note-taking app built with Angular and the Vex theme. It supports offline-first storage via IndexedDB, rich-text editing, tagging, notebooks, search, and optional real-time collaboration.

Tech: Angular, Vex Theme, ngx-quill, IndexedDB, NgRx (optional), Node/Express backend (optional)

Run:
1. npm install
2. ng serve
3. Open http://localhost:4200
```

---

# 16 — Quick checklist / recommended libs

* `ngx-quill` for editor
* `ngx-indexed-db` or `idb`
* `@ngrx/store` (if you want centralized state)
* `ngx-pwa` (Angular PWA setup)
* `socket.io-client` (for realtime)
* `lunr` (client search) or server-side ElasticSearch

---

If you want, I can:

* generate full `notes.module.ts` and routing code,
* scaffold the folder structure with sample files,
* produce a tailored mock API spec (endpoints + payloads),
* or write the CSS/HTML for one Vex-styled Note card (`NotePreviewComponent`) to drop right into your Vex layout.

Which of those would you like me to produce right now? (I can pick one and create it immediately.)
