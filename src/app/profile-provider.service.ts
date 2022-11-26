import { Injectable } from '@angular/core';
import { AccountInfo } from './account-info';

const CURRENT_ACCOUNT = 'current-account';

@Injectable ({
  providedIn: 'root'
})
export class ProfileProviderService {

  private account: AccountInfo = undefined;

  constructor() {
  }

  get currentAccount(): AccountInfo {
    if (!Boolean(this.account)) {
      throw new Error('User is not logged in.');
    }
    return this.account;
  }

  async currentAccountAsync(): Promise<AccountInfo> {
    if (this.account === undefined) {
      const accountStr = await window['store'].getSetting (CURRENT_ACCOUNT) as string;
      if (accountStr) {
        this.account = JSON.parse (accountStr);
      } else {
        this.account = null;
      }
    }
    return this.account;
  }

  async setUserProfile(profile: AccountInfo, rememberMe: boolean) {
    if (rememberMe) {
      await window['store'].setSetting (CURRENT_ACCOUNT, JSON.stringify (profile));
    }
    this.account = profile;
  }

  async resetProfile() {
    this.account = undefined;
    await window['store'].setSetting (CURRENT_ACCOUNT, null);
    // store.delete (CURRENT_ACCOUNT);
  }
}
