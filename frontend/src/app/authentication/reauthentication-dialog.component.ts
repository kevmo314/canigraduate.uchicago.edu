import { Component } from '@angular/core';
import { MdDialogRef } from '@angular/material';

import { AuthenticationService } from './authentication.service';

@Component({
  selector: 'cig-reauthentication-dialog',
  templateUrl: './reauthentication-dialog.component.html',
  styleUrls: ['./reauthentication-dialog.component.css']
})
export class ReauthenticationDialogComponent {
  password: string;
  private _valid = true;
  constructor(
    private mdDialogRef: MdDialogRef<ReauthenticationDialogComponent>,
    private authenticationService: AuthenticationService) {}
  get valid() { return this._valid; }
  submit(): void {
    if (this.authenticationService.reauthenticate(this.password)) {
      this.mdDialogRef.close(true);
    } else {
      this._valid = false;
    }
  }
}
