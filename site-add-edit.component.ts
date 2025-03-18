import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, HostBinding, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AutomationClassDirective } from 'src/app/common/directives/automation-class.directive';
import { ComponentLoaderDirective } from 'src/app/common/directives/component-loader-directive';
import { PipesModule } from 'src/app/common/pipes/pipes.module';
import { ActivatedRoute, Router } from '@angular/router';
import { ComponentUtility } from 'src/app/common/services/helpers/component.utility.service';
import { ToastService } from 'src/app/common/services/toast.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subject, debounceTime } from 'rxjs';
import { ConfirmationDialogComponent } from 'src/app/common/components/confirmation-dialog/confirmation-dialog.component';
/* eslint-disable import/no-extraneous-dependencies */
import { DialogService } from 'primeng/dynamicdialog';
import {
  Countries,
  Site,
  SiteDetailsResponse,
  SiteGroup,
} from '../../interfaces/location.interface';
import { MetadataService } from '../../services/metadata.service';
import { LocationService } from '../../services/location.service';
import {
  AutomationTagPrefix,
  DEFAULT_COORDINATE,
  INVALID_ARGUMENT,
  REGULAR_EXPRESSION,
  debounceTimeMs,
} from '../../constants/LocationsApiConstants';
import { MapFormComponent } from '../forms/map-form/map-form.component';
import { ROUTE_CONSTANTS } from '../../constants/RouteConstants';

