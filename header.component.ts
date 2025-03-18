import { Component, OnInit, ViewChild, TemplateRef, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ProjectsService } from '../shared/Projects/projects.service';
import { ProfileDialogComponent } from '../profile-dialog/profile-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { IStepOption, TourService } from 'ngx-ui-tour-md-menu';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  @ViewChild('logoutConfirmationDialog', { static: true }) logoutConfirmationDialog!: TemplateRef<any>;
  currentRoute: string = '';
  projectName: string = '';
  logos: { src: string, alt: string, show: boolean }[] = [];
  pageTitle: string = '';
  projectCount: number = 0;
  userName: string | undefined = '';
  userType: string | null = '';

  constructor(private router: Router, private projectService: ProjectsService, private dialog: MatDialog , private readonly tourService:TourService) { 
  }

  public readonly steps: IStepOption[] = [
    {
      anchorId: 'start-button', 
      title: 'Welcome',
      content: 'Welcome to the demo tour!',
      enableBackdrop: true,
      backdropConfig: {
      offset: 10,
    },
    route:'project'
    },
 
    {
      anchorId: 'add-project', 
      title: 'Project',
      content: 'Click here to add a new project!',
      route: 'project', 
      enableBackdrop: true,
      backdropConfig: {
      offset: 10,
    }, 

    }, 
    {
      anchorId: 'project', 
      title: 'Project-details',
      content: 'Click here to get into the project!',
      enableBackdrop: true,
      backdropConfig: {
      offset: 10,
    },
     },
    {
      anchorId: 'project-details', 
      title: 'Code-details',
      content: 'Click here to get into the code-details!',
      route:'testcase',
      enableBackdrop: true,
      backdropConfig: {
      offset: 10,
    },
    },  
    {
      anchorId: 'code-details', 
      title: 'Add-code',
      content: 'Open any file to execute!',
      route:'code-editor',
      enableBackdrop: true,
      backdropConfig: {
      offset: 10,
    },

    },
    {
      anchorId: 'execute-details', 
      title: 'Execute-Code',
      content: 'Click to execute the file!',
      enableBackdrop: true,  // Enable backdrop for this step
      backdropConfig: {
        offset: 20,  // Adjust the offset for the backdrop
      },
    },  
    {
      anchorId: 'ai-detail', 
      title: 'AI-details',
      content: 'Click here to get into the ai-details!',
      route:'test-case',
      enableBackdrop: true, 
      backdropConfig: {
        offset: 20,  
      },
    },
  ];

  ngOnInit(): void {
    this.userName = localStorage.getItem('email')?.split('@')[0];
    this.userType = localStorage.getItem('type');
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateRoute();
    });
    this.fetchProjectCount();

    this.projectService.updateNotifier$.subscribe(() => {
      this.fetchProjectCount();
    });

    this.tourService.initialize(this.steps, {
      enableBackdrop: true,
      backdropConfig: {
        offset: 10,
      },
    });

  }

  private updateRoute() {
    this.currentRoute = this.router.url.split('/')[1];

    switch (this.currentRoute) {
      case 'testcase':
      case 'code-editor':
        this.projectName = localStorage.getItem('projectName') || 'null';
        this.logos = this.getLogosFromLocalStorage();
        this.pageTitle = this.currentRoute === 'testcase' ? 'Test Case' : 'Code Editor';
        break;
      case 'project':
        // this.pageTitle = `Projects (${this.projectCount})`;
        this.pageTitle = 'Projects';
        this.projectCount = this.projectCount;
        this.projectName = '';
        this.logos = [];
        break;
      case 'dashboard':
        this.pageTitle = 'Dashboard';
        this.projectName = '';
        this.logos = [];
        break;
      case 'user-management':
        this.pageTitle = 'User Management';
        this.projectName = '';
        this.logos = [];
        break;
      case 'test-case':
        this.pageTitle = 'Test Cases';
        this.projectName = '';
        this.logos = [];
        break;
      case 'container-status':
        this.pageTitle = 'Container Status';
        this.projectName = '';
        this.logos = [];
        break;
      case 'help-section':
        this.pageTitle = 'Help';
        this.projectName = '';
        this.logos = [];
        break;
      case 'scheduler':
        this.pageTitle = 'Scheduler';
        this.projectName = '';
        this.logos = [];
        break;
      default:
        this.pageTitle = 'Default Title';
        this.projectName = '';
        this.logos = [];
        break;
    }

  }

  private getLogosFromLocalStorage() {
    const logos = [
      { src: 'assets/images/appium-with-name.png', alt: 'Appium Logo', show: false},
      { src: 'assets/images/RequestApilogo.png', alt: 'RequestApi Logo', show: false },
      { src: 'assets/images/robotlogo.png', alt: 'Robot Logo', show: false },
      { src: 'assets/images/playwrightlogo.png', alt: 'Playwright Logo', show: false },
      { src: 'assets/images/pytestlogo.png', alt: 'Pytest Logo', show: false },
      { src: 'assets/images/testnglogo.png', alt: 'TestNG Logo', show: false },
      { src: 'assets/images/cucumberlogo.png', alt: 'Cucumber Logo', show: false },
      { src: 'assets/images/csharplogo.png', alt: 'C# Logo', show: false }
    ];

    const libraryInstallationJson = localStorage.getItem('libraryInstallation');
    if (libraryInstallationJson) {
      try {
        const libraryInstallation: string[] = JSON.parse(libraryInstallationJson);
        logos.forEach(logo => {
          if (libraryInstallation.includes(this.getLibraryName(logo.alt))) {
            logo.show = true;
          }
        });
      } catch (error) {
        console.error('Error parsing library installation data:', error);
      }
    } else {
      console.warn('No library installation data found in localStorage.');
    }

    return logos;
  }

  private getLibraryName(alt: string): string {
    const names: { [key: string]: string } = {
      'RequestApi Logo': 'RequestApi',
      'Robot Logo': 'Robot',
      'Playwright Logo': 'Playwright',
      'Pytest Logo': 'Pytest',
      'TestNG Logo': 'TestNG',
      'Cucumber Logo': 'Cucumber',
      'C# Logo': 'C#',
      'Appium Logo': 'Appium'
    };
    return names[alt] || '';
  }


  logout(): void {
    const dialogRef = this.dialog.open(this.logoutConfirmationDialog, {
      width: ' 500px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        localStorage.removeItem('authToken');
        this.router.navigate(['/']);
      }
    });
  }

  closeDialog(): void {
    this.dialog.closeAll();
  }

  confirmLogout(): void {
    this.closeDialog();
    const dialogRef = this.dialog.open(this.logoutConfirmationDialog, {
      width: '500px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.performLogout();
      }
    });
  }

  performLogout(): void {
    this.closeDialog();
    localStorage.removeItem('token');
    localStorage.removeItem('userRoles');
    localStorage.removeItem('userid');
    this.router.navigate(['/login']);
  }

  openProfileDialog(isChangePassword:boolean) {
    const dialogRef = this.dialog.open(ProfileDialogComponent, {
      width: '800px',
      // height: '575px'
    });
    dialogRef.componentInstance.isChangePassword = isChangePassword; 
    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
    });
  }

  navigateToHelpSection(): void {
    this.router.navigate(['/help-section']);
  }

  private fetchProjectCount() {
    this.projectService.getProjectdetails().subscribe((response: { data: never[]; }) => {
      const projectData = response.data || [];
      this.projectCount = projectData.length;
      this.updateRoute();
    }, (error: any) => {
      console.error('Error fetching project count:', error);
    });
  }
  startTour() {
    this.tourService.initialize(this.steps);
    this.tourService.start();
    // this.tourService.next(); // Go to the next step
  //  this.tourService.previous(); // Go to the previous step
  }
}
