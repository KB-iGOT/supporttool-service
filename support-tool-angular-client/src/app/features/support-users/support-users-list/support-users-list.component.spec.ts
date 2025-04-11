import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupportUsersListComponent } from './support-users-list.component';

describe('SupportUsersListComponent', () => {
  let component: SupportUsersListComponent;
  let fixture: ComponentFixture<SupportUsersListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SupportUsersListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupportUsersListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
