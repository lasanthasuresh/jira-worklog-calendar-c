import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { JiraService } from '../jira.service';
import { ProfileProviderService } from '../profile-provider.service';
import { WorklogService } from '../worklog.service';
import { debounceTime, map, Observable, OperatorFunction } from 'rxjs';

@Component ({
  selector: 'app-add-event-modal',
  templateUrl: './add-event-modal.component.html',
  styleUrls: [ './add-event-modal.component.scss' ]
})
export class AddEventModalComponent implements OnInit {

  @Input ()
  public input: any;
  @Output ()
  saved: EventEmitter<any> = new EventEmitter ();
  @Output ()
  canceled: EventEmitter<any> = new EventEmitter ();

  hasMultipleDates: boolean;

  dataModel = {
    summary: '',
    affectingDate: null,
    affectingDateList: [],
    affectingDates: '',
    timeStarted: null,
    timeSpent: '',
    comment: ''
  };

  currentJira: any;
  private recentJira: { key; url; summary }[];

  constructor(
    public activeModal: NgbActiveModal,
    private jiraService: JiraService,
    private worklogService: WorklogService,
    private profileProvider: ProfileProviderService
  ) {
  }

  search: OperatorFunction<string, readonly { key; url; summary }[]> = (text$: Observable<string>) =>
    text$.pipe (
      debounceTime (200),
      map ((term) =>
        this.recentJira.filter (v => this.metches (v, term)).slice (0, 10),
      ),
    );

  metches = (element: { key; url; summary }, term) =>
    !Boolean (term)
    || element.key.toLowerCase ().includes (term.toLowerCase ())
    || element.summary.toLowerCase ().includes (term.toLowerCase());

  formatter = (x: { key; url; summary }) => `${x.key} - ${x.summary}` ;

  public acceptParameters(prams) {
    const startDateStr = prams.startStr.substring (0, 10);
    const endDateStr = prams.endStr.substring (0, 10);
    this.hasMultipleDates = startDateStr !== endDateStr;
    if (this.hasMultipleDates) {
      console.log (prams.start, prams.end);
      for (
        let date = new Date (startDateStr);
        date < new Date (endDateStr);
        date.setDate (date.getDate () + 1)
      ) {
        this.dataModel.affectingDateList.push (new Date (date));
      }
      this.dataModel.affectingDates = this.dataModel.affectingDateList.map (it => it.toISOString ().split ('T')[0]).join (', ');
      this.dataModel.timeSpent = '8h';
      this.dataModel.timeStarted = '09:00';
    } else {
      this.dataModel.affectingDateList = [ prams.start ];
      this.dataModel.affectingDate = prams.start;
      this.dataModel.timeSpent = this.countMinutes (prams.start, prams.end);
      this.dataModel.timeStarted = prams.startStr.substring (11, 16);

    }
  }

  ngOnInit(): void {
    this.jiraService.getRecentlyViewedTickets (this.profileProvider.currentAccount).then (
      jiras => this.recentJira = jiras
    );
  }

  cancel() {
    this.activeModal.close ('cancel');
    this.canceled.emit ('cancel');
  }

  async save() {
    await this.worklogService.saveWorkflows (this.getWorklogs());
    this.activeModal.close ('saved');
    this.saved.emit ('saved');
  }

  private getWorklogs() {
    if (this.hasMultipleDates) {
      return this.dataModel.affectingDateList.map (it => ( {
        ticketId: this.currentJira.key,
        timeSpent: this.dataModel.timeSpent,
        comment: this.dataModel.comment,
        started: this.convertToTime (it, this.dataModel.timeStarted),
      } ));
    } else {
      return [{
        ticketId: this.currentJira.key,
        timeSpent: this.dataModel.timeSpent,
        comment: this.dataModel.comment,
        started: this.convertToTime (this.dataModel.affectingDate, this.dataModel.timeStarted)
      }];
    }
  }

  private convertToTime(date, time) {
    const datePart = date.toISOString ().split ('T')[0];
    const timePart = time;
    const d = new Date (`${ datePart }T${ timePart }`);
    return d.toISOString ().replace ('Z', '+0000');

    // return '';//date.toISOString().split("T")[0] + 'T' +
  }

  private countMinutes(start, end) {
    const diff = end - start;
    const minutes = Math.round (( ( diff % 86400000 ) ) / 60000);
    if (minutes < 60) {
      return `${ minutes }m`;
    }
    if (minutes % 60 === 0) {
      return `${ minutes / 60 }h`;
    }
    return `${ ( minutes - ( minutes % 60 ) ) / 60 }h ${ minutes % 60 }m`;
  }

}
