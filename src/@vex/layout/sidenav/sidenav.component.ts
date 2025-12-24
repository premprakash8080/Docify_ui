import { Component, Input, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { NavigationService } from '../../services/navigation.service';
import { LayoutService } from '../../services/layout.service';
import { ConfigService } from '../../config/config.service';
import { map, startWith, switchMap, catchError, takeUntil } from 'rxjs/operators';
import { NavigationLink } from '../../interfaces/navigation-item.interface';
import { PopoverService } from '../../components/popover/popover.service';
import { Observable, of, Subject } from 'rxjs';
import { UserMenuComponent } from '../../components/user-menu/user-menu.component';
import { AuthService } from '../../../app/auth/service/auth.service';
import { User } from '../../../app/core/models';

@Component({
  selector: 'vex-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss'],
  standalone: false
})
export class SidenavComponent implements OnInit, OnDestroy {

  @Input() collapsed: boolean;
  collapsedOpen$ = this.layoutService.sidenavCollapsedOpen$;
  title$ = this.configService.config$.pipe(map(config => config.sidenav.title));
  imageUrl$ = this.configService.config$.pipe(map(config => config.sidenav.imageUrl));
  showCollapsePin$ = this.configService.config$.pipe(map(config => config.sidenav.showCollapsePin));
  userVisible$ = this.configService.config$.pipe(map(config => config.sidenav.user.visible));
  searchVisible$ = this.configService.config$.pipe(map(config => config.sidenav.search.visible));

  userMenuOpen$: Observable<boolean> = of(false);
  currentUser$: Observable<User | null> = this.authService.currentUser$;
  private lastAvatarUrl: string | null = null;
  private avatarUrlWithCache: string = '';
  private destroy$ = new Subject<void>();

  items = this.navigationService.items;

  constructor(private navigationService: NavigationService,
              private layoutService: LayoutService,
              private configService: ConfigService,
              private readonly popoverService: PopoverService,
              private router: Router,
              private authService: AuthService,
              private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    // Always fetch fresh user profile from API if authenticated
    if (this.authService.isAuthenticated) {
      this.authService.getProfile().pipe(
        catchError(error => {
          console.error('Error fetching user profile:', error);
          return of(null);
        }),
        takeUntil(this.destroy$)
      ).subscribe();
    }

    // Subscribe to user changes to reset avatar cache when user updates
    this.currentUser$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(user => {
      if (user && user.avatarUrl !== this.lastAvatarUrl) {
        // Reset cache when avatar URL changes
        this.lastAvatarUrl = null;
        this.avatarUrlWithCache = '';
        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  collapseOpenSidenav() {
    this.layoutService.collapseOpenSidenav();
  }

  collapseCloseSidenav() {
    this.layoutService.collapseCloseSidenav();
  }

  toggleCollapse() {
    this.collapsed ? this.layoutService.expandSidenav() : this.layoutService.collapseSidenav();
  }

  trackByRoute(index: number, item: NavigationLink): string {
    return item.route;
  }

  openProfileMenu(origin: HTMLDivElement): void {
    this.userMenuOpen$ = of(
      this.popoverService.open({
        content: UserMenuComponent,
        origin,
        offsetY: -8,
        width: origin.clientWidth,
        position: [
          {
            originX: 'center',
            originY: 'top',
            overlayX: 'center',
            overlayY: 'bottom'
          }
        ]
      })
    ).pipe(
      switchMap(popoverRef => popoverRef.afterClosed$.pipe(map(() => false))),
      startWith(true),
    );
  }

  openSearch(): void {
    this.layoutService.openSearch();
  }

  createNewNote(): void {
    // Navigate to new note creation
    // This will route to /notes/new when that route is implemented
    // For now, navigate to /notes list
    this.router.navigate(['/notes']);
  }

  getAvatarUrl(avatarUrl: string | undefined): string {
    if (!avatarUrl) {
      this.lastAvatarUrl = null;
      this.avatarUrlWithCache = 'assets/img/pic_rounded.svg';
      return this.avatarUrlWithCache;
    }
    
    // Only update cache-busting parameter when URL actually changes
    if (this.lastAvatarUrl !== avatarUrl) {
      const separator = avatarUrl.includes('?') ? '&' : '?';
      this.avatarUrlWithCache = `${avatarUrl}${separator}t=${Date.now()}`;
      this.lastAvatarUrl = avatarUrl;
    }
    
    return this.avatarUrlWithCache;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src !== 'assets/img/pic_rounded.svg') {
      img.src = 'assets/img/pic_rounded.svg';
    }
  }
}
