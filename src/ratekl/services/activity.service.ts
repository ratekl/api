import { UserProfile, securityId } from '@loopback/security';
import { BindingKey } from "@loopback/core";
import { ActivityDomainType, ActivityItemType, ActivityType } from '../../models/activity.model';

const state = {
  activities: {}
};

export interface ActivityService {
  setActivity(domain: string, userProfile: UserProfile, key: string, value: string): Promise<void>;
  setAllDomainActivity(data?: ActivityDomainType): Promise<void>;
  getActivityByUser(domain: string, userProfile: UserProfile, key: string): Promise<string>;
  getActivity(domain: string, key: string): Promise<ActivityItemType>;
  getAllActivity(domain: string): Promise<ActivityType>;
  getAllDomainActivity(): Promise<ActivityDomainType>;
}

export class RateklActivityService implements ActivityService {
  private activities: ActivityDomainType = state.activities;

  async setActivity(domain: string, userProfile: UserProfile, key: string, value: string) {
    if (!this.activities[domain]) {
      this.activities[domain] = {};
    }

    if (!this.activities[domain][key]) {
      this.activities[domain][key] = {};
    }
    
    this.activities[domain][key][userProfile.email ?? userProfile[securityId]] = value;
  }

  async setAllDomainActivity(data?: ActivityDomainType) {
    state.activities = data ?? {};
    this.activities = state.activities;
  }
  
  async getActivityByUser(domain: string, userProfile: UserProfile, key: string) {
    if (!this.activities[domain]) {
      return '';
    }
    
    if (!this.activities[domain][key]) {
      return '';
    }

    return this.activities[domain][key][ userProfile.email ?? userProfile[securityId]] ?? '';
  }

  async getActivity(domain: string, key: string) {
    if (!this.activities[domain]) {
      return {};
    }
  
    return this.activities[domain][key] ?? {};
  }

  async getAllActivity(domain: string) {
    return this.activities[domain] ?? {};
  }

  async getAllDomainActivity() {
    return this.activities;
  }
}

export namespace ActivityServiceBindings {
  export const ACTIVITY_SERVICE = BindingKey.create<ActivityService>(
    'services.activity.service',
  );
}