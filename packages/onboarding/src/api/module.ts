import { ApiModule } from "@u7/core/api";
import type {
  OnboardingApiModuleResolver,
  OnboardingModuleMeta,
} from "#domain/module";
import { CreateApplicationUc } from "./application/create-application-uc";
import { GetApplicationByUserIdUc } from "./application/get-application-by-user-id-uc";
import { GetApplicationUc } from "./application/get-application-uc";
import { ListApplicationsUc } from "./application/list-applications-uc";
import { UpdateApplicationUc } from "./application/update-application-uc";

export class OnboardingApiModule extends ApiModule<
  OnboardingModuleMeta,
  OnboardingApiModuleResolver
> {
  readonly name = "onboarding" as const;
  readonly useCases = [
    new CreateApplicationUc(),
    new GetApplicationUc(),
    new ListApplicationsUc(),
    new GetApplicationByUserIdUc(),
    new UpdateApplicationUc(),
  ];
}
