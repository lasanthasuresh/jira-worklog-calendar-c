import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewEventModalComponent } from './view-event-modal.component';

describe('ViewEventModalComponent', () => {
  let component: ViewEventModalComponent;
  let fixture: ComponentFixture<ViewEventModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewEventModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewEventModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
