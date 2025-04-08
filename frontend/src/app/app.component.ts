import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, NgbModule],
    templateUrl: './app.component.html',
    styles: [],
})
export class AppComponent {
    
}
