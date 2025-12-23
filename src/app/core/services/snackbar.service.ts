
import { Injectable, NgZone } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
    providedIn: 'root'
})

export class SnackBarService {

    constructor(private snackBar: MatSnackBar,private zone: NgZone,) { }

    openSnackBar(message: string, duration: number = 2000, className: string = 'default') {
        this.zone.run(() => {
            const snackBarRef = this.snackBar.open(message, '✖', {
                duration,
                verticalPosition: 'top',
                horizontalPosition: 'end',
                panelClass: [className],
            });
            
            snackBarRef.onAction().subscribe(() => {
                snackBarRef.dismiss();
            });
          });
        
    }

    showSuccess(message: string) {
        this.openSnackBar(message, 3000, 'success');
    }

    showError(message: string) {
        this.openSnackBar(message, 3000, 'error');
    }

    showWarning(message: string) {
        this.openSnackBar(message, 3000, 'warning');
    }
}