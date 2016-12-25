import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';

import { Observable } from 'rxjs/Observable';

@Injectable()
export class TranscriptService {
  private transcriptUrl = '/api/transcript';

  constructor (private http: Http) {}

  
}