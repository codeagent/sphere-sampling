import { Injectable } from "@angular/core";

@Injectable()
export class StorageService {
  get<T = any>(key: string) {
    try {
      return JSON.parse(self.localStorage.getItem(key)) as T;
    } catch {
      return null as T;
    }
  }

  set<T>(key: string, value: T) {
    self.localStorage.setItem(key, JSON.stringify(value));
  }
}
