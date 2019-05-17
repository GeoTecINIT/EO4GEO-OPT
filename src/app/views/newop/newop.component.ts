import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { OcupationalProfile } from '../../ocupational-profile';
import * as bok from '@eo4geo/bok-dataviz';
import { OcuprofilesService } from '../../services/ocuprofiles.service';
import { FieldsService, Field } from '../../services/fields.service';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-newop',
  templateUrl: './newop.component.html',
  styleUrls: ['./newop.component.scss']
})
export class NewopComponent implements OnInit {
  // TODO: Retrieve this from the DB
  competences = [
    'Team building',
    'Think creatively',
    'Manage time',
    'Demonstrate intercultural competence',
    'Work in an international environment',
    'Demonstrate willingness to learn',
    'Develop strategy to solve problems',
    'Identify opportunities',
    'Work independently',
    'Work efficientlyAdapt to change',
    'Digital competencies',
    'Meet commitments',
    'Attend to detail',
    'Interact with othersCope with pressure',
    'Manage frustrationListen actively',
    'Lead others',
    'Assertiveness',
    'Make decisions',
    'Motivate others',
    'Report facts',
    'Customer relationship management',
    'Show enterpreneurial spirit',
    'Develop company strategies',
    'Think proactively'
  ];

  filteredCompetences = [
    'Team building',
    'Think creatively',
    'Manage time',
    'Demonstrate intercultural competence',
    'Work in an international environment',
    'Demonstrate willingness to learn',
    'Develop strategy to solve problems',
    'Identify opportunities',
    'Work independently',
    'Work efficientlyAdapt to change',
    'Digital competencies',
    'Meet commitments',
    'Attend to detail',
    'Interact with othersCope with pressure',
    'Manage frustrationListen actively',
    'Lead others',
    'Assertiveness',
    'Make decisions',
    'Motivate others',
    'Report facts',
    'Customer relationship management',
    'Show enterpreneurial spirit',
    'Develop company strategies',
    'Think proactively'
  ];

  // tslint:disable-next-line:max-line-length
  model = new OcupationalProfile('', '', '', '', 1, [], [], []);

  public value: string[];
  public current: string;

  isFilteringCompetences = false;
  selectedProfile: OcupationalProfile;
  _id: string;

  fields: Observable<Field[]>;
  filteredFields = [];
  parentFields = [];
  hierarchyFields = {};

  @ViewChild('textBoK') textBoK: ElementRef;

  constructor(
    private elementRef: ElementRef,
    private occuprofilesService: OcuprofilesService,
    private fieldsService: FieldsService,
    private route: ActivatedRoute
  ) {
    console.log('newOP');
  }

  ngOnInit() {
    bok.visualizeBOKData('#bubbles', 'assets/saved-bok.xml', '#textBoK');
    this.getMode();
    this.fieldsService.subscribeToFields().subscribe(allfiel => {
      allfiel.forEach(f => {
       // tslint:disable-next-line:max-line-length
       this.hierarchyFields[f.greatgrandparent] ? this.hierarchyFields[f.greatgrandparent].push(f.name) : this.hierarchyFields[f.greatgrandparent] = []; 
      });
      this.parentFields = Object.keys(this.hierarchyFields);
    });
  }

  addCompetence(c: string) {
    this.model.competences.push(c);
    this.removeCompetence(c, this.filteredCompetences);
    this.isFilteringCompetences = false;
  }

  removeCompetence(name: string, array: string[]) {
    array.forEach((item, index) => {
      if (item === name) {
        array.splice(index, 1);
      }
    });
  }

  filterCompetence(ev) {
    this.isFilteringCompetences = true;
    const txt = ev.target.value.toUpperCase();
    this.filteredCompetences = [];
    this.competences.forEach(item => {
      if (item.toUpperCase().indexOf(txt) !== -1) {
        if (!this.model.competences.includes(item)) {
          this.filteredCompetences.push(item);
        }
      }
    });
  }

  filterField(ev) {
    // const txt = ev.target.value.toUpperCase();
    this.filteredFields = [];
  }

  addBokKnowledge() {
    const divs = this.textBoK.nativeElement.getElementsByTagName('div');

    if (divs['bokskills'] != null) {
      const as = divs['bokskills'].getElementsByTagName('a');

      for (const skill of as) {
        if (!this.model.skills.includes(skill.innerText)) {
          this.model.skills.push(skill.innerText);
        }
      }
    }

    const concept = this.textBoK.nativeElement.getElementsByTagName('h4')[0]
      .textContent;
    if (!this.model.knowledge.includes(concept)) {
      this.model.knowledge.push(concept);
    }
  }

  saveOccuProfile() {
    this.occuprofilesService.addNewOccuProfile(this.model);
  }

  getMode(): void {
    const mode = this.route.snapshot.paramMap.get('mode');
    if (mode === 'duplicate') {
      this.getOccuProfileId();
      this.fillForm();
    }
  }
  getOccuProfileId(): void {
    this._id = this.route.snapshot.paramMap.get('name');
    this.occuprofilesService
      .getOccuProfileById(this._id)
      .subscribe(profile => (this.selectedProfile = profile));
  }

  fillForm(): void {
    this.occuprofilesService
      .getOccuProfileById(this._id)
      .subscribe(profile => (this.model = profile));
  }
}
