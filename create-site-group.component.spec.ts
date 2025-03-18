import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { PipesModule } from 'src/app/common/pipes/pipes.module';
import { provideMockStore } from '@ngrx/store/testing';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ActivatedRoute } from '@angular/router';
import { CreateSiteGroupComponent } from './create-site-group.component';
import { LocationService } from '../../services/location.service';
import { of, throwError } from 'rxjs';
import { FormBuilder } from '@angular/forms';

describe('CreateSiteGroupComponent', () => {
  let component: CreateSiteGroupComponent;
  let fixture: ComponentFixture<CreateSiteGroupComponent>;
  const initialState = {};
  let activatedRouteMock: { snapshot: { params: { id?: number; parentId?: number } } };
  let formBuilder: FormBuilder;
  let dialogServiceSpy: jest.SpyInstance;

  beforeEach(async () => {
    activatedRouteMock = { snapshot: { params: {} } };
    formBuilder = new FormBuilder();
    await TestBed.configureTestingModule({
      imports: [CreateSiteGroupComponent, HttpClientModule, PipesModule],
      providers: [
        HttpClient,
        DialogService,
        provideMockStore(initialState),
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: FormBuilder, useValue: formBuilder },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateSiteGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const dialogRef = new DynamicDialogRef();
    dialogServiceSpy = jest.spyOn(TestBed.inject(DialogService), 'open').mockReturnValue(dialogRef);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open the page in add mode and fetch the parent site group data', () => {
    const locationService = TestBed.inject(LocationService);
    const mockData = {
      data: [
        {
          "id": 5106716214991,
          "create_time": "2024-02-08T09:13:39Z",
          "update_time": "2024-02-08T09:13:39Z",
          "org_id": 0,
          "parent_id": 5106716214983,
          "name": "groupA1",
          "type": "SiteGroup",
          "description": ""
        },
      ]
    };

    jest.spyOn(locationService, "getSiteGroupList").mockReturnValue(of(mockData));

    component.getParentSiteGroupList();
    expect(locationService.getSiteGroupList).toHaveBeenCalled();
    expect(component.parentSgData).toEqual(mockData.data);
  });

  it('should handle the error from the Site Group List API', () => {
    const locationService = TestBed.inject(LocationService);
    const errorResponse = { error_message: 'An error occured'};

    jest.spyOn(locationService, "getSiteGroupList").mockReturnValue(throwError(errorResponse));
    component.getParentSiteGroupList();
    expect(locationService.getSiteGroupList).toHaveBeenCalled();
  });

  it('should open the add site group at 2nd level', () => {
    const locationService = TestBed.inject(LocationService);
    let siteGroupId = 5106716214991;
    activatedRouteMock.snapshot.params.parentId =siteGroupId;

    const mockParentSgData = {
      data: [
        {
          "id": 5106716214991,
          "create_time": "2024-02-08T09:13:39Z",
          "update_time": "2024-02-08T09:13:39Z",
          "org_id": 0,
          "parent_id": 5106716214983,
          "name": "groupA1",
          "type": "SiteGroup",
          "description": ""
        },
      ]
    };
    jest.spyOn(locationService, "getSiteGroupList").mockReturnValue(of(mockParentSgData));

    component.ngOnInit();
    expect(locationService.getSiteGroupList).toHaveBeenCalled();
    expect(component.siteGroupDetails.parent_id).toBe('groupA1');
  });

  it('should save the add site group form', () => {
    const locationService = TestBed.inject(LocationService);
    component.siteGroupForm = formBuilder.group({
      name: 'siteGroupA1',
      parent_id: 'groupA1',
    });
    component.parentSgData = [
      {
        "id": 5106716214991,
        "create_time": "2024-02-08T09:13:39Z",
        "update_time": "2024-02-08T09:13:39Z",
        "org_id": 0,
        "parent_id": 5106716214983,
        "name": "groupA1",
        "type": "SiteGroup",
        "description": ""
      },
    ];

    jest.spyOn(locationService, "createSiteGroup").mockReturnValue(of({}));

    component.saveSiteGroup();
  });

  it('should handle the error from create Site Group API', () => {
    const locationService = TestBed.inject(LocationService);
    const errorResponse = { error_message: 'An error occured'};
    component.siteGroupForm = formBuilder.group({
      name: 'siteGroupA1',
      parent_id: null,
    });
    component.parentSgData = [];

    jest.spyOn(locationService, "createSiteGroup").mockReturnValue(throwError(errorResponse));
    component.createSiteGroup();
    expect(locationService.createSiteGroup).toHaveBeenCalled();
  });

  it('should open the edit form', () => {
    const locationService = TestBed.inject(LocationService);
    let siteGroupId = 123456789;
    activatedRouteMock.snapshot.params.id = siteGroupId;

    const mockParentSgData = {
      data: [
        {
          "id": 5106716214991,
          "create_time": "2024-02-08T09:13:39Z",
          "update_time": "2024-02-08T09:13:39Z",
          "org_id": 0,
          "parent_id": 5106716214983,
          "name": "groupA1",
          "type": "SiteGroup",
          "description": ""
        },
      ]
    };
    jest.spyOn(locationService, "getSiteGroupList").mockReturnValue(of(mockParentSgData));
    
    const mockSiteGroupData = {
      "id": 4294967396044,
      "create_time": "2024-01-25T09:43:17Z",
      "update_time": "2024-01-25T09:43:17Z",
      "org_id": 0,
      "parent_id": 5106716214991,
      "name": "s1",
      "type": "SiteGroup",
      "description": ""
    };
    jest.spyOn(locationService, "getSiteGroup").mockReturnValue(of(mockSiteGroupData));
    
    component.ngOnInit();
    expect(component.isEdit).toBe(true);
    expect(locationService.getSiteGroup).toHaveBeenCalledWith(siteGroupId);
  });

  it('should handle the error from the Site Group API', () => {
    const locationService = TestBed.inject(LocationService);
    const errorResponse = { error_message: 'An error occured'};
    const siteGroupId = 123456789;

    jest.spyOn(locationService, "getSiteGroup").mockReturnValue(throwError(errorResponse));
    component.getSiteGroupDetails(siteGroupId);
    expect(locationService.getSiteGroup).toHaveBeenCalledWith(siteGroupId);
  });

  it('should save the edit site group form', () => {
    const locationService = TestBed.inject(LocationService);
    let siteGroupId = 123456789;
    activatedRouteMock.snapshot.params.id = siteGroupId;
    component.siteGroupForm = formBuilder.group({
      name: 'siteGroupA1',
      parent_id: 'groupA1',
    });
    component.parentSgData = [
      {
        "id": 5106716214991,
        "create_time": "2024-02-08T09:13:39Z",
        "update_time": "2024-02-08T09:13:39Z",
        "org_id": 0,
        "parent_id": 5106716214983,
        "name": "groupA1",
        "type": "SiteGroup",
        "description": ""
      },
    ];
    component.isEdit = true;

    jest.spyOn(locationService, "updateSiteGroup").mockReturnValue(of({}));
    component.saveSiteGroup();
  });

  it('should handle the error from edit Site Group API', () => {
    const locationService = TestBed.inject(LocationService);
    const errorResponse = { error_message: 'An error occured'};
    let siteGroupId = 123456789;
    activatedRouteMock.snapshot.params.id = siteGroupId;
    component.siteGroupForm = formBuilder.group({
      name: 'siteGroupA1',
      parent_id: null,
    });
    component.parentSgData = [];

    jest.spyOn(locationService, "updateSiteGroup").mockReturnValue(throwError(errorResponse));
    component.editSiteGroup();
    expect(locationService.updateSiteGroup).toHaveBeenCalled();
  });

  it('should open the cancel confirmation dialog', () => {
    component.confirmationDialog();
  })
});
