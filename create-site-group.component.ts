import { CUSTOM_ELEMENTS_SCHEMA, Component, HostBinding, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ENModule } from 'en-angular';
import { PipesModule } from 'src/app/common/pipes/pipes.module';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AutomationClassDirective } from 'src/app/common/directives/automation-class.directive';
import { ToastService } from 'src/app/common/services/toast.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ComponentUtility } from 'src/app/common/services/helpers/component.utility.service';
import { ComponentLoaderDirective } from 'src/app/common/directives/component-loader-directive';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationDialogComponent } from 'src/app/common/components/confirmation-dialog/confirmation-dialog.component';
import { DialogService } from 'primeng/dynamicdialog';
import { AutomationTagPrefix, REGULAR_EXPRESSION } from '../../constants/LocationsApiConstants';
import { LocationService } from '../../services/location.service';
import { ROUTE_CONSTANTS } from '../../constants/RouteConstants';
import { SiteGroup } from '../../interfaces/location.interface';

@UntilDestroy()
@Component({
  selector: 'cls-mfe-create-site-group',
  standalone: true,
  imports: [
    CommonModule,
    ENModule,
    PipesModule,
    AutomationClassDirective,
    ReactiveFormsModule,
    ComponentLoaderDirective,
  ],
  templateUrl: './create-site-group.component.html',
  styleUrls: ['./create-site-group.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CreateSiteGroupComponent implements OnInit {
  @HostBinding('class') classes = 'component-height';

  siteGroupForm!: FormGroup;
  AutomationTag: string = `${AutomationTagPrefix}-mfe-create-site-group`;
  loading: boolean = false;
  siteGroupDetails: SiteGroup = {
    id: 0,
    create_time: '',
    update_time: '',
    org_id: 0,
    parent_id: null,
    name: '',
    type: '',
    description: '',
  };

  isEdit: boolean = false;
  editGroupId!: number;
  parentSgData!: SiteGroup[];
  filteredSiteGroupList!: SiteGroup[];
  isFormInitialized: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private readonly locationService: LocationService,
    private readonly toastService: ToastService,
    private componentUtility: ComponentUtility,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    public dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.isFormInitialized = false;
    if (this.activatedRoute.snapshot?.params['id']) {
      this.isEdit = true;
      this.editGroupId = this.activatedRoute.snapshot.params['id'];
    }
    this.getParentSiteGroupList();
  }

  getParentSiteGroupList() {
    this.loading = true;
    this.locationService
      .getSiteGroupList()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (response: any) => {
          this.loading = false;
          this.parentSgData = response?.data ?? [];
          this.filteredSiteGroupList = this.parentSgData;
          if (this.isEdit) {
            this.getSiteGroupDetails(this.editGroupId);
          } else {
            if (this.activatedRoute.snapshot?.params['parentId']) {
              this.parentSgData.forEach((group: any) => {
                if (group.id === parseInt(this.activatedRoute.snapshot.params['parentId'])) {
                  this.siteGroupDetails.parent_id = group.name;
                }
              });
            }
            this.initalizeForm();
          }
        },
        error: err => {
          this.loading = false;
          this.toastService.showError({ body: err?.error_message });
          this.cancelSiteGroup();
        },
      });
  }

  getSiteGroupDetails(groupId: number) {
    this.loading = true;
    this.locationService
      .getSiteGroup(groupId)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (response: any) => {
          this.loading = false;
          this.siteGroupDetails = response;
          this.parentSgData.forEach((group: any) => {
            if (group.id === this.siteGroupDetails.parent_id) {
              this.siteGroupDetails.parent_id = group.name;
            }
          });
          this.initalizeForm();
        },
        error: err => {
          this.loading = false;
          this.toastService.showError({ body: err?.error_message });
          this.cancelSiteGroup();
        },
        complete: () => {
          this.loading = false;
        },
      });
  }

  initalizeForm() {
    this.siteGroupForm = this.formBuilder.group({
      name: [
        this.siteGroupDetails?.name,
        [
          Validators.required,
          Validators.pattern(REGULAR_EXPRESSION.LEADING_AND_TRAILING_SPACE),
        ],
      ],
      parent_id: [this.siteGroupDetails?.parent_id],
    });
    this.isFormInitialized = true;
  }

  saveSiteGroup() {
    if (this.isEdit) {
      this.editSiteGroup();
    } else {
      this.createSiteGroup();
    }
  }

  createSiteGroup() {
    this.loading = true;
    if (this.siteGroupForm.invalid) {
      return;
    }
    const requestPayload = this.siteGroupForm.value;
    this.parentSgData.forEach((group: SiteGroup) => {
      if (group.name === requestPayload.parent_id) {
        requestPayload.parent_id = group.id;
      }
    });
    this.locationService
      .createSiteGroup(requestPayload)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (data: any) => {
          this.loading = false;
          this.toastService.showSuccess({
            body: `${data?.name} ${this.componentUtility.getLabel('SUCCESSFULLY_GROUP_CREATED')}`,
          });
          this.cancelSiteGroup();
        },
        error: err => {
          this.loading = false;
          this.toastService.showError({ body: err?.error_message });
        },
      });
  }

  editSiteGroup() {
    this.loading = true;
    if (this.siteGroupForm.invalid) {
      return;
    }
    const requestPayload = this.siteGroupForm.value;
    this.parentSgData.forEach((group: SiteGroup) => {
      if (group.name === requestPayload.parent_id) {
        requestPayload.parent_id = group.id;
      }
    });
    this.locationService
      .updateSiteGroup(requestPayload, this.editGroupId)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (data: any) => {
          this.loading = false;
          this.toastService.showSuccess({
            body: `${data?.name} ${this.componentUtility.getLabel('SUCCESSFULLY_EDITED')}`,
          });
          this.cancelSiteGroup();
        },
        error: err => {
          this.toastService.showError({ body: err?.error_message });
          this.loading = false;
        },
      });
  }

  cancelSiteGroup() {
    this.router.navigate([`/${ROUTE_CONSTANTS.DASHBOARD}`]);
  }

  confirmationDialog() {
    const dialogRef = this.dialogService.open(ConfirmationDialogComponent, {
      data: {
        title: `${this.componentUtility.getLabel('CONFIRMATION')}`,
        message: `${this.componentUtility.getLabel('CONFIRMATION_MESSAGE')}`,
        primaryButtonText: `${this.componentUtility.getLabel('CONFIRM')}`,
        secondaryButtonText: `${this.componentUtility.getLabel('CANCEL')}`,
      },
      header: `${this.componentUtility.getLabel('CONFIRMATION')}`,
      height: '265px',
      width: '550px',
    });
    dialogRef.onClose.subscribe(result => {
      if (result) {
        this.cancelSiteGroup();
      }
    });
  }

  get validateName() {
    let errorMessage = '';
    if (this.siteGroupForm.get('name')?.touched || this.siteGroupForm.get('name')?.dirty) {
      if (this.siteGroupForm.get('name')?.hasError('required')) {
        errorMessage = 'PLEASE_ENTER_SITE_GROUP_NAME';
      } else if (this.siteGroupForm.get('name')?.hasError('pattern')) {
        errorMessage = 'LEADING_AND_TRAILING_SPACE';
      }
    }
    return errorMessage;
  }

  dropdownFilter(event: any) {
    const searchItem = event?.detail.value;
    if (searchItem) {
      this.filteredSiteGroupList = this.parentSgData.filter(option =>
        option?.name?.toLowerCase().includes(searchItem?.toLowerCase())
      );
    } else {
      this.filteredSiteGroupList = this.parentSgData;
    }
  }

  clearDropdown(event: any) {
    this.siteGroupForm.get('parent_id')?.setValue(null);
    this.siteGroupForm.get('parent_id')?.markAsDirty();
  }
}
