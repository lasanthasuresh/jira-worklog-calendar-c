import { Component, OnInit } from '@angular/core';
import { AccountInfo } from './account-info';
import { ProfileProviderService } from './profile-provider.service';

@Component ({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.scss' ]
})
export class AppComponent implements OnInit {

  loggedInUser: AccountInfo;

  constructor (private userProfilerService: ProfileProviderService) {
  }

  ngOnInit () {
    this.userProfilerService.currentAccountAsync ().then (profile => {
      this.loggedInUser = profile;
    });
  }

  onUserLoggedIn ($event: AccountInfo) {
    this.loggedInUser = $event;
  }

  async onUserLoggOff ($event: any) {
    this.loggedInUser = null;
    await this.userProfilerService.resetProfile ();
  }
}
