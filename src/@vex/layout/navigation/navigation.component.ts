import { Component, OnInit } from '@angular/core';
import { NavigationService } from '../../services/navigation.service';

@Component({
  selector: 'vex-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
  standalone: false
})
export class NavigationComponent implements OnInit {

  items = this.navigationService.items;

  constructor(private navigationService: NavigationService) { }

  ngOnInit() {
  }
}
