import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { CalendarOptions, DateSelectArg, EventClickArg, EventApi, FullCalendarComponent } from '@fullcalendar/angular';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { JiraService } from '../jira.service';
import { AddEventModalComponent } from '../add-event-modal/add-event-modal.component';
import { ProfileProviderService } from '../profile-provider.service';
import { WorklogService } from '../worklog.service';
import { ViewEventModalComponent } from '../view-event-modal/view-event-modal.component';

@Component ({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: [ './main.component.scss' ]
})
export class MainComponent implements OnInit {


  @ViewChild ('calendarComponent') calendarComponent: FullCalendarComponent;
  @ViewChild ('mymodal') mymodal;
  @ViewChild ('createEventModel') createEventModel;
  @Output() logOff = new EventEmitter<void> ();

  calendarVisible = true;
  calendarOptions: CalendarOptions = {
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    },
    initialView: 'timeGridWeek',
    weekends: true,
    themeSystem: 'bootstrap5',
    businessHours: {
      // days of week. an array of zero-based day of week integers (0=Sunday)
      dow: [ 1, 2, 3, 4, 5 ], // Monday - Thursday

      start: '10:00', // a start time (10am in this example)
      end: '18:00', // an end time (6pm in this example)
    },
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    select: this.handleDateSelect.bind (this),
    eventClick: this.handleEventClick.bind (this),
    events: this.fetchEvents.bind (this),
    eventDrop: this.eventDrop.bind (this),
    eventResize: this.eventResize.bind (this),
    height:'100%',
    /* you can update a remote database when these fire:
    eventAdd:
    eventChange:
    eventRemove:
    */
  };
  currentEvents: EventApi[] = [];

  private closeResult: string;

  constructor(
    private modalService: NgbModal,
    private jiraService: JiraService,
    private profileService: ProfileProviderService,
    private worklogService: WorklogService
  ) {
  }

  ngOnInit() {
  }


  handleCalendarToggle() {
    this.calendarVisible = !this.calendarVisible;
  }

  handleWeekendsToggle() {
    const { calendarOptions } = this;
    calendarOptions.weekends = !calendarOptions.weekends;
  }

  handleDateSelect(selectInfo: DateSelectArg) {
    const modelRef = this.modalService.open (AddEventModalComponent);
    modelRef.componentInstance.acceptParameters (selectInfo);
    modelRef.componentInstance.saved.subscribe (d => {
      console.log ('refetched');
      this.calendarComponent.getApi ().refetchEvents ();
    });
  }

  handleEventClick(clickInfo: EventClickArg) {
    const modelRef = this.modalService.open (ViewEventModalComponent);
    modelRef.componentInstance.acceptParameters (clickInfo.event.id);
    modelRef.componentInstance.saved.subscribe (d => {
      console.log ('refetched');
      this.calendarComponent.getApi ().refetchEvents ();
    });
  }

  fetchEvents(fetchInfo, success, failure) {
    this.worklogService.events (fetchInfo.start, fetchInfo.end)
      .then (success)
      .then (fetchInfo);
  }

  eventDrop(e) {
    if (e.delta.years !== 0 || e.delta.months !== 0) {
      e.revert ();
      return;
    }
    this.worklogService
      .moveWorklog (e.event.id, e.delta.days, e.delta.milliseconds / 1000);
    // .then (this.calendarComponent.getApi ().refetchEvents);
  }

  eventResize(e) {
    if (e.endDelta.days !== 0) {
      e.revert ();
      return;
    }
    this.worklogService
      .resizeWorklog (
        e.event.id,
        e.startDelta.milliseconds / 1000,
        e.endDelta.milliseconds / 1000);
    // .then (this.calendarComponent.getApi ().refetchEvents);
  }

  getProfile() {


    this.jiraService.getProfile (this.profileService.currentAccount).then (result => console.log (result));
  }

  getTickets() {
    const modelRef = this.modalService.open (AddEventModalComponent);
    modelRef.componentInstance.input = { name: 'suresh' };

    // this.modalService.open(this.createEventModel,{}).result.then(console.log, console.log);
  }


  doLogoff(event) {
    this.logOff.emit ();
  }
}
