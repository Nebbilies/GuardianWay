import { Redirect } from 'expo-router';

import { RegistrationListScreen } from '@/transport/registrations/list-screen';
import { useRegistrationAccess } from '@/transport/registrations/registration-provider';

export default function RegistrationsRoute() {
  return useRegistrationAccess() ? (
    <RegistrationListScreen />
  ) : (
    <Redirect href="/" />
  );
}
