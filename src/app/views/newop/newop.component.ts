import { Component, OnInit, ViewChild, ElementRef, TemplateRef } from '@angular/core';
import { OcupationalProfile, Competence } from '../../ocupational-profile';
import * as bok from '@eo4geo/find-in-bok-dataviz';
import { OcuprofilesService } from '../../services/ocuprofiles.service';
import { Organization, OrganizationService } from '../../services/organization.service';
import { FieldsService, Field } from '../../services/fields.service';
import { EscoCompetenceService } from '../../services/esco-competence.service';
import { ActivatedRoute } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import { User, UserService } from '../../services/user.service';
import { BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import { environment } from '../../../environments/environment';


@Component({
  selector: 'app-newop',
  templateUrl: './newop.component.html',
  styleUrls: ['./newop.component.scss']
})
export class NewopComponent implements OnInit {

  competences = [];
  filteredCompetences = [];
  fullcompetences = [];

  model = new OcupationalProfile('', '', '', '', '', '', '', null, 1, [], [], [], [], [], new Date().toDateString(), false, null, null);

  public value: string[];
  public current: string;

  selectedProfile: OcupationalProfile;
  _id: string;
  mode: string;
  title: string;

  closeResult = '';

  selectedNodes = [];
  hasResults = false;
  limitSearchFrom = 0;
  limitSearchTo = 10;
  currentConcept = 'GIST';

  isfullESCOcompetences = false;
  isShowingSkillsTip = false;

  associatedSkillsToDelete = 0;
  nameCodeToDelete = '';

  configFields = {
    displayKey: 'concatName', // if objects array passed which key to be displayed defaults to description
    search: true, // true/false for the search functionlity defaults to false,
    height: '200px', // height of the list so that if there are more no of items it can show a scroll defaults to auto.
    placeholder: 'Select Field', // text to be displayed when no item is selected defaults to Select,
    customComparator: () => { }, // a custom function to sort the items. default is undefined and Array.sort() will be used
    noResultsFound: 'No results found!', // text to be displayed when no items are found while searching
    searchPlaceholder: 'Search Field', // label thats displayed in search input,
    searchOnKey: 'concatName' // key on which search should be performed. if undefined this will be extensive search on all keys
  };

  configCompetences = {
    displayKey: 'preferredLabel', // if objects array passed which key to be displayed defaults to description
    search: true, // true/false for the search functionlity defaults to false,
    height: '200px', // height of the list so that if there are more no of items it can show a scroll defaults to auto.
    placeholder: 'Select transversal skill', // text to be displayed when no item is selected defaults to Select,
    customComparator: () => { }, // a custom function to sort the items. default is undefined and Array.sort() will be used
    moreText: 'transversal skills more', // text to be displayed whenmore than one items are selected like Option 1 + 5 more
    noResultsFound: 'No results found!', // text to be displayed when no items are found while searching
    searchPlaceholder: 'Search transversal skills', // label thats displayed in search input,
    searchOnKey: 'preferredLabel' // key on which search should be performed. if undefined this will be extensive search on all keys
  };

  configfullCompetences = {
    displayKey: 'preferredLabel', // if objects array passed which key to be displayed defaults to description
    search: true, // true/false for the search functionlity defaults to false,
    height: '200px', // height of the list so that if there are more no of items it can show a scroll defaults to auto.
    placeholder: 'Select transversal skill', // text to be displayed when no item is selected defaults to Select,
    customComparator: () => { }, // a custom function to sort the items. default is undefined and Array.sort() will be used
    moreText: 'transversal skills more', // text to be displayed whenmore than one items are selected like Option 1 + 5 more
    noResultsFound: 'No results found!', // text to be displayed when no items are found while searching
    searchPlaceholder: 'Search transversal skills', // label thats displayed in search input,
    searchOnKey: 'preferredLabel' // key on which search should be performed. if undefined this will be extensive search on all keys
  };


  taxonomy = [
    {
      name: 'Remember',
      content: ['choose', 'define', 'find', 'identify', 'list', 'locate', 'name', 'recognize', 'relate', 'remember', 'select', 'state', 'write']
    },
    {
      name :  'Understand',
      content : [
        'cite', 'classify', 'compare', 'contrast', 'deliver', 'demonstrate', 'discuss', 'estimate', 'explain', 'illustrate', 'indicate',
        'interpret', 'outline', 'relate', 'report', 'review', 'understand'
      ]
    },
    {
      name :  'Apply',
      content : [
        'apply', 'build', 'calculate', 'choose', 'classify', 'construct', 'correlate', 'demonstrate', 'develop', 'identify', 'illustrate', 'implement', 'interpret',
        'model', 'organise', 'perform', 'plan', 'relate', 'represent', 'select', 'solve', 'teach', 'use'
      ]
    },
    {
      name :  'Analyze',
      content : [
        'analyse', 'arrange', 'choose', 'classify', 'compare', 'differentiate', 'distinguish', 'examine', 'find', 'install', 'list',
        'order', 'prioritize', 'query', 'research', 'select'
      ]
    },
    {
      name :  'Evaluate',
      content : [
        'assess', 'check', 'choose', 'compare', 'decide', 'defend', 'determine', 'estimate', 'evaluate', 'explain', 'interpret', 'judge', 'justify',
        'measure', 'prioritize', 'recommend', 'select', 'test', 'validate'
      ]
    },
    {
      name :  'Create',
      content : [
        'add to', 'build', 'change', 'choose', 'compile', 'construct', 'convert', 'create', 'design', 'develop', 'devise', 'discuss', 'estimate',
        'manage', 'model', 'modify', 'plan', 'process', 'produce', 'propose', 'revise', 'solve', 'test', 'transform'
      ]
    },
  ];

  modalRef: BsModalRef;


  canMakePublicProfiles = false;
  userOrgs: Organization[] = [];
  saveOrg: Organization;
  currentUser: User;

  selectedCompetencesPrefLabel: string[];

  @ViewChild('textBoK') textBoK: ElementRef;

  observer: MutationObserver;
  lastBoKTitle = 'GIST';

  searchInputField = '';

  userDivisions: string[] = [];
  saveDiv = '';

  constructor(
    private occuprofilesService: OcuprofilesService,
    private organizationService: OrganizationService,
    private userService: UserService,
    public fieldsService: FieldsService,
    public escoService: EscoCompetenceService,
    private route: ActivatedRoute,
    private afAuth: AngularFireAuth,
    private modalService: BsModalService
  ) {
    this.competences = this.escoService.basicCompetences;
    this.filteredCompetences = this.competences;
    this.afAuth.auth.onAuthStateChanged(user => {
      if (user) {
        this.userService.getUserById(user.uid).subscribe(userDB => {
          this.currentUser = new User(userDB);
          if (this.currentUser.organizations && this.currentUser.organizations.length > 0) {
            this.currentUser.organizations.forEach(orgId => {
              this.organizationService.getOrganizationById(orgId).subscribe(org => {
                if (org) {
                  this.userOrgs.push(org);
                  this.saveOrg = this.userOrgs[0];
                  this.setOrganization();
                  this.loadDivisions();
                }
              });
            });
          }
        });
      }
    });
  }

  ngOnInit() {
    const inputObject = {
      svgId: '#bubbles',
      textId: '#textBoK',
      urls: environment.URL_ARRAY
    };
    bok.visualizeBOKData(inputObject);
    this.getMode();

    this.observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if ((<any>mutation.target).children[1].innerText !== this.lastBoKTitle) {
          this.lastBoKTitle = (<any>mutation.target).children[1].innerText;
          this.hasResults = false;
        }
      });
    });
    const config = { attributes: true, childList: true, characterData: true };

    this.observer.observe(this.textBoK.nativeElement, config);

  }

  addBokKnowledge() {
    this.associatedSkillsToDelete = 0;
    const divs = this.textBoK.nativeElement.getElementsByTagName('div');
    if (divs['bokskills'] != null) {
      const shortCode = this.textBoK.nativeElement.getElementsByTagName('h4')[0].innerText.split(' ')[0];
      const as = divs['bokskills'].getElementsByTagName('a');
      for (const skill of as) {
        if (!this.model.skills.includes(shortCode + ' ' + skill.innerText)) {
          this.model.skills.push(shortCode + ' ' + skill.innerText);
          this.associatedSkillsToDelete++;
        }
      }
    }
    const concept = this.textBoK.nativeElement.getElementsByTagName('h4')[0]
      .textContent;
    if (!this.model.knowledge.includes(concept)) {
      this.model.knowledge.push(concept);
    }
    console.log('added knowledge');
    this.isShowingSkillsTip = true;
  }

  removeCompetence(name: any, array: any[]) {
    if (typeof (name) === 'string') { // for skills
      this.nameCodeToDelete = '';
      array.forEach((item, index) => {
        if (item === name) {
          console.log('removing concept' + name);
          array.splice(index, 1);
          array = [...array];
          console.log('array after: ');
          console.log(array);
          this.nameCodeToDelete = name.split(']')[0];
        }
      });
      const skillsFiltered = [];
      this.model.skills.forEach((sk, i) => {
        //  console.log('code skill' + sk.split(']')[0] + '=' + this.nameCodeToDelete);
        if (sk.split(']')[0] === this.nameCodeToDelete) { // There is a knowledge that starts with same code, don't include it
          skillsFiltered.push(sk);
        }
      });
      this.associatedSkillsToDelete = skillsFiltered.length;
    } else { // for transversal skills
      array.forEach((item, index) => {
        if (item.preferredLabel === name.preferredLabel) {
          console.log('removing concept trans' + name);
          array.splice(index, 1);
          array = [...array];
          console.log('array after trans: ');
          console.log(array);
          this.competences = [...this.competences];
          this.model.competences = [...this.model.competences];
        }
      });
    }
  }

  compareFn(a, b) {
    return a.preferredLabel === b.preferredLabel;
  }

  removeField(f: Field) {
    this.model.fields.forEach((item, index) => {
      if (item === f) {
        //  console.log('removing concept' + name);
        this.model.fields.splice(index, 1);
      }
    });
    this.model.fields = [...this.model.fields];
  }

  removeSkillsAssociated() {
    const skillsFiltered = [];
    this.model.skills.forEach((sk, i) => {
      // console.log('code skill' + sk.split(']')[0] + '=' + this.nameCodeToDelete);
      if (sk.split(']')[0] !== this.nameCodeToDelete) { // There is a knowledge that starts with same code, don't include it
        skillsFiltered.push(sk);
      }
    });
    this.model.skills = skillsFiltered;
  }

  saveOccuProfile() {
    this.model.userId = this.afAuth.auth.currentUser.uid;
    this.model.orgId = this.saveOrg._id;
    this.model.orgName = this.saveOrg.name;
    this.model.isPublic = this.model.isPublic;
    this.model.division = this.saveDiv;
    this.model.lastModified = new Date().toDateString();
    if (this.mode === 'copy') {
      this.occuprofilesService.updateOccuProfile(this._id, this.model);
    } else {
      this.occuprofilesService.addNewOccuProfile(this.model);
    }
  }

  getMode(): void {
    this.mode = this.route.snapshot.paramMap.get('mode');
    if (this.mode === 'duplicate' || this.mode === 'copy') {
      if (this.mode === 'copy') {
        this.title = 'Copy Occupational Profile';
      } else {
        this.title = 'Duplicate Occupational Profile';

      }
      this.getOccuProfileId();
      this.fillForm();
    } else {
      this.title = 'Add New Occupational Profile';
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

  setOrganization() {
    // iterate orgs to select right one
    if (this.userOrgs.length > 0 && this.currentUser && this.model) {
      this.userOrgs.forEach(o => {
        if (o._id === this.model.orgId) {
          this.saveOrg = o;
          this.loadDivisions();
        }
      });
    }
  }

  searchInBok(text: string) {
    if (text === '' || text === ' ') {
      this.cleanResults();
    } else {
      this.selectedNodes = bok.searchInBoK(text);
      this.hasResults = true;
      this.currentConcept = '';
      this.cleanTip();
    }
  }

  cleanResults() {
    this.searchInputField = '';
    bok.searchInBoK('');
    this.navigateToConcept('GIST');
  }

  navigateToConcept(conceptName) {
    bok.browseToConcept(conceptName);
    this.currentConcept = conceptName;
    this.hasResults = false;
    this.cleanTip();
  }

  cleanTip() {
    this.isShowingSkillsTip = false;
  }

  incrementLimit() {
    this.limitSearchTo = this.limitSearchTo + 10;
    this.limitSearchFrom = this.limitSearchFrom + 10;
  }

  decrementLimit() {
    this.limitSearchTo = this.limitSearchTo - 10;
    this.limitSearchFrom = this.limitSearchFrom - 10;
  }

  addExtraSkill(skill) {
    this.model.skills.push(skill);
    this.model.customSkills.push(skill);
  }

  // Add custom competence to model to force updating component, and to competences lists to find it again if removed
  addExtraCompetence(comp) {
    this.model.competences = [...this.model.competences, { preferredLabel: comp, reuseLevel: 'custom'  }];
    this.competences = [...this.competences, { preferredLabel: comp, reuseLevel: 'custom' }];
    this.model.customCompetences.push(comp);
    this.escoService.allcompetences = [...this.escoService.allcompetences, { preferredLabel: comp, reuseLevel: 'custom'  }];
    this.escoService.basicCompetences = [...this.escoService.basicCompetences, { preferredLabel: comp, reuseLevel: 'custom', uri: null }];
    // console.log('add compr:' + comp);
  }

  fullListESCO() {
    /* this.escoService.allcompetences.forEach(com => {
      if (com.preferredLabel == null) {
       console.log('ERROR ' + com.uri);
      }
     });
     */
    this.isfullESCOcompetences = !this.isfullESCOcompetences;
  }

  // custom search to match term also in altLabels
  customSearchFn(term: string, item: Competence) {
    let found = false;
    term = term.toLocaleLowerCase();
    if (item.preferredLabel.toLocaleLowerCase().indexOf(term) > -1) {
      found = true;
    }
    if (item.altLabels && item.altLabels.length > 0) {
      item.altLabels.forEach((alt) => {
        if (alt.toLocaleLowerCase().indexOf(term) > -1) {
          found = true;
        }
      });
    }
    return found;
  }

  openModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template, {class: 'modal-lg'});
  }

  loadDivisions() {
    this.userDivisions = this.saveOrg.divisions ? this.saveOrg.divisions : [];
    this.saveDiv = this.model ? this.model.division ? this.model.division : '' : '';
  }
}
