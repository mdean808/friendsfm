import type { ActiveRequest } from '../types';

export default class ActiveRequests {
  requests: ActiveRequest[] = [];

  constructor() {}

  public add(request: ActiveRequest) {
    this.requests.push(request);
  }

  public get(url: string) {
    return this.requests.find((r) => r.url === url);
  }

  public remove(request: ActiveRequest) {
    this.requests = this.requests.filter((r) => r.url === request.url);
  }
}
