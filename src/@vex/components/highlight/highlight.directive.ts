import { Directive, EventEmitter, inject, Input, NgZone, OnChanges, Output, SimpleChanges } from '@angular/core';
import { HighlightResult } from './highlight.model';
import { HighlightService } from './highlight.service';

@Directive({
  selector: '[vexHighlight]',
  host: {
    '[class.hljs]': 'true',
    '[innerHTML]': 'highlightedCode'
  },
  standalone: true
})
export class HighlightDirective implements OnChanges {
  private readonly _highlightService = inject(HighlightService);
  
  constructor(private readonly _zone: NgZone) {}

  /** Highlighted Code */
  highlightedCode: string;

  /** An optional array of language names and aliases restricting detection to only those languages.
   * The subset can also be set with configure, but the local parameter overrides the option if set.
   */
  @Input() languages: string[];

  /** Highlight code input */
  @Input('vexHighlight') code;

  /** Stream that emits when code string is highlighted */
  @Output() highlighted = new EventEmitter<HighlightResult>();

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.code &&
      changes.code.currentValue !== changes.code.previousValue
    ) {
      this.highlightElement(this.code, this.languages);
    }
  }

  /**
   * Highlighting with language detection and fix markup.
   * @param code Accepts a string with the code to highlight
   * @param languages An optional array of language names and aliases restricting detection to only those languages.
   * The subset can also be set with configure, but the local parameter overrides the option if set.
   */
  highlightElement(code: string, languages?: string[]) {
    this._zone.runOutsideAngular(() => {
      const res = this._highlightService.highlightAuto(code, languages);
      this.highlightedCode = res.value;
      this.highlighted.emit(res);
    });
  }
}
