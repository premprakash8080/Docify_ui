import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NewTaskModalComponent, NewTaskData } from './components/new-task-modal/new-task-modal.component';

interface TaskRow {
  id: string;
  title: string;
  dueDate: string;
  isOverdue: boolean;
  assignedNote: string;
  assignedTo: string;
  completed: boolean;
}

@Component({
  selector: 'vex-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    NewTaskModalComponent
  ]
})
export class TasksComponent {
  // Modal state
  isNewTaskModalOpen = false;
  activeTab = 'my-tasks';

  // Sample task data (matching Evernote example)
  tasks: TaskRow[] = [
    {
      id: '1',
      title: 'sdfgsdfg sdfgdfg',
      dueDate: 'Yesterday',
      isOverdue: true,
      assignedNote: 'Things to do',
      assignedTo: '-',
      completed: false
    }
  ];

  openNewTaskModal(): void {
    this.isNewTaskModalOpen = true;
  }

  closeNewTaskModal(): void {
    this.isNewTaskModalOpen = false;
  }

  onCreateTask(taskData: NewTaskData): void {
    // TODO: Implement task creation logic
    console.log('Creating task:', taskData);
    // You can add the task to the tasks array here
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }
}
