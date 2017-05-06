import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {MdDialog, MdSlideToggleChange} from '@angular/material';
import {AuthenticationService} from 'app/authentication/authentication.service';
import {ReauthenticationDialogComponent} from 'app/authentication/reauthentication-dialog.component';

import {TranscriptService} from './../transcript/transcript.service';

@Component({
  selector: 'cig-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  private credentials: FormGroup;
  showGrades = true;

  constructor(
      // This is imported to initialize the service, otherwise nothing
      // will listen to the authentication bind.
      private transcriptService: TranscriptService,
      public authenticationService: AuthenticationService,
      private mdDialog: MdDialog) {}

  ngOnInit(): void {
    this.credentials = new FormGroup(
        {username: new FormControl(), password: new FormControl()});
    this.authenticationService.credentials.subscribe(data => {
      this.credentials.controls['username'].setValue(data.username);
      this.credentials.controls['password'].setValue(data.password);
    });
  }

  signIn({value, valid}:
             {value: {username: string, password: string}, valid: boolean}) {
    this.authenticationService.propose(value.username, value.password);
  }

  toggleGrades(event: MdSlideToggleChange): void {
    if (!event.checked) {
      this.showGrades = event.checked;
    } else {
      this.mdDialog.open(ReauthenticationDialogComponent)
          .afterClosed()
          .subscribe(result => {
            if (result) {
              this.showGrades = event.checked;
            } else {
              event.source.checked = false;
            }
          });
    }
  }
}
