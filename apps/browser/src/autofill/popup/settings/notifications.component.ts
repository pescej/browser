import { Component, OnInit } from "@angular/core";
import { firstValueFrom } from "rxjs";

import { UserNotificationSettingsServiceAbstraction } from "@bitwarden/common/autofill/services/user-notification-settings.service";
import { VaultSettingsService } from "@bitwarden/common/vault/abstractions/vault-settings/vault-settings.service";

import { enableAccountSwitching } from "../../../platform/flags";

@Component({
  selector: "autofill-notification-settings",
  templateUrl: "notifications.component.html",
})
export class NotifcationsSettingsComponent implements OnInit {
  enableAddLoginNotification = false;
  enableChangedPasswordNotification = false;
  enablePasskeys = true;
  accountSwitcherEnabled = false;

  constructor(
    private userNotificationSettingsService: UserNotificationSettingsServiceAbstraction,
    private vaultSettingsService: VaultSettingsService,
  ) {
    this.accountSwitcherEnabled = enableAccountSwitching();
  }

  async ngOnInit() {
    this.enableAddLoginNotification = await firstValueFrom(
      this.userNotificationSettingsService.enableAddedLoginPrompt$,
    );

    this.enableChangedPasswordNotification = await firstValueFrom(
      this.userNotificationSettingsService.enableChangedPasswordPrompt$,
    );

    this.enablePasskeys = await firstValueFrom(this.vaultSettingsService.enablePasskeys$);
  }

  async updateAddLoginNotification() {
    await this.userNotificationSettingsService.setEnableAddedLoginPrompt(
      this.enableAddLoginNotification,
    );
  }

  async updateChangedPasswordNotification() {
    await this.userNotificationSettingsService.setEnableChangedPasswordPrompt(
      this.enableChangedPasswordNotification,
    );
  }

  async updateEnablePasskeys() {
    await this.vaultSettingsService.setEnablePasskeys(this.enablePasskeys);
  }
}
