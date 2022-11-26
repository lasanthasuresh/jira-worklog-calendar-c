import { Injectable } from '@angular/core';
import { ProfileProviderService } from './profile-provider.service';
import { JiraService } from './jira.service';

const colorCodes = [
  { backgroundColor: '#7B1FA2', borderColor: '#6A1B9A' },
  { backgroundColor: '#C2185B', borderColor: '#AD1457' },
  { backgroundColor: '#1976D2', borderColor: '#1565C0' },
  { backgroundColor: '#689F38', borderColor: '#558B2F' },
  { backgroundColor: '#FBC02D', borderColor: '#F9A825' },
  { backgroundColor: '#303F9F', borderColor: '#283593' },
  { backgroundColor: '#AFB42B', borderColor: '#9E9D24' },
  { backgroundColor: '#388E3C', borderColor: '#2E7D32' },
  { backgroundColor: '#FFA000', borderColor: '#FF8F00' },
  { backgroundColor: '#616161', borderColor: '#424242' },
  { backgroundColor: '#72544c', borderColor: '#694a43' },
  { backgroundColor: '#D32F2F', borderColor: '#C62828' },
  { backgroundColor: '#E64A19', borderColor: '#D84315' },
  { backgroundColor: '#512DA8', borderColor: '#4527A0' },
  { backgroundColor: '#00796B', borderColor: '#00695C' },
  { backgroundColor: '#0097A7', borderColor: '#00838F' },
  { backgroundColor: '#F57C00', borderColor: '#EF6C00' },
  { backgroundColor: '#455A64', borderColor: '#37474F' },
  { backgroundColor: '#0288D1', borderColor: '#0277BD' }
];

@Injectable ({
  providedIn: 'root'
})
export class WorklogService {

  allWorklogs = undefined;

  constructor (
    private profileService: ProfileProviderService,
    private jiraService: JiraService
  ) {
  }


  getWorkLogById (id) {
    return this.allWorklogs.find (it => it.id === id);
  }

  async events (fromDate: Date, toDate: Date) {
    if (this.allWorklogs === undefined) {
      this.allWorklogs = await this.jiraService.getAllWorklogs (this.profileService.currentAccount);
    }
    const toReturn = this.allWorklogs
      .filter (it => this.isInDateRange (it, fromDate, toDate))
      .map (this.toEvent);
    console.log (toReturn);
    return toReturn;
  }

  async saveWorkflows (workflow: { timeSpent: string; comment: string; started: string; ticketId: string }[]) {
    const workflows = await Promise.all (
      workflow.map (
        it => this.jiraService.createWorklog (
          it,
          this.profileService.currentAccount
        )
      )
    );
    await this.reloadWorklogsForTickets (workflow.map (it => it.ticketId));
  }

  async reloadWorklogsForTickets (ticketIds: string[]) {
    const worklogs = await this.jiraService.getAllWorklogs (this.profileService.currentAccount, ticketIds);

    for ( const worklog of worklogs ) {
      const index = this.allWorklogs.findIndex (it => it.id === worklog.id);
      if (index === -1) {
        this.allWorklogs.push (worklog);
      } else {
        this.allWorklogs[index] = worklog;
      }
    }
  }

  async resizeWorklog (id, startDelta, endDelta) {
    const index = this.allWorklogs.findIndex (it => it.id === id);
    const worklog = this.allWorklogs[index];
    worklog.timeSpentSeconds += endDelta;
    await this.jiraService.updateWorklog (worklog, this.profileService.currentAccount);
    await this.reloadWorklogsForTickets ([ worklog.ticketKey ]);
  }

  async moveWorklog (id, days: number, seconds: number) {
    const index = this.allWorklogs.findIndex (it => it.id === id);
    const worklog = this.allWorklogs[index];
    if (days !== 0) {
      worklog.started.setDate (worklog.started.getDate () + days);
    } else {
      worklog.started.setSeconds (worklog.started.getSeconds () + seconds);
    }
    await this.jiraService.updateWorklog (worklog, this.profileService.currentAccount);
    await this.reloadWorklogsForTickets ([ worklog.ticketKey ]);
  }


  async updateWorklog (param: { date: Date; comment: string; id: any }) {
    const index = this.allWorklogs.findIndex (it => it.id === param.id);
    const worklog = this.allWorklogs[index];
    worklog.commentStr = param.comment;
    worklog.started = param.date;
    await this.jiraService.updateWorklog (worklog, this.profileService.currentAccount);
    await this.reloadWorklogsForTickets ([ worklog.ticketKey ]);
  }

  async deleteWorklog (id) {
    const worklog = this.getWorkLogById (id);
    await this.jiraService.deleteWorklog (worklog, this.profileService.currentAccount);
    this.allWorklogs = this.allWorklogs.filter (it => it.id !== id);
  }

  private toEvent (worklog) {
    const color = colorCodes[worklog.issueId % colorCodes.length];
    return {
      start: worklog.started,
      end: worklog.end,
      title: `${ worklog.ticketKey } - ${ worklog.ticketSummary } (${ worklog.timeSpent })`,
      description: worklog.commentStr,
      id: worklog.id,
      issueId: worklog.issueId,
      backgroundColor: color.backgroundColor,
      borderColor: color.borderColor
    };
  }

  private isInDateRange (worklog, fromDate, toDate) {
    return worklog.started >= fromDate && worklog.end <= toDate;
  }


}
