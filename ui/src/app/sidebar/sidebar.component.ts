import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { AuthenticationService } from 'app/authentication/authentication.service';
import { TranscriptService } from 'app/transcript/transcript.service';

@Component({
  selector: 'cig-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  private credentials: FormGroup;
  constructor(
    private transcriptService: TranscriptService,
    private authenticationService: AuthenticationService) {}
  ngOnInit() {
    this.credentials = new FormGroup({
      username: new FormControl(),
      password: new FormControl()
    });
  }
  signIn({value, valid}: {value: {username: string, password: string}, valid: boolean}) {
    this.authenticationService.next(value);
  }
}