@UntilDestroy()
@Component({
  selector: 'cls-mfe-site-add-edit',
  standalone: true,
  imports: [
    CommonModule,
    PipesModule,
    AutomationClassDirective,
    ReactiveFormsModule,
    ComponentLoaderDirective,
    MapFormComponent,
  ],
  templateUrl: './site-add-edit.component.html',
  styleUrls: ['./site-add-edit.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SiteAddEditComponent implements OnInit {
  @HostBinding('class') classes = 'component-height';

  @ViewChild(MapFormComponent) mapFormComponent!: MapFormComponent;
  private searchSubject = new Subject<string>();
  // @ts-ignore
  siteForm: FormGroup<any>;
  loading: boolean = false;
  AutomationTag: string = `${AutomationTagPrefix}-mfe-site`;
  isSubmitted: boolean = false;
  countries: Array<Countries> = [];
  filterCountries: Array<Countries> = [];
  toggleAddress: boolean = false;
  dynamicValidateControllers = ['address.address', 'address.city', 'address.state'];
  searchQuery: string = '';
  edit: boolean = false;
  duplicateName: boolean = false;
  siteGroupList!: Array<SiteGroup>;
  filterSiteGroupList: Array<SiteGroup> = [];
  loadUIContent: boolean = false;
  defaultRestrictedCountry = {
    name: DEFAULT_COORDINATE.country,
    code: DEFAULT_COORDINATE.defaultRegion,
  };

  siteDetails: Site = {
    id: 0,
    parent_id: '',
    name: '',
    address: {
      address: '',
      address2: '',
      city: '',
      postal_code: '',
      state: '',
    },
    country_code: '',
  };

  errorMessage: any = {
    name1: 'PLEASE_ENTER_SITE_NAME',
    'address.address1': 'PLEASE_ENTER_ADDRESS_NAME',
    'address.city1': 'PLEASE_ENTER_CITY_NAME',
    'address.state1': 'PLEASE_ENTER_STATE_NAME',
    country_code1: 'PLEASE_SELECT_COUNTRY_NAME',
  };

  constructor(
    private formBuilder: FormBuilder,
    private readonly metadataService: MetadataService,
    private readonly locationService: LocationService,
    public componentUtility: ComponentUtility,
    private readonly toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute,
    public dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.getCountryData();
    if (this.route.snapshot?.params['id']) {
      this.edit = true;
      this.initalizeComponent();
    } else {
      this.initalizeComponent();
    }
    this.initalizeSearchSubject();
  }

  initalizeForm() {
    this.siteForm = this.formBuilder.group({
      name: [
        this.siteDetails?.name,
        [Validators.required, Validators.pattern(REGULAR_EXPRESSION.LEADING_AND_TRAILING_SPACE)],
      ],
      parent_id: [this.siteDetails?.parent_id],
      address: this.formBuilder.group({
        address: [this.siteDetails?.address?.address],
        address2: [this.siteDetails?.address?.address2],
        city: [this.siteDetails?.address?.city],
        state: [this.siteDetails?.address?.state],
        postal_code: [this.siteDetails?.address?.postal_code],
      }),
      country_code: [this.siteDetails?.country_code, Validators.required], // It's hard coded. bcz Form control does not work with EN dropdown
    });
  }

  initalizeSearchSubject(): void {
    this.searchSubject
      .pipe(debounceTime(debounceTimeMs))
      .pipe(untilDestroyed(this))
      .subscribe((searchValue: string) => {
        this.performSearch(searchValue);
      });
  }

  getCountryData() {
    this.metadataService
      .getCountryData()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: data => {
          this.countries = [...data];
          this.filterCountries = [...data];
        },
      });
  }

  initalizeComponent() {
    this.loading = true;
    this.locationService
      .getSiteGroupList()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (response: any) => {
          this.siteGroupList = response?.data;
          this.filterSiteGroupList = response?.data;
          if (this.edit) {
            this.getSiteDetails(this.route.snapshot?.params['id']);
          } else {
            this.siteDetails.parent_id = this.route.snapshot?.params['parentId'];
            this.initalizeForm();
            this.loadUIContent = true;
            this.loading = false;
          }
        },
        error: err => {
          this.toastService.showError({ body: this.componentUtility.getErrorMessage(err) });
          this.loading = false;
          this.close();
        },
      });
  }

  getSiteDetails(id: number) {
    this.locationService
      .getSiteDetails(id)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (data: Site) => {
          this.siteDetails = data;
          this.setSiteValueToForm();
        },
        error: err => {
          this.loading = false;
          this.toastService.showError({ body: this.componentUtility.getErrorMessage(err) });
          this.close();
        },
      });
  }

  setSiteValueToForm() {
    this.siteDetails.country_code = this.siteDetails?.country_code?.toString();
    this.siteDetails.parent_id = this.siteDetails.parent_id?.toString();
    this.initalizeForm();
    this.loadUIContent = true;
    if (this.siteDetails?.address?.address.length) {
      this.toggleButton();
    }
    this.onSearch();
    this.siteForm.markAsDirty();
    this.loading = false;
  }

  createSite() {
    if (this.siteForm?.invalid) {
      return false;
    }
    this.loading = true;
    const requestPayload = this.preparePayload(this.siteForm?.value);
    this.locationService
      .createSite(requestPayload)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (data: SiteDetailsResponse) => {
          this.loading = false;
          this.toastService.showSuccess({
            body: `${data?.name} ${this.componentUtility.getLabel('SUCCESSFULLY_ADDED')}`,
          });
          this.close();
        },
        error: err => {
          this.loading = false;
          this.toastService.showError({ body: this.componentUtility.getErrorMessage(err) });
          if (err.error_code === INVALID_ARGUMENT) {
            this.duplicateName = true;
          } else {
            this.close();
          }
        },
      });
    return false;
  }

  updateSiteDetails() {
    if (this.siteForm?.invalid) {
      return false;
    }
    this.loading = true;
    const requestPayload = this.preparePayload(this.siteForm?.value);
    this.locationService.updateSite(requestPayload, this.route.snapshot?.params['id']).subscribe({
      next: (data: SiteDetailsResponse) => {
        this.loading = false;
        this.toastService.showSuccess({
          body: `${data?.name} ${this.componentUtility.getLabel('SUCCESSFULLY_EDITED')}`,
        });
        this.close();
      },
      error: err => {
        this.toastService.showError({ body: this.componentUtility.getErrorMessage(err) });
        this.loading = false;
      },
    });
    return true;
  }

  preparePayload(formValue: any) {
    if (
      this.siteForm?.get('address.address')?.value === '' ||
      this.siteForm?.get('address.address')?.value === undefined ||
      this.siteForm?.get('address.address')?.value === null
    ) {
      delete formValue?.address;
    }
    if (typeof formValue?.parent_id === 'string') {
      formValue.parent_id = parseInt(formValue?.parent_id);
    }
    if (typeof formValue?.country_code === 'string') {
      formValue.country_code = parseInt(formValue?.country_code);
    }
    return formValue;
  }

  onSearch() {
    let country = '';
    if (this.siteForm?.get('country_code')?.value) {
      this.countries.forEach(option => {
        if (option.country_code === parseInt(this.siteForm?.get('country_code')?.value)) {
          this.defaultRestrictedCountry = {
            name: option?.name_en,
            code: option?.alpha2_code,
          };
          country = option?.name_en;
        }
      });
    }
    const address = this.siteForm?.get('address.address')?.value;
    const address2 = this.siteForm?.get('address.address2')?.value;
    const city = this.siteForm?.get('address.city')?.value;
    const state = this.siteForm?.get('address.state')?.value;
    const postalCode = this.siteForm?.get('address.postal_code')?.value;
    const fullAddress = `${address}, ${address2}, ${city}, ${state} ${postalCode}, ${country}`;
    this.searchSubject.next(fullAddress);
    if (
      (address === null || address === undefined || address === '') &&
      (address2 === null || address2 === undefined || address2 === '') &&
      (city === null || city === undefined || city === '') &&
      (state === null || state === undefined || state === '') &&
      (postalCode === null || postalCode === undefined || postalCode === '')
    ) {
      this.removeValidationFromAddress();
    } else {
      this.applyValidationFromAddress();
    }
  }

  resetAddressObject() {
    this.siteForm?.get('address')?.setValue({
      address: '',
      address2: '',
      city: '',
      state: '',
      postal_code: '',
    });
  }

  performSearch(searchValue: string) {
    this.mapFormComponent.search(searchValue);
  }

  getMarkerAddressDetails(address: any) {
    this.siteForm?.get('address.address')?.setValue(address?.fullAddress);
    this.siteForm?.get('address.city')?.setValue(address?.city);
    this.siteForm?.get('address.state')?.setValue(address?.state);
    this.siteForm?.get('address.postal_code')?.setValue(address?.postalCode);
    if (!this.toggleAddress) {
      this.applyValidationFromAddress();
      this.toggleAddress = true;
    }
  }

  applyValidationFromAddress() {
    this.dynamicValidateControllers.forEach(controlName => {
      const newValidators = [
        Validators.required,
        Validators.pattern(REGULAR_EXPRESSION.LEADING_AND_TRAILING_SPACE),
      ];
      this.siteForm?.get(controlName)?.setValidators(newValidators);
      this.siteForm?.get(controlName)?.updateValueAndValidity();
    });
  }

  removeValidationFromAddress() {
    this.dynamicValidateControllers.forEach(controlName => {
      this.siteForm?.get(controlName)?.clearValidators();
      this.siteForm?.get(controlName)?.updateValueAndValidity();
    });
  }

  toggleButton() {
    this.toggleAddress = !this.toggleAddress;
  }

  dropdownfilter(e: any, type: string) {
    const searchitem = e?.detail.value;
    if (type === 'country' && searchitem === undefined) {
      this.filterCountries = this.countries;
    } else if (type === 'country' && searchitem !== undefined) {
      this.filterCountries = this.countries.filter(option =>
        option?.name_en?.toLowerCase().includes(searchitem?.toLowerCase())
      );
    } else if (type === 'association' && searchitem === undefined) {
      this.filterSiteGroupList = this.siteGroupList;
    } else if (type === 'association' && searchitem !== undefined) {
      this.filterSiteGroupList = this.siteGroupList.filter(option =>
        option?.name?.toLowerCase().includes(searchitem?.toLowerCase())
      );
    }
  }

  setDropDownData(formControl: string, value: any) {
    if (typeof value === 'number') {
      this.siteForm?.get(formControl)?.setValue(value.toString());
    } else {
      this.siteForm?.get(formControl)?.setValue(value);
    }
  }

  clearDropdown() {
    this.siteForm?.get('parent_id')?.setValue(null);
    this.siteForm?.get('parent_id')?.markAsDirty();
  }

  close() {
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
        this.close();
      }
    });
  }

  isValidController(control: string) {
    let message = '';
    if (
      (this.siteForm?.get(control)?.touched || this.siteForm?.get(control)?.dirty) &&
      this.siteForm.get(control)?.hasError('required')
    ) {
      message = this.errorMessage[`${control}1`];
    } else if (
      (this.siteForm?.get(control)?.touched || this.siteForm?.get(control)?.dirty) &&
      this.siteForm.get(control)?.hasError('pattern')
    ) {
      message = 'LEADING_AND_TRAILING_SPACE';
    }
    return message;
  }
}
