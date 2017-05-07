import {Component, Input} from '@angular/core';
import {AuthenticationService} from 'app/authentication/authentication.service';
import {DatabaseService} from 'app/database/database.service';

@Component({
  selector: 'cig-watches',
  templateUrl: './watches.component.html',
  styleUrls: ['./watches.component.scss']
})
export class WatchesComponent {
  constructor(
      authenticationService: AuthenticationService,
      private databaseService: DatabaseService) {}
}
