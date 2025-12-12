# Frontend Development Ticket: Collaborator Presence & Sidebar Cleanup

## 📋 Overview
Implement collaborator presence indicators and clean up sidebar navigation for the Notes application.

## ✅ Status: Ready for Implementation

All infrastructure has been created. Follow the integration steps below.

---

## 🎯 Requirements Summary

### 1. Sidebar Cleanup ✅
- [x] JSON-based sidebar configuration created
- [x] Default tabs ordered as specified
- [x] "Download app" and "Upgrade" hidden by default (configurable)
- [x] New Note button added (prominent CTA)

### 2. Collaborator Presence ✅
- [x] PresenceService created
- [x] CollaboratorPresenceComponent created
- [x] Tooltip format implemented
- [x] Idle detection (>30s) implemented
- [x] ARIA accessibility implemented

### 3. Integration Required 🔧
- [ ] Import CollaboratorPresenceModule
- [ ] Uncomment presence component in sidebar
- [ ] Test tooltip display
- [ ] Connect to real backend (when available)

---

## 🚀 Integration Steps

### Step 1: Add CollaboratorPresenceModule to SidenavModule

**File**: `src/@vex/layout/sidenav/sidenav.module.ts`

```typescript
import { CollaboratorPresenceModule } from '../../../app/features/notes/components/collaborator-presence/collaborator-presence.module';

@NgModule({
  imports: [
    // ... existing imports
    CollaboratorPresenceModule
  ]
})
```

### Step 2: Enable Presence Component in Sidebar

**File**: `src/@vex/layout/sidenav/sidenav.component.html`

Uncomment or add before the footer:
```html
<!-- Collaborator Presence Indicator -->
<div class="flex-none" style="margin-top: auto;">
  <app-collaborator-presence [showInSidebar]="true"></app-collaborator-presence>
</div>
```

### Step 3: Test the Implementation

1. **Sidebar Navigation**:
   - Verify all tabs appear in correct order
   - Test "New Note" button functionality
   - Confirm Search is at top

2. **Presence Indicators**:
   - Should see 2 sample collaborators in sidebar
   - Hover over avatars to see tooltips
   - Verify tooltip format matches spec
   - Test keyboard navigation (Tab key)

3. **Mobile Responsiveness**:
   - Sidebar should collapse on mobile
   - Same tab order should be preserved
   - Presence indicators should remain visible

---

## 📝 Tooltip Format Examples

The component automatically formats tooltips based on collaborator state:

- **Normal**: `"Anita Sharma — Viewing: Notes / Your Home"`
- **Editing**: `"Mark Lee — Editing: Notes / Untitled"`
- **Idle**: `"Anita Sharma — Viewing: Notes / Your Home (idle)"`

---

## 🔧 Configuration

### Updating Sidebar Items
Edit `src/app/core/config/sidebar.config.ts`:

```typescript
export const SIDEBAR_CONFIG: SidebarConfig = {
  showDownloadApp: false,  // Toggle download app link
  showUpgrade: false,      // Toggle upgrade link
  items: [
    // Modify navigation structure here
  ]
};
```

### Sample Collaborators
Currently uses sample data. In production, replace `initializeSampleCollaborators()` in `presence.service.ts` with WebSocket connection.

---

## 📦 Files Created/Modified

### New Files
- `src/app/core/config/sidebar.config.ts` - Sidebar configuration
- `src/app/core/services/presence.service.ts` - Presence management
- `src/app/features/notes/components/collaborator-presence/*` - Component files
- `IMPLEMENTATION-SUMMARY.md` - Detailed documentation

### Modified Files
- `src/app/app.component.ts` - Uses sidebar config
- `src/@vex/layout/sidenav/sidenav.component.*` - Added New Note button
- `src/@vex/layout/sidenav/sidenav.module.ts` - Added dependencies

---

## ✨ Features Implemented

### Presence Service
- ✅ Online/offline state management
- ✅ Idle detection (30s threshold)
- ✅ Editing/viewing state tracking
- ✅ Location tracking (section/subsection)
- ✅ Cursor position tracking
- ✅ Color generation for collaborators
- ✅ Observable-based reactive updates

### Presence Component
- ✅ Sidebar view with avatars
- ✅ Editor cursor indicators (ready)
- ✅ Tooltip with proper formatting
- ✅ ARIA labels and accessibility
- ✅ Keyboard navigation support
- ✅ Mobile responsive
- ✅ Smooth animations

### Sidebar
- ✅ JSON-based configuration
- ✅ New Note CTA button
- ✅ Proper tab ordering
- ✅ Removed unnecessary items
- ✅ Mobile responsive

---

## 🧪 Testing Checklist

- [ ] Sidebar shows all tabs in correct order
- [ ] New Note button works
- [ ] Collaborator avatars appear in sidebar
- [ ] Tooltips display correctly on hover
- [ ] Tooltips format matches specification
- [ ] Idle state shows "(idle)" after 30s
- [ ] Keyboard navigation works (Tab, Enter)
- [ ] Mobile sidebar collapses properly
- [ ] Tab order preserved on mobile
- [ ] ARIA labels work with screen readers

---

## 🔄 Next Steps (Backend Integration)

When backend is ready:
1. Replace sample data with WebSocket connection
2. Subscribe to presence events
3. Broadcast cursor positions
4. Handle section/subsection detection from router
5. Store user color preferences

---

## 📚 Additional Documentation

See `IMPLEMENTATION-SUMMARY.md` for detailed technical documentation.

