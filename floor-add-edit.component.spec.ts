import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { provideMockStore } from '@ngrx/store/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FloorAddEditComponent } from './floor-add-edit.component';

class MockLocationService {
  getBuildingList() {
    return of({ data: [] });
  }

  getFloorDetails(id: number) {
    return of({});
  }

  createFloor(payload: any) {
    return of({ name: 'Floor 1' });
  }

  updateFloor(payload: any, id: number) {
    return of({ name: 'Floor 1' });
  }

  uploadFloorPlan(file: any) {
    return of({});
  }
}

describe('FloorAddEditComponent', () => {
  let component: FloorAddEditComponent;
  let fixture: ComponentFixture<FloorAddEditComponent>;
  let mockLocationService: MockLocationService;
  const initialState = {};

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FloorAddEditComponent, HttpClientModule],
      providers: [
        FormBuilder,
        HttpClient,
        provideMockStore(initialState),
        { provide: ActivatedRoute, useValue: {} },
        { provide: MatDialogRef, useValue: {} },
        { provide: MatDialog, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FloorAddEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should initialize the floorForm with default values', () => {
    const formValues = component.floorForm?.value;
    if (formValues) {
      expect(formValues.name).toBe('');
      expect(formValues.parent_id).toBe('');
      expect(formValues.environment).toBe('');
      expect(formValues.db_attenuation).toBe('');
      expect(formValues.measurement_unit).toBe('');
      expect(formValues.installation_height).toBe('');
      expect(formValues.map_size_width).toBe('');
      expect(formValues.map_size_height).toBe('');
      expect(formValues.map_name).toBe('');
      expect(formValues.floor_plan_file).toBe(null);
    }
  });
  it('should mark form as invalid when required fields are not filled', () => {
    component.floorForm?.setValue({
      name: '',
      parent_id: '',
      environment: '',
      db_attenuation: '',
      measurement_unit: '',
      installation_height: '',
      map_size_width: '',
      map_size_height: '',
      map_name: '',
      floor_plan_file: null,
    });
    expect(component.floorForm?.valid).toBeFalsy();
  });

  


});
