import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MdDialog, MdSlideToggleChange } from '@angular/material';

import { AuthenticationService } from 'app/authentication/authentication.service';
import { ReauthenticationDialog } from 'app/authentication/reauthentication-dialog.component';
import { TranscriptService } from 'app/transcript/transcript.service';

@Component({
  selector: 'cig-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  private credentials: FormGroup;
  showGrades: boolean = true;
  constructor(
    private transcriptService: TranscriptService,
    private authenticationService: AuthenticationService,
    private mdDialog: MdDialog) {}
  ngOnInit() {
    this.credentials = new FormGroup({
      username: new FormControl(),
      password: new FormControl()
    });
  }
  signIn({value, valid}: {value: {username: string, password: string}, valid: boolean}) {
    this.authenticationService.next(value);
  }
  toggleGrades(event: MdSlideToggleChange) {
    if (!event.checked) {
      this.showGrades = event.checked;
    } else {
      this.mdDialog.open(ReauthenticationDialog).afterClosed().subscribe(result => {
        if(result) {
          this.showGrades = event.checked;
        } else {
          event.source.checked = false;
        }
      });
    }
  }
}
