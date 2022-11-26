import { Component, OnInit, ViewChild } from '@angular/core';
import { JiraService } from '../jira.service';
import { ProfileProviderService } from '../profile-provider.service';

@Component ({
  selector: 'app-side-bar',
  templateUrl: './side-bar.component.html',
  styleUrls: [ './side-bar.component.scss' ]
})
export class SideBarComponent implements OnInit {

  @ViewChild ('ticketsList') ticketsList;

  tickets = [];
  filter: string;

  constructor (private profileService: ProfileProviderService, private jiraService: JiraService) {
  }

  get filteredTickets () {
    return this.tickets.filter (it => !Boolean (this.filter) ||
      it.key.toLowerCase ().includes (this.filter.toLowerCase()) ||
      it.summary.toLowerCase ().includes (this.filter.toLowerCase())
    );
  }

  ngOnInit (): void {
    this.jiraService.getRecentlyViewedTickets (
      this.profileService.currentAccount
    ).then (data => {
      console.log (data);
      this.tickets = data;
    });

  }
}
