import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const collection = 'Fields';

export interface Field { name: string; code: Number; parent: string; grandparent: string; greatgrandparent: string; }

@Injectable({
  providedIn: 'root'
})
export class FieldsService {
  public allfields: any;
  public result: any;
  constructor(
    private http: HttpClient) {

    // TODO: Move fields.json to firebase storage - gives a CORS error
    // const ref = this.storage.ref('fields.json');
    //  ref.getDownloadURL().subscribe(function(url) {

    this.http.get('assets/json/fields.json').subscribe((data) => {
      this.allfields = data;
    });
    //  });
  }
}

