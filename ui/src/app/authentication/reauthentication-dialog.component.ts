import { Component } from '@angular/core';
import { MdDialogRef } from '@angular/material';

import { AuthenticationService } from './authentication.service';

@Component({
  selector: 'cig-reauthentication-dialog',
  templateUrl: './reauthentication-dialog.component.html',
  styleUrls: ['./reauthentication-dialog.component.css']
})
export class ReauthenticationDialog {
  password: string;
  private _valid: boolean = true;
  constructor(
    private mdDialogRef: MdDialogRef<ReauthenticationDialog>,
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
