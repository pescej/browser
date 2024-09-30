import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { FormBuilder } from "@angular/forms";
import { BehaviorSubject, skip, Subject, takeUntil } from "rxjs";

import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { UserId } from "@bitwarden/common/types/guid";
import {
  CredentialGeneratorService,
  EffUsernameGenerationOptions,
  Generators,
} from "@bitwarden/generator-core";

import { DependenciesModule } from "./dependencies";
import { completeOnAccountSwitch } from "./util";

/** Options group for usernames */
@Component({
  standalone: true,
  selector: "tools-username-settings",
  templateUrl: "username-settings.component.html",
  imports: [DependenciesModule],
})
export class UsernameSettingsComponent implements OnInit, OnDestroy {
  /** Instantiates the component
   *  @param accountService queries user availability
   *  @param generatorService settings and policy logic
   *  @param formBuilder reactive form controls
   */
  constructor(
    private formBuilder: FormBuilder,
    private generatorService: CredentialGeneratorService,
    private accountService: AccountService,
  ) {}

  /** Binds the component to a specific user's settings.
   *  When this input is not provided, the form binds to the active
   *  user
   */
  @Input()
  userId: UserId | null;

  /** Emits settings updates and completes if the settings become unavailable.
   * @remarks this does not emit the initial settings. If you would like
   *   to receive live settings updates including the initial update,
   *   use `CredentialGeneratorService.settings$(...)` instead.
   */
  @Output()
  readonly onUpdated = new EventEmitter<EffUsernameGenerationOptions>();

  /** The template's control bindings */
  protected settings = this.formBuilder.group({
    wordCapitalize: [Generators.username.settings.initial.wordCapitalize],
    wordIncludeNumber: [Generators.username.settings.initial.wordIncludeNumber],
  });

  async ngOnInit() {
    const singleUserId$ = this.singleUserId$();
    const settings = await this.generatorService.settings(Generators.username, { singleUserId$ });

    settings.pipe(takeUntil(this.destroyed$)).subscribe((s) => {
      this.settings.patchValue(s, { emitEvent: false });
    });

    // the first emission is the current value; subsequent emissions are updates
    settings.pipe(skip(1), takeUntil(this.destroyed$)).subscribe(this.onUpdated);

    this.settings.valueChanges.pipe(takeUntil(this.destroyed$)).subscribe(settings);
  }

  private singleUserId$() {
    // FIXME: this branch should probably scan for the user and make sure
    // the account is unlocked
    if (this.userId) {
      return new BehaviorSubject(this.userId as UserId).asObservable();
    }

    return this.accountService.activeAccount$.pipe(
      completeOnAccountSwitch(),
      takeUntil(this.destroyed$),
    );
  }

  private readonly destroyed$ = new Subject<void>();
  ngOnDestroy(): void {
    this.destroyed$.complete();
  }
}