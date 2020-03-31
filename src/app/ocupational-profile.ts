import { Field } from './services/fields.service';

export interface Competence {
  uri?: String;
  skillType?: String;
  reuseLevel?: String;
  preferredLabel: String;
  description?: String;
  altLabels?: String[];
}

export class OcupationalProfile extends Object {
  constructor(
    public _id: string,
    public userId: string,
    public orgId: string,
    public orgName: string,
    public title: string,
    public description: string,
    public fields: Field[],
    public eqf: number,
    public knowledge: string[],
    public skills: string[],
    public customSkills: string[],
    public customCompetences: string[],
    public competences: Competence[],
    public lastModified: string,
    public isPublic: boolean = false
  ) {
    super();
  }
}
