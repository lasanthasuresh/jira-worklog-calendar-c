import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { JiraService } from '../jira.service';
import { WorklogService } from '../worklog.service';
import { ProfileProviderService } from '../profile-provider.service';

@Component ({
  selector: 'app-view-event-modal',
  templateUrl: './view-event-modal.component.html',
  styleUrls: [ './view-event-modal.component.scss' ]
})
export class ViewEventModalComponent implements OnInit {

  @Input () public input: any;
  @Output () saved: EventEmitter<any> = new EventEmitter ();
  @Output () canceled: EventEmitter<any> = new EventEmitter ();

  dataModel = {
    id: null,
    ticket: '',
    summary: '',
    affectingDate: null,
    affectingDateList: [],
    affectingDates: '',
    timeStarted: null,
    timeSpent: '',
    comment: ''
  };

  newDataModel = {
    affectingDate: new Date(),
    comment: ''
  };

  constructor (
    public activeModal: NgbActiveModal,
    private jiraService: JiraService,
    private worklogService: WorklogService,
  ) {
  }

  get hasChanged () {
    return this.dataModel.comment !== this.newDataModel.comment
      || this.dataModel.affectingDate !== this.newDataModel.affectingDate;
  }

  ngOnInit (): void {
  }

  public acceptParameters (id) {
    const worklog = this.worklogService.getWorkLogById (id);
    this.dataModel.id = id;
    this.dataModel.ticket = worklog.ticketKey;
    this.dataModel.summary = worklog.ticketSummary;
    this.dataModel.timeSpent = worklog.timeSpent;
    this.dataModel.timeStarted = worklog.started.toLocaleTimeString ('en-US', {
      hour12: false,
    });
    this.dataModel.affectingDate = worklog.started;
    this.newDataModel.affectingDate = worklog.started;
    this.dataModel.comment = worklog.commentStr;
    this.newDataModel.comment = worklog.commentStr;
    console.log('new ', this.newDataModel);
  }


  async save () {
    await this.worklogService.updateWorklog ({
      id: this.dataModel.id,
      date: this.newDataModel.affectingDate,
      comment: this.newDataModel.comment
    });
    this.activeModal.close ('saved');
    this.saved.emit ('saved');
  }

  async delete () {
    if (confirm (`Are you sure you want to delete the worklog? `)) {
      await this.worklogService.deleteWorklog (this.dataModel.id);
      this.activeModal.close ('saved');
      this.saved.emit ('saved');
    }

  }


  cancel () {
    this.activeModal.close ('cancel');
    this.canceled.emit ('cancel');
  }

  onDateChange ($event: Event) {
    this.newDataModel.affectingDate = new Date(`${($event.target as HTMLInputElement).value}T${this.dataModel.timeStarted}`);
  }
}
