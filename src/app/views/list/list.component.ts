import { Component, OnInit, OnDestroy, Input, ViewChild } from '@angular/core';
import { NgForOf } from '@angular/common';
import { Observable, Subscription } from 'rxjs';
import { OcupationalProfile } from '../../ocupational-profile';
import { OcuprofilesService } from '../../services/ocuprofiles.service';
import { FormControl } from '@angular/forms';
import { ModalDirective, ModalOptions } from 'ngx-bootstrap/modal';
import { AngularFireAuth } from '@angular/fire/auth';
import { User, UserService } from '../../services/user.service';
import { OrganizationService, Organization } from '../../services/organization.service';
import { ActivatedRoute } from '@angular/router';
import * as cloneDeep from 'lodash/cloneDeep';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit {
  occupationalProfiles: OcupationalProfile[];
  advancedSearch = false;
  filteredOccuProfiles: any[];
  searchText: string;
  knowledgeFilter: Boolean = true;
  skillFilter: Boolean = true;
  competencesFilter: Boolean = true;
  isAnonymous = null;
  currentUser: User = new User();
  sortNameAsc = true;
  sortOrgAsc = true;
  sortUpdAsc = true;
  sortedBy = 'lastUpdated';
  public paginationLimitFrom = 0;
  public paginationLimitTo = 6;
  public LIMIT_PER_PAGE = 6;
  public currentPage = 0;
  showOnlyAuthor = -1;

  @ViewChild('dangerModal') public dangerModal: ModalDirective;
  @ViewChild('releaseNotesModal') public releaseNotesModal: any;

  constructor(private occuprofilesService: OcuprofilesService,
    private userService: UserService,
    public organizationService: OrganizationService,
    private route: ActivatedRoute,
    public afAuth: AngularFireAuth) {
    this.afAuth.auth.onAuthStateChanged(user => {
      if (user) {
        this.isAnonymous = user.isAnonymous;
        this.userService.getUserById(user.uid).subscribe(userDB => {
          this.currentUser = new User(userDB);
          this.occuprofilesService
            .subscribeToOccupationalProfiles()
            .subscribe(occuProfiles => {
              this.occupationalProfiles = [];
              occuProfiles.forEach(op => {
                if (op.isPublic) {
                  this.occupationalProfiles.push(op);
                } else if (this.currentUser && this.currentUser.organizations && this.currentUser.organizations.indexOf(op.orgId) > -1) {
                  this.occupationalProfiles.push(op);
                }
              });
              this.filteredOccuProfiles = this.occupationalProfiles;
              this.sortBy('lastUpdated');
            });
        });
      } else {
        this.isAnonymous = true;
      }
      this.occuprofilesService
        .subscribeToOccupationalProfiles()
        .subscribe(occuProfiles => {
          this.occupationalProfiles = [];
          occuProfiles.forEach(op => {
            if (op.isPublic) {
              this.occupationalProfiles.push(op);
            }
          });
          this.filteredOccuProfiles = this.occupationalProfiles;
          this.sortBy('lastUpdated');
        });
    });
    this.organizationService.subscribeToOrganizations().subscribe(orgs => {
      let allOrgsWithDiv = [];
      orgs.forEach(o => {
        const copyOrg = cloneDeep(o);
        copyOrg.description = o.name;
        allOrgsWithDiv.push(copyOrg);
        if (o.divisions) {
          o.divisions.forEach(d => {
            const copyOrgD = cloneDeep(o);
            copyOrgD.description = o.name + ' - ' + d;
            allOrgsWithDiv.push(copyOrgD);
          });
        }
      });
    });
  }

  ngOnInit() {
    if (this.route.snapshot.url[0].path === 'release-notes') {
      const config: ModalOptions = { backdrop: true, keyboard: true };
      this.releaseNotesModal.basicModal.config = config;
      this.releaseNotesModal.basicModal.show({});
    }
  }

  removeOccuProfile(id: string) {
    this.occuprofilesService.removeOccuProfile(id);
  }

  filter() {
    this.paginationLimitFrom = 0;
    this.paginationLimitTo = this.LIMIT_PER_PAGE;
    this.currentPage = 0;
    this.occupationalProfiles.forEach(sp => {
      if (!sp.division) {
        sp.division = '';
      }
    });
    const search = this.searchText.toLowerCase();
    this.filteredOccuProfiles = [];
    this.filteredOccuProfiles = this.occupationalProfiles.filter(
      it =>
        it.title.toLowerCase().includes(search) ||
        it.description.toLowerCase().includes(search) ||
        it.orgName.toLowerCase().includes(search) ||
        it.division.toLowerCase().includes(search)
    );
    if (this.advancedSearch) {
      this.applyFilters();
    }
    this.showOnlyAuthor = -1;
  }

  applyFilters() {
    this.occupationalProfiles.forEach(occ => {
      if (this.knowledgeFilter) {
        occ.knowledge.forEach(know => {
          if (know.toLowerCase().includes(this.searchText.toLowerCase())) {
            if (this.filteredOccuProfiles.indexOf(occ) === -1) {
              this.filteredOccuProfiles.push(occ);
            }
          }
        });
      }
      if (this.skillFilter) {
        occ.skills.forEach(ski => {
          if (ski.toLowerCase().includes(this.searchText.toLowerCase())) {
            if (this.filteredOccuProfiles.indexOf(occ) === -1) {
              this.filteredOccuProfiles.push(occ);
            }
          }
        });
      }
      if (this.competencesFilter) {
        occ.competences.forEach(comp => {
          if (comp.preferredLabel.toLowerCase().includes(this.searchText.toLowerCase())) {
            if (this.filteredOccuProfiles.indexOf(occ) === -1) {
              this.filteredOccuProfiles.push(occ);
            }
          }
        });
      }
    });
  }
  sortBy(attr) {
    this.paginationLimitFrom = 0;
    this.paginationLimitTo = this.LIMIT_PER_PAGE;
    this.currentPage = 0;
    switch (attr) {
      case 'name':
        this.sortNameAsc = !this.sortNameAsc;
        this.sortedBy = 'name';
        // tslint:disable-next-line:max-line-length
        this.filteredOccuProfiles.sort((a, b) => (a.title.toLowerCase() > b.title.toLowerCase()) ? this.sortNameAsc ? 1 : -1 : this.sortNameAsc ? -1 : 1);
        break;
      case 'lastUpdated':
        this.sortUpdAsc = !this.sortUpdAsc;
        this.sortedBy = 'lastUpdated';
        this.filteredOccuProfiles.sort((a, b) => (a.updatedAt > b.updatedAt) ? this.sortUpdAsc ? 1 : -1 : this.sortUpdAsc ? -1 : 1);
        break;
      case 'organization':
        this.sortOrgAsc = !this.sortOrgAsc;
        this.sortedBy = 'organization';
        // tslint:disable-next-line:max-line-length
        this.filteredOccuProfiles.sort((a, b) => (a.orgName.toLowerCase() > b.orgName.toLowerCase()) ? this.sortOrgAsc ? 1 : -1 : this.sortOrgAsc ? -1 : 1);
        break;
    }
  }
  range(size, startAt = 0) {
    size = Math.ceil(size);
    if (size === 0) {
      size = 1;
    }
    return [...Array(size).keys()].map(i => i + startAt);
  }

  nextPage() {
    if (this.currentPage + 1 < this.filteredOccuProfiles.length / this.LIMIT_PER_PAGE) {
      this.paginationLimitFrom = this.paginationLimitFrom + this.LIMIT_PER_PAGE;
      this.paginationLimitTo = this.paginationLimitTo + this.LIMIT_PER_PAGE;
      this.currentPage++;
    }
    console.log('Next Page: ' + this.paginationLimitFrom + ' to ' + this.paginationLimitTo + ' Current Page : ' + this.currentPage);
  }

  previousPage() {
    if (this.currentPage > 0) {
      this.paginationLimitFrom = this.paginationLimitFrom - this.LIMIT_PER_PAGE;
      this.paginationLimitTo = this.paginationLimitTo - this.LIMIT_PER_PAGE;
      this.currentPage--;
    }
    console.log('Previous Page: ' + this.paginationLimitFrom + ' to ' + this.paginationLimitTo + ' Current Page : ' + this.currentPage);
  }

  filterByAuthor(author) {
    this.filteredOccuProfiles = [];
    this.paginationLimitFrom = 0;
    this.paginationLimitTo = 6;
    this.currentPage = 0;
    this.searchText = '';
    if (author === -1) { // all
      this.filteredOccuProfiles = this.occupationalProfiles;
    } else if (author === 0) { // mine
      this.filteredOccuProfiles = this.occupationalProfiles.filter(
        it =>
          it.userId === this.currentUser._id
      );
    } else if (author === 1) { // my orgs
      this.filteredOccuProfiles = this.occupationalProfiles.filter(
        it =>
          this.currentUser.organizations.includes(it.orgId)
      );
    }
  }
}
